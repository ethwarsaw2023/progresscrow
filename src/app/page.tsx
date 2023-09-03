"use client";

import { Steps, Step } from "chakra-ui-steps";

import { useEffect, useState } from "react";
import { parseUnits, zeroAddress } from "viem";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  useWalletClient,
  useAccount,
  useNetwork,
  useSwitchNetwork,
} from "wagmi";
import {
  RequestNetwork,
  Types,
  Utils,
} from "@requestnetwork/request-client.js";
import { Web3SignatureProvider } from "@requestnetwork/web3-signature";
import {
  approveErc20,
  hasErc20Approval,
  hasSufficientFunds,
  payRequest,
} from "@requestnetwork/payment-processor";
import { getPaymentNetworkExtension } from "@requestnetwork/payment-detection";
import {
  Box,
  Button,
  Center,
  Divider,
  Flex,
  HStack,
  Heading,
  Input,
  SimpleGrid,
  Spacer,
  VStack,
  useSteps,
  useToast,
  Image,
} from "@chakra-ui/react";
import { IoCheckmarkCircleSharp } from "react-icons/io5";
import Confetti from "react-confetti";

import { useProvider } from "@/hooks/useProvider";
import { useSigner } from "@/hooks/useSigner";
import { APP_STATUS } from "@/config/status";
import { currency as currencyData } from "@/config/currency";
import { storageChainData } from "@/config/storage-chain";

import "@rainbow-me/rainbowkit/styles.css";

export default function Home() {
  const toast = useToast({
    position: "top-left",
  });
  const [imageURL, setImageURL] = useState<string>();
  const [expectedAmount, setExpectedAmount] = useState<string>();
  const [isAccepted, setIsAccepted] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [paymentRecipient, setPaymentRecipient] = useState<string>();
  const [payerIdentity, setPayerIdentity] = useState<string>();
  const [dueDate, setDueDate] = useState<string>();
  const [status, setStatus] = useState(APP_STATUS.AWAITING_INPUT);
  const { data: walletClient, isError, isLoading } = useWalletClient();
  const { address, isConnecting, isDisconnected } = useAccount();
  const { chain } = useNetwork();
  const {
    chains,
    error,
    isLoading: isSwitchNetworkLoading,
    switchNetwork,
  } = useSwitchNetwork();
  const [requestData, setRequestData] =
    useState<Types.IRequestDataWithEvents>();
  const provider = useProvider();
  const signer = useSigner();

  const { goToNext, goToPrevious, activeStep } = useSteps({
    count: 3,
  });

  const handleRequestPayment = async () => {
    try {
      const requestClient = new RequestNetwork({
        nodeConnectionConfig: {
          baseURL: storageChainData.gateway,
        },
      });

      const targetRequest = await requestClient.fromRequestId(
        requestData!.requestId
      );
      let targetRequestData = targetRequest.getData();
      const paymentTx = await payRequest(targetRequestData, signer, "5000", {
        gasLimit: "0x4C4B40",
      });
      await paymentTx.wait(2);

      while (
        targetRequestData.balance?.balance! < targetRequestData.expectedAmount
      ) {
        targetRequestData = await targetRequest.refresh();
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      setRequestData(targetRequestData);
      setStatus(APP_STATUS.REQUEST_PAID);
    } catch (err) {
      setStatus(APP_STATUS.APPROVED);
      alert(err);
    }
  };

  const canPayRequest =
    status === APP_STATUS.APPROVED &&
    !isDisconnected &&
    !isConnecting &&
    !isError &&
    !isLoading &&
    !isSwitchNetworkLoading &&
    requestData?.currencyInfo.network === chain?.network;

  const handlePayment = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    // if (!canPayRequest) {
    //   return toast({
    //     status: "error",
    //     title: "Payment",
    //     description: "Request cannot be paid",
    //   });
    // }
    toast({
      description: requestData?.currencyInfo.network === chain?.network,
    });

    setStatus(APP_STATUS.PAYING);
    handleRequestPayment();
  };

  const approve = async () => {
    try {
      const requestClient = new RequestNetwork({
        nodeConnectionConfig: {
          baseURL: storageChainData.gateway,
        },
      });

      const targetRequest = await requestClient.fromRequestId(
        requestData!.requestId
      );
      const targetRequestData = targetRequest.getData();
      const isSolvent = await hasSufficientFunds(
        targetRequestData,
        address as string,
        { provider: provider }
      );

      if (!isSolvent) {
        setStatus(APP_STATUS.REQUEST_CONFIRMED);
        return;
      }

      const paymentNetworkExtensionId =
        getPaymentNetworkExtension(targetRequestData)?.id;
      const feeProxyContract =
        Types.Extension.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT;

      if (!paymentNetworkExtensionId) return;
      if (paymentNetworkExtensionId !== feeProxyContract) return;

      const isSpendingApproved = await hasErc20Approval(
        targetRequestData,
        address as string,
        provider
      );
      if (!isSpendingApproved) {
        const approvalTx = await approveErc20(targetRequestData, signer);
        await approvalTx.wait(2);
      }
      setStatus(APP_STATUS.APPROVED);
    } catch (err) {
      setStatus(APP_STATUS.REQUEST_CONFIRMED);
      alert(JSON.stringify(err));
    }
  };

  const canApprove =
    status === APP_STATUS.REQUEST_CONFIRMED &&
    !isDisconnected &&
    !isConnecting &&
    !isError &&
    !isLoading &&
    !isSwitchNetworkLoading &&
    requestData?.currencyInfo.network === chain?.network;

  const handleApprove = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!canApprove) {
      return toast({
        status: "error",
        title: "Approval",
        description: "ERC20 spending cannot be approved",
      });
    }

    setStatus(APP_STATUS.APPROVING);
    approve();
  };

  const createRequest = async () => {
    const signatureProvider = new Web3SignatureProvider(walletClient);
    const requestClient = new RequestNetwork({
      nodeConnectionConfig: {
        baseURL: storageChainData.gateway,
      },
      signatureProvider,
    });
    const requestCreateParameters = {
      requestInfo: {
        currency: {
          type: currencyData.type,
          value: currencyData.value,
          network: currencyData.network,
        },
        expectedAmount: parseUnits(
          expectedAmount as `${number}`,
          currencyData.decimals
        ).toString(),
        payee: {
          type: Types.Identity.TYPE.ETHEREUM_ADDRESS,
          value: address as string,
        },
        timestamp: Utils.getCurrentTimestampInSecond(),
      },
      paymentNetwork: {
        id: Types.Extension.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT,
        parameters: {
          paymentNetworkName: currencyData.network,
          paymentAddress: paymentRecipient || address,
          feeAddress: zeroAddress,
          feeAmount: "0",
        },
      },
      contentData: {
        dueDate: dueDate,
      },
      signer: {
        type: Types.Identity.TYPE.ETHEREUM_ADDRESS,
        value: address as string,
      },
    } satisfies Types.ICreateRequestParameters;

    if (payerIdentity && payerIdentity.length > 0) {
      requestCreateParameters.requestInfo.payer = {
        type: Types.Identity.TYPE.ETHEREUM_ADDRESS,
        value: payerIdentity,
      };
    }

    try {
      setStatus(APP_STATUS.PERSISTING_TO_IPFS);
      const request = await requestClient.createRequest(
        requestCreateParameters
      );

      setStatus(APP_STATUS.PERSISTING_ON_CHAIN);
      setRequestData(request.getData());
      const confirmedRequestData = await request.waitForConfirmation();

      setStatus(APP_STATUS.REQUEST_CONFIRMED);
      setRequestData(confirmedRequestData);
    } catch (err) {
      setStatus(APP_STATUS.ERROR_OCCURRED);
      alert(err);
    }
  };

  const canSubmit =
    status !== APP_STATUS.SUBMITTING &&
    !isDisconnected &&
    !isConnecting &&
    !isError &&
    !isLoading &&
    (paymentRecipient === undefined ||
      paymentRecipient === "" ||
      (paymentRecipient?.startsWith("0x") &&
        paymentRecipient?.length === 42)) &&
    (payerIdentity === undefined ||
      payerIdentity === "" ||
      (payerIdentity.startsWith("0x") && payerIdentity.length === 42)) &&
    expectedAmount &&
    expectedAmount.length > 0;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit) {
      return toast({
        status: "error",
        title: "Request",
        description: "Payment request cannot be submitted",
      });
    }

    setRequestData(undefined);
    setStatus(APP_STATUS.SUBMITTING);
    createRequest();
  };

  const handleClear = () => {
    setRequestData(undefined);
    setStatus(APP_STATUS.AWAITING_INPUT);
  };

  useEffect(() => {
    if (status === APP_STATUS.AWAITING_INPUT) return;

    toast({ status: "success", title: "Status", description: status });
  }, [status, toast]);

  return (
    <>
      <Box p={"50px"} pb={"0px"} pt={"20px"}>
        <Box
          w={"full"}
          background={"white"}
          borderWidth={"1px"}
          borderRadius={"20px"}
          borderColor={"gray.400"}
          shadow={"md"}
          p={"30px"}
        >
          <Center>
            <Steps activeStep={activeStep}>
              <Step
                label="Prepayment"
                description="Make a prepayment to initialize the contract"
              />
              <Step
                label="Sketch"
                description="Show the progress of your work"
              />
              <Step label="Final Product" description="Contract completion" />
            </Steps>
          </Center>
        </Box>
      </Box>
      {activeStep === 0 && (
        <SimpleGrid columns={2} spacing={"30px"} p={"50px"} py={"20px"}>
          <Box
            background={"white"}
            borderWidth={"1px"}
            borderRadius={"20px"}
            borderColor={"gray.400"}
            shadow={"md"}
            p={"30px"}
          >
            <Center mb={"30px"} color={"gray.700"}>
              <Heading>Designer</Heading>
            </Center>
            <form onSubmit={handleSubmit}>
              <VStack spacing={"20px"} alignItems={"start"}>
                <ConnectButton chainStatus="none" showBalance={false} />
                <Box w={"full"}>
                  <Box>Amount</Box>
                  <Input
                    type="number"
                    name="expected-amount"
                    step="any"
                    onChange={(e) => setExpectedAmount(e.target.value)}
                  />
                </Box>
                <Box w={"full"}>
                  <Box>Payment Recipient</Box>
                  <Input
                    type="text"
                    name="payment-recipient"
                    placeholder={address}
                    onChange={(e) => setPaymentRecipient(e.target.value)}
                  />
                </Box>
                <Box w={"full"}>
                  <Box>Payer Identity</Box>
                  <Input
                    type="text"
                    name="payer-identity"
                    placeholder="0x..."
                    onChange={(e) => setPayerIdentity(e.target.value)}
                  />
                </Box>
                <Box w={"full"}>
                  <Box>Due Date</Box>
                  <Input
                    type="date"
                    name="due-date"
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </Box>
                <Button
                  type="submit"
                  isDisabled={!canSubmit}
                  background={"blue.400"}
                  color={"white"}
                  shadow={"sm"}
                >
                  Submit
                </Button>
              </VStack>
            </form>
          </Box>
          <Box
            background={"white"}
            borderWidth={"1px"}
            borderRadius={"20px"}
            borderColor={"gray.400"}
            shadow={"md"}
            p={"30px"}
          >
            <Center mb={"30px"} color={"gray.700"}>
              <Heading>Investor</Heading>
            </Center>
            <VStack spacing={"20px"} alignItems={"start"}>
              <ConnectButton showBalance={false} />
              <Button
                shadow={"sm"}
                background={"blue.400"}
                color={"white"}
                isLoading={isSwitchNetworkLoading}
                isDisabled={
                  !switchNetwork ||
                  !requestData ||
                  requestData?.currencyInfo.network === chain?.network
                }
                onClick={() =>
                  switchNetwork?.(
                    chains.find(
                      (chain) =>
                        chain.network === requestData?.currencyInfo.network
                    )?.id
                  )
                }
                w={"380px"}
              >
                Switch to Payment Chain: {requestData?.currencyInfo.network}
                {isSwitchNetworkLoading && " (switching)"}
              </Button>
              <Button
                shadow={"sm"}
                background={"blue.400"}
                color={"white"}
                type="button"
                isDisabled={!canApprove}
                onClick={handleApprove}
                w={"380px"}
              >
                Approve
              </Button>
              {error && error.message && <Box>{error.message}</Box>}
              <Button
                shadow={"sm"}
                background={"blue.400"}
                color={"white"}
                type="button"
                onClick={handlePayment}
                // isDisabled={!canPayRequest}
                w={"380px"}
              >
                Pay now
              </Button>
            </VStack>
          </Box>
        </SimpleGrid>
      )}
      {activeStep === 1 && (
        <SimpleGrid columns={2} spacing={"30px"} p={"50px"} py={"20px"}>
          <Box
            background={"white"}
            borderWidth={"1px"}
            borderRadius={"20px"}
            borderColor={"gray.400"}
            shadow={"md"}
            p={"30px"}
          >
            <Center mb={"30px"} color={"gray.700"}>
              <Heading>Designer</Heading>
            </Center>
            <VStack align={"start"}>
              <Box></Box>
              <Box>Screenshot URL</Box>
              {imageURL && <Image alt="" src={imageURL} />}
              <Input
                onChange={(e) => setImageURL(e.target.value)}
                value={imageURL ?? ""}
              />
              <Box mt={"20px"}>Demo URL</Box>
              <Input />
              <Flex
                w={"full"}
                justifyContent={"center"}
                alignItems={"center"}
                px={"10px"}
              >
                {isSubmitted ? (
                  <Box fontSize={"3xl"}>
                    <IoCheckmarkCircleSharp />
                  </Box>
                ) : (
                  <Button
                    mt={"20px"}
                    shadow={"sm"}
                    background={"blue.400"}
                    color={"white"}
                    onClick={() => {
                      toast({
                        status: "success",
                        title: "Milestone",
                        description: "Your milestone has been submitted",
                      });
                      setIsSubmitted(true);
                    }}
                  >
                    Submit milestone
                  </Button>
                )}
              </Flex>
            </VStack>
            <Divider orientation="horizontal" my={"20px"} />
            <form onSubmit={handleSubmit}>
              <VStack spacing={"20px"} alignItems={"start"}>
                <ConnectButton chainStatus="none" showBalance={false} />
                <Box w={"full"}>
                  <Box>Amount</Box>
                  <Input
                    type="number"
                    name="expected-amount"
                    step="any"
                    onChange={(e) => setExpectedAmount(e.target.value)}
                  />
                </Box>
                <Box w={"full"}>
                  <Box>Payment Recipient</Box>
                  <Input
                    type="text"
                    name="payment-recipient"
                    placeholder={address}
                    onChange={(e) => setPaymentRecipient(e.target.value)}
                  />
                </Box>
                <Box w={"full"}>
                  <Box>Payer Identity</Box>
                  <Input
                    type="text"
                    name="payer-identity"
                    placeholder="0x..."
                    onChange={(e) => setPayerIdentity(e.target.value)}
                  />
                </Box>
                <Box w={"full"}>
                  <Box>Due Date</Box>
                  <Input
                    type="date"
                    name="due-date"
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </Box>
                <Button
                  shadow={"sm"}
                  background={"blue.400"}
                  color={"white"}
                  type="submit"
                  isDisabled={!canSubmit}
                >
                  Submit
                </Button>
              </VStack>
            </form>
          </Box>
          <Box
            background={"white"}
            borderWidth={"1px"}
            borderRadius={"20px"}
            borderColor={"gray.400"}
            shadow={"md"}
            p={"30px"}
          >
            <Center mb={"30px"} color={"gray.700"}>
              <Heading>Investor</Heading>
            </Center>
            <VStack>
              <Flex
                w={"full"}
                justifyContent={"center"}
                alignItems={"center"}
                px={"10px"}
              >
                {isAccepted ? (
                  <Box fontSize={"3xl"}>
                    <IoCheckmarkCircleSharp />
                  </Box>
                ) : (
                  <Button
                    shadow={"sm"}
                    background={"blue.400"}
                    color={"white"}
                    onClick={() => {
                      toast({
                        status: "success",
                        title: "Milestone",
                        description: "Milestone has been accepted",
                      });
                      setIsAccepted(true);
                    }}
                    isDisabled={!isSubmitted}
                  >
                    Accept
                  </Button>
                )}
              </Flex>
            </VStack>
            <Divider orientation="horizontal" my={"20px"} />
            <VStack spacing={"20px"} alignItems={"start"}>
              <ConnectButton showBalance={false} />
              <Button
                shadow={"sm"}
                background={"blue.400"}
                color={"white"}
                w={"380px"}
                isDisabled={
                  !switchNetwork ||
                  !requestData ||
                  requestData?.currencyInfo.network === chain?.network
                }
                onClick={() =>
                  switchNetwork?.(
                    chains.find(
                      (chain) =>
                        chain.network === requestData?.currencyInfo.network
                    )?.id
                  )
                }
              >
                Switch to Payment Chain: {requestData?.currencyInfo.network}
                {isSwitchNetworkLoading && " (switching)"}
              </Button>
              <Button
                shadow={"sm"}
                background={"blue.400"}
                color={"white"}
                type="button"
                isDisabled={!canApprove}
                onClick={handleApprove}
                w={"380px"}
              >
                Approve
              </Button>
              {error && error.message && <Box>{error.message}</Box>}
              <Button
                shadow={"sm"}
                background={"blue.400"}
                color={"white"}
                type="button"
                onClick={handlePayment}
                // isDisabled={!canPayRequest}
                w={"380px"}
              >
                Pay now
              </Button>
            </VStack>
          </Box>
        </SimpleGrid>
      )}
      {activeStep === 2 && (
        <>
          <Confetti numberOfPieces={600} />
          <Box
            w={"full"}
            p={"50px"}
            py={"20px"}
            height={"500px"}
            position={"relative"}
          >
            <Flex
              h={"full"}
              background={"white"}
              borderWidth={"1px"}
              borderRadius={"20px"}
              borderColor={"gray.400"}
              shadow={"md"}
              p={"30px"}
              alignItems={"center"}
              justifyContent={"center"}
            >
              <Box fontWeight={"bold"}>Completed!!!</Box>
            </Flex>
          </Box>
        </>
      )}
      <Box p={"50px"} pb={"20px"} pt={"20px"}>
        <Box
          w={"full"}
          background={"white"}
          borderWidth={"1px"}
          borderRadius={"20px"}
          borderColor={"gray.400"}
          shadow={"md"}
          p={"30px"}
        >
          <HStack>
            <Button
              shadow={"sm"}
              background={"blue.400"}
              color={"white"}
              isDisabled={true}
              onClick={() => {
                goToPrevious();
              }}
            >
              Prev step
            </Button>
            <Spacer />
            <Button
              shadow={"sm"}
              background={"blue.400"}
              color={"white"}
              onClick={() => {
                toast({
                  status: "success",
                  description: "Going to next milestone",
                  title: "Milestone",
                  position: "top-left",
                });
                goToNext();
                handleClear();
              }}
              isDisabled={activeStep > 2}
            >
              Next step
            </Button>
          </HStack>
        </Box>
      </Box>
    </>
  );
}

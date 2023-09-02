"use client";

import "@rainbow-me/rainbowkit/styles.css";
import styles from "../app/page.module.css";
import { useState } from "react";
import { parseUnits, zeroAddress } from "viem";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  useWalletClient,
  useAccount,
  useNetwork,
  useSwitchNetwork,
} from "wagmi";
import { currencies } from "../config/currency";
import { storageChains } from "../config/storage-chain";
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
import { useProvider } from "../hooks/useProvider";
import { useSigner } from "../hooks/useSigner";
import {
  Box,
  Button,
  Center,
  Divider,
  Flex,
  HStack,
  Heading,
  Input,
  Select,
  SimpleGrid,
  Spacer,
  VStack,
  useSteps,
  useToast,
} from "@chakra-ui/react";
import { Steps, Step } from "chakra-ui-steps";
import { APP_STATUS } from "@/config/status";
import { IoCheckmarkCircleSharp } from "react-icons/io5";

export default function Home() {
  const toast = useToast({});
  const [storageChain, setStorageChain] = useState("5");
  const [expectedAmount, setExpectedAmount] = useState("");
  const [currency, setCurrency] = useState(
    "5_0xBA62BCfcAaFc6622853cca2BE6Ac7d845BC0f2Dc"
  );
  const [isAccepted, setIsAccepted] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [paymentRecipient, setPaymentRecipient] = useState("");
  const [payerIdentity, setPayerIdentity] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [reason, setReason] = useState("");
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

  async function payTheRequest() {
    const requestClient = new RequestNetwork({
      nodeConnectionConfig: {
        baseURL: storageChains.get(storageChain)!.gateway,
      },
    });

    try {
      const _request = await requestClient.fromRequestId(
        requestData!.requestId
      );
      let _requestData = _request.getData();
      const paymentTx = await payRequest(_requestData, signer);
      await paymentTx.wait(2);

      // Poll the request balance once every second until payment is detected
      // TODO Add a timeout
      while (_requestData.balance?.balance! < _requestData.expectedAmount) {
        _requestData = await _request.refresh();
        alert(`balance = ${_requestData.balance?.balance}`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      alert(`payment detected!`);
      setRequestData(_requestData);
      setStatus(APP_STATUS.REQUEST_PAID);
    } catch (err) {
      setStatus(APP_STATUS.APPROVED);
      alert(err);
    }
  }

  function canPay() {
    return (
      status === APP_STATUS.APPROVED &&
      !isDisconnected &&
      !isConnecting &&
      !isError &&
      !isLoading &&
      !isSwitchNetworkLoading &&
      requestData?.currencyInfo.network === chain?.network
    );
  }

  function handlePay(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    if (!canPay()) {
      return;
    }
    setStatus(APP_STATUS.PAYING);
    payTheRequest();
  }

  async function approve() {
    const requestClient = new RequestNetwork({
      nodeConnectionConfig: {
        baseURL: storageChains.get(storageChain)!.gateway,
      },
    });

    try {
      const _request = await requestClient.fromRequestId(
        requestData!.requestId
      );
      const _requestData = _request.getData();
      alert(`Checking if payer has sufficient funds...`);
      const _hasSufficientFunds = await hasSufficientFunds(
        _requestData,
        address as string,
        { provider: provider }
      );
      alert(`_hasSufficientFunds = ${_hasSufficientFunds}`);
      if (!_hasSufficientFunds) {
        setStatus(APP_STATUS.REQUEST_CONFIRMED);
        return;
      }
      if (
        getPaymentNetworkExtension(_requestData)?.id ===
        Types.Extension.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT
      ) {
        alert(`ERC20 Request detected. Checking approval...`);
        const _hasErc20Approval = await hasErc20Approval(
          _requestData,
          address as string,
          provider
        );
        alert(`_hasErc20Approval = ${_hasErc20Approval}`);
        if (!_hasErc20Approval) {
          const approvalTx = await approveErc20(_requestData, signer);
          await approvalTx.wait(2);
        }
      }
      setStatus(APP_STATUS.APPROVED);
    } catch (err) {
      setStatus(APP_STATUS.REQUEST_CONFIRMED);
      alert(JSON.stringify(err));
    }
  }

  function canApprove() {
    console.log(
      status === APP_STATUS.REQUEST_CONFIRMED &&
        !isDisconnected &&
        !isConnecting &&
        !isError &&
        !isLoading &&
        !isSwitchNetworkLoading &&
        requestData?.currencyInfo.network === chain?.network
    );

    return (
      status === APP_STATUS.REQUEST_CONFIRMED &&
      !isDisconnected &&
      !isConnecting &&
      !isError &&
      !isLoading &&
      !isSwitchNetworkLoading &&
      requestData?.currencyInfo.network === chain?.network
    );
  }

  function handleApprove(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    if (!canApprove()) {
      return;
    }
    setStatus(APP_STATUS.APPROVING);
    approve();
  }

  async function createRequest() {
    const signatureProvider = new Web3SignatureProvider(walletClient);
    const requestClient = new RequestNetwork({
      nodeConnectionConfig: {
        baseURL: storageChains.get(storageChain)!.gateway,
      },
      signatureProvider,
    });
    const requestCreateParameters: Types.ICreateRequestParameters = {
      requestInfo: {
        currency: {
          type: currencies.get(currency)!.type,
          value: currencies.get(currency)!.value,
          network: currencies.get(currency)!.network,
        },
        expectedAmount: parseUnits(
          expectedAmount as `${number}`,
          currencies.get(currency)!.decimals
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
          paymentNetworkName: currencies.get(currency)!.network,
          paymentAddress: paymentRecipient || address,
          feeAddress: zeroAddress,
          feeAmount: "0",
        },
      },
      contentData: {
        // Tip: Consider using rnf_invoice v0.0.3 format from @requestnetwork/data-format
        reason: reason,
        dueDate: dueDate,
      },
      signer: {
        type: Types.Identity.TYPE.ETHEREUM_ADDRESS,
        value: address as string,
      },
    };

    if (payerIdentity.length > 0) {
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
  }

  function canSubmit() {
    return (
      status !== APP_STATUS.SUBMITTING &&
      !isDisconnected &&
      !isConnecting &&
      !isError &&
      !isLoading &&
      storageChain.length > 0 &&
      // Payment Recipient is empty || isAddress
      (paymentRecipient.length === 0 ||
        (paymentRecipient.startsWith("0x") &&
          paymentRecipient.length === 42)) &&
      // Payer is empty || isAddress
      (payerIdentity.length === 0 ||
        (payerIdentity.startsWith("0x") && payerIdentity.length === 42)) &&
      expectedAmount.length > 0 &&
      currency.length > 0
    );
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit()) {
      return;
    }
    setRequestData(undefined);
    setStatus(APP_STATUS.SUBMITTING);
    createRequest();
  }

  function handleClear(_: React.MouseEvent<HTMLButtonElement>) {
    setRequestData(undefined);
    setStatus(APP_STATUS.AWAITING_INPUT);
  }

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
              <Step label="Step 1" description="This is the first step" />
              <Step label="Step 2" description="This is the second step" />
              <Step label="Step 3" description="This is the third step" />
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
                <Box>
                  <Box>Storage Chain *</Box>
                  <Select
                    name="storage-chain"
                    onChange={(e) => setStorageChain(e.target.value)}
                    defaultValue={storageChain}
                    className={styles.h9_w96}
                  >
                    {Array.from(storageChains.entries()).map(([key, value]) => (
                      <option key={key} value={key}>
                        {value.name} ({value.type})
                      </option>
                    ))}
                  </Select>
                </Box>
                <Box>
                  <Box>Amount *</Box>
                  <Input
                    type="number"
                    name="expected-amount"
                    step="any"
                    onChange={(e) => setExpectedAmount(e.target.value)}
                    className={styles.h9_w96}
                  />
                </Box>
                <Box>
                  <Box>Currency *</Box>
                  <Select
                    name="currency"
                    onChange={(e) => setCurrency(e.target.value)}
                    defaultValue={currency}
                    className={styles.h9_w96}
                  >
                    {Array.from(currencies.entries()).map(([key, value]) => (
                      <option key={key} value={key}>
                        {value.symbol} ({value.network})
                      </option>
                    ))}
                  </Select>
                </Box>
                <Box>
                  <Box>Payment Recipient</Box>
                  <Input
                    type="text"
                    name="payment-recipient"
                    placeholder={address}
                    onChange={(e) => setPaymentRecipient(e.target.value)}
                    className={styles.h9_w96}
                  />
                </Box>
                <Box>
                  <Box>Payer Identity</Box>
                  <Input
                    type="text"
                    name="payer-identity"
                    placeholder="0x..."
                    onChange={(e) => setPayerIdentity(e.target.value)}
                    className={styles.h9_w96}
                  />
                </Box>
                <Box>
                  <Box>Due Date</Box>
                  <Input
                    type="date"
                    name="due-date"
                    onChange={(e) => setDueDate(e.target.value)}
                    className={styles.h9_w96}
                  />
                </Box>
                <Button
                  type="submit"
                  isDisabled={!canSubmit()}
                  className={styles.h9_w24}
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
                className={styles.h9_w96}
              >
                Switch to Payment Chain: {requestData?.currencyInfo.network}
                {isSwitchNetworkLoading && " (switching)"}
              </Button>
              <Button
                type="button"
                isDisabled={!canApprove()}
                onClick={handleApprove}
                className={styles.h9_w24}
              >
                Approve
              </Button>
              {!switchNetwork && (
                <Box>Programmatic switch network not supported by wallet.</Box>
              )}
              <Box>{error && error.message}</Box>
              <Button
                type="button"
                onClick={handlePay}
                isDisabled={!canPay()}
                className={styles.h9_w24}
              >
                Pay now
              </Button>
              <Box>Request info</Box>
              <Button
                type="button"
                onClick={handleClear}
                className={styles.h9_w24}
              >
                Clear
              </Button>
              <Box>Invoice status: {status}</Box>
              <Box>{JSON.stringify(requestData, undefined, 2)}</Box>
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
            <VStack>
              <Box>Screenshot URL</Box>
              <Input />
              <Box>Demo URL</Box>
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
                  <Button onClick={() => setIsSubmitted(true)}>
                    Submit milestone
                  </Button>
                )}
              </Flex>
            </VStack>
            <Divider orientation="horizontal" my={"20px"} />
            <form onSubmit={handleSubmit}>
              <VStack spacing={"20px"} alignItems={"start"}>
                <ConnectButton chainStatus="none" showBalance={false} />
                <Box>
                  <Box>Storage Chain *</Box>
                  <Select
                    name="storage-chain"
                    onChange={(e) => setStorageChain(e.target.value)}
                    defaultValue={storageChain}
                    className={styles.h9_w96}
                  >
                    {Array.from(storageChains.entries()).map(([key, value]) => (
                      <option key={key} value={key}>
                        {value.name} ({value.type})
                      </option>
                    ))}
                  </Select>
                </Box>
                <Box>
                  <Box>Amount *</Box>
                  <Input
                    type="number"
                    name="expected-amount"
                    step="any"
                    onChange={(e) => setExpectedAmount(e.target.value)}
                    className={styles.h9_w96}
                  />
                </Box>
                <Box>
                  <Box>Currency *</Box>
                  <Select
                    name="currency"
                    onChange={(e) => setCurrency(e.target.value)}
                    defaultValue={currency}
                    className={styles.h9_w96}
                  >
                    {Array.from(currencies.entries()).map(([key, value]) => (
                      <option key={key} value={key}>
                        {value.symbol} ({value.network})
                      </option>
                    ))}
                  </Select>
                </Box>
                <Box>
                  <Box>Payment Recipient</Box>
                  <Input
                    type="text"
                    name="payment-recipient"
                    placeholder={address}
                    onChange={(e) => setPaymentRecipient(e.target.value)}
                    className={styles.h9_w96}
                  />
                </Box>
                <Box>
                  <Box>Payer Identity</Box>
                  <Input
                    type="text"
                    name="payer-identity"
                    placeholder="0x..."
                    onChange={(e) => setPayerIdentity(e.target.value)}
                    className={styles.h9_w96}
                  />
                </Box>
                <Box>
                  <Box>Due Date</Box>
                  <Input
                    type="date"
                    name="due-date"
                    onChange={(e) => setDueDate(e.target.value)}
                    className={styles.h9_w96}
                  />
                </Box>
                <Button
                  type="submit"
                  isDisabled={!canSubmit()}
                  className={styles.h9_w24}
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
                    onClick={() => setIsAccepted(true)}
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
                className={styles.h9_w96}
              >
                Switch to Payment Chain: {requestData?.currencyInfo.network}
                {isSwitchNetworkLoading && " (switching)"}
              </Button>
              <Button
                type="button"
                isDisabled={!canApprove()}
                onClick={handleApprove}
                className={styles.h9_w24}
              >
                Approve
              </Button>
              {!switchNetwork && (
                <Box>Programmatic switch network not supported by wallet.</Box>
              )}
              <Box>{error && error.message}</Box>
              <Button
                type="button"
                onClick={handlePay}
                isDisabled={!canPay()}
                className={styles.h9_w24}
              >
                Pay now
              </Button>
              <Box>Request info</Box>
              <Button
                type="button"
                onClick={handleClear}
                className={styles.h9_w24}
              >
                Clear
              </Button>
              <Box>Invoice status: {status}</Box>
            </VStack>
          </Box>
        </SimpleGrid>
      )}
      {activeStep === 2 && (
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
              onClick={() => {
                goToPrevious();
              }}
            >
              Prev step
            </Button>
            <Spacer />
            <Button
              onClick={() => {
                toast({
                  status: "success",
                  description: "Going to next milestone",
                  title: "Milestone",
                  position: "top-left",
                });
                goToNext();
              }}
            >
              Next step
            </Button>
          </HStack>
        </Box>
      </Box>
    </>
  );
}

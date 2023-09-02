interface StorageChain {
  name: string;
  type: "mainnet" | "testnet";
  gateway: string;
}

interface StorageChainData extends StorageChain {
  id: string;
}

export const storageChainData: StorageChainData = {
  id: "5",
  name: "Goerli",
  type: "testnet",
  gateway: "https://goerli.gateway.request.network/",
};

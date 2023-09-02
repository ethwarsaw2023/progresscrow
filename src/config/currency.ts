import { Types } from "@requestnetwork/request-client.js";

interface CurrencyData extends Types.RequestLogic.ICurrency {
  address: string;
  name: string;
  symbol: string;
  chainId: number;
  decimals: number;
}

export const currency = {
  address: "5_0x07865c6E87B9F70255377e024ace6630C1Eaa37F",
  name: "USD Coin",
  symbol: "USDC",
  value: "0x07865c6E87B9F70255377e024ace6630C1Eaa37F",
  chainId: 5,
  network: "goerli",
  decimals: 6,
  type: Types.RequestLogic.CURRENCY.ERC20,
} satisfies CurrencyData;

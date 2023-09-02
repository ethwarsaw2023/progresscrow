import { Types } from "@requestnetwork/request-client.js";

// Tip: For more advanced currency managment, use CurrencyManager from @requestnetwork/currency

interface ICurrency extends Types.RequestLogic.ICurrency {
  name: string;
  symbol: string;
  chainId: number;
  decimals: number;
}

interface CurrencyData extends ICurrency {
  address: string;
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

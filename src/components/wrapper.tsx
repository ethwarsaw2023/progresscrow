"use client";

import { WagmiConfig } from "wagmi";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { ChakraProvider } from "@chakra-ui/react";

import { chains, demoAppInfo, wagmiConfig } from "@/config/rainbow-kit";
import { theme } from "@/app/theme";

interface RootProviderProps {
  children: React.ReactNode;
}

export default function RootProvider({ children }: RootProviderProps) {
  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider appInfo={demoAppInfo} chains={chains}>
        <ChakraProvider theme={theme}>{children}</ChakraProvider>
      </RainbowKitProvider>
    </WagmiConfig>
  );
}

import { extendTheme } from "@chakra-ui/react";

export const theme = extendTheme({
  styles: {
    global: () => ({
      body: {
        color: "default",
        bg: "rgb(220,220,220)",
      },
    }),
  },
});

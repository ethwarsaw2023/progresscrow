import { extendTheme } from "@chakra-ui/react";
import { StepsTheme as Steps } from "chakra-ui-steps";

export const theme = extendTheme({
  components: {
    Steps,
  },
  styles: {
    global: () => ({
      body: {
        color: "default",
        bg: "rgb(220,220,220)",
      },
    }),
  },
});

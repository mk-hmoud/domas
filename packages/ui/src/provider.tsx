import { MantineProvider } from "@mantine/core";
import { theme } from "./theme";
import "@mantine/core/styles.css";

interface DomMantineProviderProps {
  children: React.ReactNode;
}

export function DomMantineProvider({ children }: DomMantineProviderProps) {
  return <MantineProvider theme={theme}>{children}</MantineProvider>;
}

import { MantineProvider } from "@mantine/core";
import { theme } from "./theme";
import "./i18n"; // Initialize i18n
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";

interface DomMantineProviderProps {
  children: React.ReactNode;
}

export function DomMantineProvider({ children }: DomMantineProviderProps) {
  return (
    <MantineProvider theme={theme} defaultColorScheme="auto">
      {children}
    </MantineProvider>
  );
}

import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { ModalsProvider } from "@mantine/modals";
import { theme } from "./theme";
import "./i18n"; // Initialize i18n
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/notifications/styles.css";

interface DomMantineProviderProps {
  children: React.ReactNode;
}

export function DomMantineProvider({ children }: DomMantineProviderProps) {
  return (
    <MantineProvider theme={theme} defaultColorScheme="auto">
      <Notifications />
      <ModalsProvider>{children}</ModalsProvider>
    </MantineProvider>
  );
}

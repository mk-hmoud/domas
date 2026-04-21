import { Box, Container } from "@mantine/core";
import type { ReactNode } from "react";

interface PageShellProps {
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

export function PageShell({ children, size = "lg" }: PageShellProps) {
  return (
    <Box p="xl">
      <Container size={size} p={0}>
        {children}
      </Container>
    </Box>
  );
}

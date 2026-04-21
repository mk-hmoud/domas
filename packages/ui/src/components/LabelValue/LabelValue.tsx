import { Box, Text } from "@mantine/core";
import type { CSSProperties, ReactNode } from "react";

interface LabelValueProps {
  label: string;
  children: ReactNode;
  style?: CSSProperties;
}

export function LabelValue({ label, children, style }: LabelValueProps) {
  return (
    <Box style={style}>
      <Text
        size="xs"
        c="dimmed"
        tt="uppercase"
        fw={600}
        mb={3}
        style={{ letterSpacing: "0.05em" }}
      >
        {label}
      </Text>
      {typeof children === "string" || typeof children === "number" ? (
        <Text size="sm" fw={500}>
          {children}
        </Text>
      ) : (
        children
      )}
    </Box>
  );
}

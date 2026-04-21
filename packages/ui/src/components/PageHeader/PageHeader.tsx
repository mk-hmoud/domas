import { Box, Group, Title, Text } from "@mantine/core";
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <Box
      px="xl"
      py="md"
      bg="white"
      style={{
        borderBottom: "1px solid var(--mantine-color-gray-2)",
        flexShrink: 0,
      }}
    >
      <Group justify="space-between" align="center" wrap="nowrap">
        <div>
          <Title order={3} style={{ lineHeight: 1.3 }}>
            {title}
          </Title>
          {subtitle && (
            <Text size="sm" c="dimmed" mt={2}>
              {subtitle}
            </Text>
          )}
        </div>
        {actions && (
          <Group gap="sm" style={{ flexShrink: 0 }}>
            {actions}
          </Group>
        )}
      </Group>
    </Box>
  );
}

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
      px={{ base: "md", sm: "xl" }}
      py="md"
      style={{
        backgroundColor:
          "light-dark(var(--mantine-color-white), var(--mantine-color-dark-7))",
        borderBottom:
          "1px solid light-dark(var(--mantine-color-gray-2), var(--mantine-color-dark-5))",
        flexShrink: 0,
      }}
    >
      <Group justify="space-between" align="center" wrap="wrap" gap="xs">
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
        {actions && <Group gap="sm">{actions}</Group>}
      </Group>
    </Box>
  );
}

import { Stack, ThemeIcon, Text } from "@mantine/core";
import type { ReactNode } from "react";
import { IconInbox } from "@tabler/icons-react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <Stack align="center" gap="xs" py={40} px="md">
      <ThemeIcon size={52} radius="xl" variant="light" color="gray">
        {icon ?? <IconInbox size={26} />}
      </ThemeIcon>
      <Stack gap={4} align="center">
        <Text fw={600} size="sm" c="gray.7">
          {title}
        </Text>
        {description && (
          <Text size="xs" c="dimmed" ta="center" maw={280}>
            {description}
          </Text>
        )}
      </Stack>
      {action}
    </Stack>
  );
}

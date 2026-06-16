import { type ComponentType, type ReactNode } from 'react';
import { Box, Group, Text, ThemeIcon } from '@domas/ui';

interface PortalPageHeaderProps {
  icon: ComponentType<{ size?: number; stroke?: number }>;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  color?: string;
}

export function PortalPageHeader({
  icon: Icon,
  title,
  subtitle,
  action,
  color = 'indigo',
}: PortalPageHeaderProps) {
  return (
    <Group justify="space-between" align="flex-start" mb="lg" wrap="nowrap">
      <Group gap="md" align="center" style={{ minWidth: 0 }}>
        <ThemeIcon size={44} radius="lg" variant="light" color={color} style={{ flexShrink: 0 }}>
          <Icon size={22} />
        </ThemeIcon>
        <Box style={{ minWidth: 0 }}>
          <Text fw={700} size="xl" lh={1.1} truncate>
            {title}
          </Text>
          {subtitle && (
            <Text size="sm" c="dimmed" mt={2}>
              {subtitle}
            </Text>
          )}
        </Box>
      </Group>
      {action && <Box style={{ flexShrink: 0, paddingTop: 4 }}>{action}</Box>}
    </Group>
  );
}

import { Box, Group, Text } from '@domas/ui';
import type { ReactNode } from 'react';

interface SectionTitleProps {
  children: ReactNode;
  mb?: string | number;
}

export function SectionTitle({ children, mb }: SectionTitleProps) {
  return (
    <Group gap="sm" mb={mb}>
      <Box
        style={{
          width: 6,
          height: 20,
          borderRadius: 3,
          background: 'linear-gradient(180deg, #228BE6, #0C8599)',
          flexShrink: 0,
        }}
      />
      <Text fw={700} size="sm">
        {children}
      </Text>
    </Group>
  );
}

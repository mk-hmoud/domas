import { Box, Group, Paper, Text, ThemeIcon } from '@domas/ui';
import type { ReactNode } from 'react';

const GRADIENTS: Record<string, string> = {
  blue: 'linear-gradient(135deg, #1864AB 0%, #1971C2 45%, #0C8599 100%)',
  green: 'linear-gradient(135deg, #2F9E44 0%, #37B24D 50%, #2B8A3E 100%)',
  red: 'linear-gradient(135deg, #C92A2A 0%, #E03131 50%, #C92A2A 100%)',
  teal: 'linear-gradient(135deg, #0B7285 0%, #1098AD 50%, #0C8599 100%)',
  purple: 'linear-gradient(135deg, #862E9C 0%, #9C36B5 50%, #7048BD 100%)',
};

const SHADOWS: Record<string, string> = {
  blue: '0 6px 24px rgba(25,113,194,0.22)',
  green: '0 6px 24px rgba(64,192,87,0.14)',
  red: '0 6px 24px rgba(201,42,42,0.2)',
  teal: '0 6px 24px rgba(16,152,173,0.25)',
  purple: '0 6px 24px rgba(134,46,156,0.25)',
};

export type PageHeroColor = keyof typeof GRADIENTS;

interface PageHeroProps {
  label?: string;
  title?: ReactNode;
  subtitle?: ReactNode;
  /** Fully replaces the label/title/subtitle layout on the left */
  leftSection?: ReactNode;
  /** Standard icon — rendered in a frosted ThemeIcon on the right */
  icon?: ReactNode;
  /** Custom right section — overrides icon */
  rightSection?: ReactNode;
  color?: PageHeroColor;
}

export function PageHero({
  label,
  title,
  subtitle,
  leftSection,
  icon,
  rightSection,
  color = 'blue',
}: PageHeroProps) {
  return (
    <Paper
      radius="xl"
      px="xl"
      py="lg"
      style={{
        background: GRADIENTS[color],
        boxShadow: SHADOWS[color],
        overflow: 'hidden',
      }}
    >
      <Group justify="space-between" align="center" wrap="nowrap">
        <Box style={{ flex: 1, minWidth: 0 }}>
          {leftSection ?? (
            <>
              {label && (
                <Text
                  size="xs"
                  c="white"
                  fw={600}
                  style={{
                    opacity: 0.75,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    fontSize: 11,
                    marginBottom: 4,
                  }}
                >
                  {label}
                </Text>
              )}
              {title && (
                <Text fw={800} c="white" size="xl" lh={1.2}>
                  {title}
                </Text>
              )}
              {subtitle && (
                <Text size="sm" c="white" style={{ opacity: 0.8, marginTop: 4 }}>
                  {subtitle}
                </Text>
              )}
            </>
          )}
        </Box>

        {rightSection ? (
          <Box style={{ flexShrink: 0, marginLeft: 16 }}>{rightSection}</Box>
        ) : icon ? (
          <ThemeIcon
            size={56}
            radius="xl"
            style={{
              background: 'rgba(255,255,255,0.18)',
              color: 'white',
              flexShrink: 0,
              border: '1px solid rgba(255,255,255,0.25)',
              marginLeft: 16,
            }}
          >
            {icon}
          </ThemeIcon>
        ) : null}
      </Group>
    </Paper>
  );
}

import { Paper, Text, Group, ThemeIcon, Skeleton } from "@mantine/core";
import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: number | undefined;
  icon: ReactNode;
  color?: string;
  loading?: boolean;
  /** Optional badge text shown next to the value (e.g. "today") */
  suffix?: string;
}

export function StatCard({
  label,
  value,
  icon,
  color = "blue",
  loading,
  suffix,
}: StatCardProps) {
  return (
    <Paper withBorder p="md" radius="md">
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <div>
          <Text
            size="xs"
            c="dimmed"
            tt="uppercase"
            fw={600}
            mb={4}
            style={{ letterSpacing: "0.05em" }}
          >
            {label}
          </Text>
          {loading ? (
            <Skeleton height={32} width={60} />
          ) : (
            <Group gap={6} align="baseline">
              <Text fw={700} size="xl" lh={1}>
                {value ?? 0}
              </Text>
              {suffix && (
                <Text size="xs" c="dimmed">
                  {suffix}
                </Text>
              )}
            </Group>
          )}
        </div>
        <ThemeIcon color={color} variant="light" size="lg" radius="md">
          {icon}
        </ThemeIcon>
      </Group>
    </Paper>
  );
}

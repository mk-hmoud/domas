import { useEffect, useState } from 'react';
import { Stack, Text, Paper, Group, Badge } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { rector } from '@domas/api-client';
import { RectorResident } from '@domas/ts-types';
import { PageHeader, PageShell } from '@domas/ui';

function statusColor(status: string) {
  if (status === 'active') return 'green';
  if (status === 'ready_for_checkin') return 'blue';
  if (status === 'pending_accounting') return 'orange';
  return 'gray';
}

export function RectorResidentsPage() {
  const { t } = useTranslation();
  const [residents, setResidents] = useState<RectorResident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    rector
      .getResidents()
      .then(setResidents)
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageHeader title={t('rector.residents_title')} />
      <PageShell>
        <Stack gap="xs">
          {!loading && residents.length === 0 && (
            <Text c="dimmed" size="sm" ta="center" py="xl">
              {t('rector.no_residents')}
            </Text>
          )}

          {residents.map((r) => (
            <Paper key={r.bookingId} withBorder p="sm" radius="md">
              <Group justify="space-between" wrap="nowrap">
                <Stack gap={2} style={{ minWidth: 0 }}>
                  <Text size="sm" fw={600} truncate>
                    {r.studentName}
                  </Text>
                  <Text size="xs" c="dimmed" truncate>
                    {r.studentNumber} · {r.locationPath} — {t('bed')} {r.bedLabel}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {new Date(r.startDate).toLocaleDateString()} →{' '}
                    {new Date(r.endDate).toLocaleDateString()}
                  </Text>
                </Stack>
                <Badge
                  color={statusColor(r.status)}
                  variant="light"
                  size="sm"
                  style={{ flexShrink: 0 }}
                >
                  {r.status.replace(/_/g, ' ')}
                </Badge>
              </Group>
            </Paper>
          ))}
        </Stack>
      </PageShell>
    </>
  );
}

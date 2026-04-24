import { useEffect, useState } from 'react';
import { SimpleGrid, Stack, Text, Paper, Group, Badge, Divider } from '@mantine/core';
import { IconBed, IconCheck, IconClock } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { rector } from '@domas/api-client';
import { RectorBedsResponse, RectorResident } from '@domas/ts-types';
import { StatCard, PageHeader, PageShell } from '@domas/ui';

function statusColor(status: string) {
  if (status === 'active') return 'green';
  if (status === 'ready_for_checkin') return 'blue';
  if (status === 'pending_accounting') return 'orange';
  return 'gray';
}

export function RectorOverviewPage() {
  const { t } = useTranslation();
  const [beds, setBeds] = useState<RectorBedsResponse | null>(null);
  const [residents, setResidents] = useState<RectorResident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([rector.getBeds(), rector.getResidents()])
      .then(([b, r]) => {
        setBeds(b);
        setResidents(r);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageHeader title={t('rector.nav_overview')} />
      <PageShell>
        <Stack gap="xl">
          <SimpleGrid cols={{ base: 3 }}>
            <StatCard
              label={t('rector.beds_total')}
              value={beds?.total}
              icon={<IconBed size={18} />}
              color="indigo"
              loading={loading}
            />
            <StatCard
              label={t('rector.beds_occupied')}
              value={beds?.occupied}
              icon={<IconClock size={18} />}
              color="orange"
              loading={loading}
            />
            <StatCard
              label={t('rector.beds_available')}
              value={beds?.available}
              icon={<IconCheck size={18} />}
              color="green"
              loading={loading}
            />
          </SimpleGrid>

          {!loading && residents.length > 0 && (
            <Stack gap="sm">
              <Divider label={t('rector.residents_title')} labelPosition="left" />
              <Stack gap="xs">
                {residents.slice(0, 5).map((r) => (
                  <Paper key={r.bookingId} withBorder p="sm" radius="md">
                    <Group justify="space-between" wrap="nowrap">
                      <Stack gap={2} style={{ minWidth: 0 }}>
                        <Text size="sm" fw={600} truncate>
                          {r.studentName}
                        </Text>
                        <Text size="xs" c="dimmed" truncate>
                          {r.studentNumber} · {r.locationPath}
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
            </Stack>
          )}

          {!loading && residents.length === 0 && (
            <Text c="dimmed" size="sm" ta="center" py="xl">
              {t('rector.no_residents')}
            </Text>
          )}
        </Stack>
      </PageShell>
    </>
  );
}

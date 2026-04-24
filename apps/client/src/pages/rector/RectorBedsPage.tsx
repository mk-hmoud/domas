import { useEffect, useState } from 'react';
import { Stack, Text, Paper, Group, Badge, SimpleGrid } from '@mantine/core';
import { IconBed, IconCheck, IconClock } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { rector } from '@domas/api-client';
import { RectorBedsResponse } from '@domas/ts-types';
import { StatCard, PageHeader, PageShell } from '@domas/ui';

function bedStatusColor(status: string) {
  if (status === 'available') return 'green';
  if (status === 'occupied') return 'orange';
  return 'gray';
}

export function RectorBedsPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<RectorBedsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    rector
      .getBeds()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageHeader title={t('rector.beds_title')} />
      <PageShell>
        <Stack gap="xl">
          <SimpleGrid cols={{ base: 3 }}>
            <StatCard
              label={t('rector.beds_total')}
              value={data?.total}
              icon={<IconBed size={18} />}
              color="indigo"
              loading={loading}
            />
            <StatCard
              label={t('rector.beds_occupied')}
              value={data?.occupied}
              icon={<IconClock size={18} />}
              color="orange"
              loading={loading}
            />
            <StatCard
              label={t('rector.beds_available')}
              value={data?.available}
              icon={<IconCheck size={18} />}
              color="green"
              loading={loading}
            />
          </SimpleGrid>

          {!loading && (data?.beds.length ?? 0) === 0 && (
            <Text c="dimmed" size="sm" ta="center" py="xl">
              {t('rector.no_beds')}
            </Text>
          )}

          {!loading &&
            (data?.beds ?? []).map((bed) => (
              <Paper key={bed.id} withBorder p="sm" radius="md">
                <Group justify="space-between" wrap="nowrap">
                  <Stack gap={2} style={{ minWidth: 0 }}>
                    <Text size="sm" fw={600} truncate>
                      {bed.locationPath} — {t('bed')} {bed.label}
                    </Text>
                    {bed.residentName && (
                      <Text size="xs" c="dimmed" truncate>
                        {bed.residentName}
                      </Text>
                    )}
                  </Stack>
                  <Badge
                    color={bedStatusColor(bed.status)}
                    variant="light"
                    size="sm"
                    style={{ flexShrink: 0 }}
                  >
                    {bed.status}
                  </Badge>
                </Group>
              </Paper>
            ))}
        </Stack>
      </PageShell>
    </>
  );
}

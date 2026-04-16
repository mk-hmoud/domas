import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Badge,
  Box,
  Group,
  Paper,
  SimpleGrid,
  Skeleton,
  Stack,
  Table,
  Tabs,
  Text,
  ThemeIcon,
} from '@domas/ui';
import {
  IconAlertTriangle,
  IconCreditCard,
  IconInfoCircle,
  IconReceipt,
} from '@tabler/icons-react';
import { StudentDamageLiability, StudentTransaction } from '@domas/ts-types';
import { portalFinancial } from '@domas/api-client';

function useTransactionTypeLabel() {
  const { t } = useTranslation();
  return (type: StudentTransaction['transactionType']): { label: string; color: string } => {
    switch (type) {
      case 'deposit':
        return { label: t('portal.tx_deposit'), color: 'blue' };
      case 'rent':
        return { label: t('portal.tx_rent'), color: 'teal' };
      case 'fine':
        return { label: t('portal.tx_fine'), color: 'red' };
      default:
        return { label: type, color: 'gray' };
    }
  };
}

// ─── Transactions: desktop table ──────────────────────────────────────────────

function TransactionsTable({ items }: { items: StudentTransaction[] }) {
  const { t } = useTranslation();
  const transactionTypeLabel = useTransactionTypeLabel();

  if (items.length === 0) {
    return (
      <Stack align="center" gap="xs" py="xl">
        <ThemeIcon size={44} radius="xl" variant="light" color="gray">
          <IconReceipt size={22} />
        </ThemeIcon>
        <Text size="sm" c="dimmed">
          {t('portal.no_transactions')}
        </Text>
      </Stack>
    );
  }

  return (
    <Box
      style={{
        border: '1px solid var(--mantine-color-default-border)',
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      <Table highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>{t('portal.col_date')}</Table.Th>
            <Table.Th>{t('portal.col_type')}</Table.Th>
            <Table.Th>{t('portal.col_semester')}</Table.Th>
            <Table.Th>{t('portal.col_status')}</Table.Th>
            <Table.Th style={{ textAlign: 'right' }}>{t('portal.col_amount')}</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {items.map((tx) => {
            const { label, color } = transactionTypeLabel(tx.transactionType);
            return (
              <Table.Tr key={tx.id}>
                <Table.Td>
                  <Text size="sm">{new Date(tx.createdAt).toLocaleDateString()}</Text>
                </Table.Td>
                <Table.Td>
                  <Badge size="sm" variant="light" color={color} radius="xl">
                    {label}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" c="dimmed">
                    {tx.semesterDisplayName}
                  </Text>
                </Table.Td>
                <Table.Td>
                  {tx.isApproved ? (
                    <Badge size="sm" variant="dot" color="green" radius="xl">
                      {t('portal.approved_label')}
                    </Badge>
                  ) : (
                    <Badge size="sm" variant="dot" color="gray" radius="xl">
                      {t('portal.payment_pending')}
                    </Badge>
                  )}
                </Table.Td>
                <Table.Td style={{ textAlign: 'right' }}>
                  <Text size="sm" fw={700} c="teal">
                    ₺{tx.amount.toLocaleString()}
                  </Text>
                </Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>
    </Box>
  );
}

// ─── Transactions: mobile cards ───────────────────────────────────────────────

function TransactionCards({ items }: { items: StudentTransaction[] }) {
  const { t } = useTranslation();
  const transactionTypeLabel = useTransactionTypeLabel();

  if (items.length === 0) {
    return (
      <Stack align="center" gap="xs" py="xl">
        <ThemeIcon size={44} radius="xl" variant="light" color="gray">
          <IconReceipt size={22} />
        </ThemeIcon>
        <Text size="sm" c="dimmed">
          {t('portal.no_transactions')}
        </Text>
      </Stack>
    );
  }

  return (
    <Stack gap="sm">
      {items.map((tx) => {
        const { label, color } = transactionTypeLabel(tx.transactionType);
        return (
          <Paper
            key={tx.id}
            radius="lg"
            style={{
              border: '1px solid var(--mantine-color-default-border)',
              overflow: 'hidden',
            }}
          >
            <Group gap={0} wrap="nowrap">
              <Box
                style={{
                  width: 4,
                  alignSelf: 'stretch',
                  background: `var(--mantine-color-${color}-5)`,
                  flexShrink: 0,
                }}
              />
              <Box p="sm" style={{ flex: 1 }}>
                <Group justify="space-between" align="flex-start">
                  <Box style={{ flex: 1 }}>
                    <Group gap="xs" mb={4}>
                      <Badge size="xs" variant="light" color={color} radius="xl">
                        {label}
                      </Badge>
                      {tx.isApproved ? (
                        <Badge size="xs" variant="dot" color="green" radius="xl">
                          {t('portal.approved_label')}
                        </Badge>
                      ) : (
                        <Badge size="xs" variant="dot" color="gray" radius="xl">
                          {t('portal.payment_pending')}
                        </Badge>
                      )}
                    </Group>
                    <Text size="xs" c="dimmed">
                      {tx.semesterDisplayName}
                    </Text>
                    <Text size="xs" c="dimmed" mt={2}>
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </Text>
                  </Box>
                  <Text size="md" fw={800} c="teal">
                    ₺{tx.amount.toLocaleString()}
                  </Text>
                </Group>
              </Box>
            </Group>
          </Paper>
        );
      })}
    </Stack>
  );
}

// ─── Damages: desktop table ───────────────────────────────────────────────────

function DamagesTable({ items }: { items: StudentDamageLiability[] }) {
  const { t } = useTranslation();

  if (items.length === 0) {
    return (
      <Stack align="center" gap="xs" py="xl">
        <ThemeIcon size={44} radius="xl" variant="light" color="gray">
          <IconAlertTriangle size={22} />
        </ThemeIcon>
        <Text size="sm" c="dimmed">
          {t('portal.no_damage_liabilities')}
        </Text>
      </Stack>
    );
  }

  return (
    <Box
      style={{
        border: '1px solid var(--mantine-color-default-border)',
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      <Table highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>{t('portal.col_reported')}</Table.Th>
            <Table.Th>{t('portal.col_description')}</Table.Th>
            <Table.Th>{t('portal.col_status')}</Table.Th>
            <Table.Th style={{ textAlign: 'right' }}>{t('portal.col_amount')}</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {items.map((d) => {
            const statusColor =
              d.reportStatus === 'approved'
                ? 'red'
                : d.reportStatus === 'rejected'
                  ? 'gray'
                  : 'orange';
            return (
              <Table.Tr key={d.id}>
                <Table.Td>
                  <Text size="sm">{new Date(d.reportedAt).toLocaleDateString()}</Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">{d.description}</Text>
                </Table.Td>
                <Table.Td>
                  <Badge size="sm" variant="light" color={statusColor} radius="xl">
                    {d.reportStatus.charAt(0).toUpperCase() + d.reportStatus.slice(1)}
                  </Badge>
                </Table.Td>
                <Table.Td style={{ textAlign: 'right' }}>
                  <Text size="sm" fw={700} c="red">
                    {d.currency} {d.amount.toLocaleString()}
                  </Text>
                </Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>
    </Box>
  );
}

// ─── Damages: mobile cards ────────────────────────────────────────────────────

function DamageCards({ items }: { items: StudentDamageLiability[] }) {
  const { t } = useTranslation();

  if (items.length === 0) {
    return (
      <Stack align="center" gap="xs" py="xl">
        <ThemeIcon size={44} radius="xl" variant="light" color="gray">
          <IconAlertTriangle size={22} />
        </ThemeIcon>
        <Text size="sm" c="dimmed">
          {t('portal.no_damage_liabilities')}
        </Text>
      </Stack>
    );
  }

  return (
    <Stack gap="sm">
      {items.map((d) => {
        const statusColor =
          d.reportStatus === 'approved' ? 'red' : d.reportStatus === 'rejected' ? 'gray' : 'orange';
        return (
          <Paper
            key={d.id}
            radius="lg"
            style={{
              border: '1px solid var(--mantine-color-default-border)',
              overflow: 'hidden',
            }}
          >
            <Group gap={0} wrap="nowrap">
              <Box
                style={{
                  width: 4,
                  alignSelf: 'stretch',
                  background: `var(--mantine-color-${statusColor}-5)`,
                  flexShrink: 0,
                }}
              />
              <Box p="sm" style={{ flex: 1 }}>
                <Group justify="space-between" align="flex-start">
                  <Box style={{ flex: 1 }}>
                    <Badge size="xs" variant="light" color={statusColor} radius="xl" mb={6}>
                      {d.reportStatus.charAt(0).toUpperCase() + d.reportStatus.slice(1)}
                    </Badge>
                    <Text size="sm" fw={600}>
                      {d.description}
                    </Text>
                    <Text size="xs" c="dimmed" mt={2}>
                      {t('portal.reported_prefix')} {new Date(d.reportedAt).toLocaleDateString()}
                    </Text>
                  </Box>
                  <Text size="md" fw={800} c="red">
                    {d.currency} {d.amount.toLocaleString()}
                  </Text>
                </Group>
              </Box>
            </Group>
          </Paper>
        );
      })}
    </Stack>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function FinancialPage() {
  const { t } = useTranslation();
  const [transactions, setTransactions] = useState<StudentTransaction[]>([]);
  const [damages, setDamages] = useState<StudentDamageLiability[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      portalFinancial.getTransactions().catch(() => [] as StudentTransaction[]),
      portalFinancial.getDamageLiabilities().catch(() => [] as StudentDamageLiability[]),
    ]).then(([txs, dmgs]) => {
      setTransactions(txs);
      setDamages(dmgs);
      setIsLoading(false);
    });
  }, []);

  const totalPaid = transactions
    .filter((tx) => tx.isApproved)
    .reduce((sum, tx) => sum + tx.amount, 0);
  const pendingTransactions = transactions.filter((tx) => !tx.isApproved).length;
  const pendingDamages = damages
    .filter((d) => d.reportStatus === 'approved')
    .reduce((sum, d) => sum + d.amount, 0);

  return (
    <Stack gap="lg">
      {/* Page hero */}
      <Paper
        radius="xl"
        px="xl"
        py="lg"
        style={{
          background: 'linear-gradient(135deg, #0B7285 0%, #1098AD 50%, #0C8599 100%)',
          boxShadow: '0 6px 24px rgba(16,152,173,0.25)',
        }}
      >
        <Group justify="space-between" align="center" wrap="nowrap">
          <Box>
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
              Student Housing Portal
            </Text>
            <Text fw={800} c="white" size="xl" lh={1.2}>
              {t('portal.financial_title')}
            </Text>
            <Text size="sm" c="white" style={{ opacity: 0.78, marginTop: 4 }}>
              {t('portal.financial_subtitle')}
            </Text>
          </Box>
          <ThemeIcon
            size={56}
            radius="xl"
            style={{
              background: 'rgba(255,255,255,0.18)',
              color: 'white',
              flexShrink: 0,
              border: '1px solid rgba(255,255,255,0.25)',
            }}
          >
            <IconCreditCard size={28} />
          </ThemeIcon>
        </Group>
      </Paper>

      {isLoading ? (
        <Stack gap="md">
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
            <Skeleton height={88} radius="xl" />
            <Skeleton height={88} radius="xl" />
            <Skeleton height={88} radius="xl" />
          </SimpleGrid>
          <Skeleton height={220} radius="xl" />
        </Stack>
      ) : (
        <>
          {/* Stats row */}
          <SimpleGrid cols={{ base: 1, xs: 2, sm: 3 }} spacing="md">
            {/* Total paid */}
            <Paper
              radius="xl"
              style={{
                overflow: 'hidden',
                border: '1px solid var(--mantine-color-teal-3)',
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
              }}
            >
              <Group gap={0} wrap="nowrap">
                <Box
                  style={{
                    width: 5,
                    alignSelf: 'stretch',
                    background: 'linear-gradient(180deg, #0B7285, #1098AD)',
                    flexShrink: 0,
                  }}
                />
                <Group gap="sm" p="md" wrap="nowrap" style={{ flex: 1 }}>
                  <ThemeIcon
                    size={42}
                    radius="md"
                    variant="light"
                    color="teal"
                    style={{ flexShrink: 0 }}
                  >
                    <IconCreditCard size={20} />
                  </ThemeIcon>
                  <Box>
                    <Text size="xs" c="dimmed">
                      {t('portal.stat_total_paid')}
                    </Text>
                    <Text size="lg" fw={800} c="teal">
                      ₺{totalPaid.toLocaleString()}
                    </Text>
                  </Box>
                </Group>
              </Group>
            </Paper>

            {/* Pending transactions */}
            <Paper
              radius="xl"
              style={{
                overflow: 'hidden',
                border: `1px solid var(--mantine-color-${pendingTransactions > 0 ? 'orange' : 'gray'}-3)`,
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
              }}
            >
              <Group gap={0} wrap="nowrap">
                <Box
                  style={{
                    width: 5,
                    alignSelf: 'stretch',
                    background:
                      pendingTransactions > 0
                        ? 'var(--mantine-color-orange-5)'
                        : 'var(--mantine-color-gray-4)',
                    flexShrink: 0,
                  }}
                />
                <Group gap="sm" p="md" wrap="nowrap" style={{ flex: 1 }}>
                  <ThemeIcon
                    size={42}
                    radius="md"
                    variant="light"
                    color={pendingTransactions > 0 ? 'orange' : 'gray'}
                    style={{ flexShrink: 0 }}
                  >
                    <IconReceipt size={20} />
                  </ThemeIcon>
                  <Box>
                    <Text size="xs" c="dimmed">
                      {t('portal.stat_pending_transactions')}
                    </Text>
                    <Text size="lg" fw={800} c={pendingTransactions > 0 ? 'orange' : 'dimmed'}>
                      {pendingTransactions}
                    </Text>
                  </Box>
                </Group>
              </Group>
            </Paper>

            {/* Damage charges */}
            <Paper
              radius="xl"
              style={{
                overflow: 'hidden',
                border: `1px solid var(--mantine-color-${pendingDamages > 0 ? 'red' : 'gray'}-3)`,
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
              }}
            >
              <Group gap={0} wrap="nowrap">
                <Box
                  style={{
                    width: 5,
                    alignSelf: 'stretch',
                    background:
                      pendingDamages > 0
                        ? 'var(--mantine-color-red-5)'
                        : 'var(--mantine-color-gray-4)',
                    flexShrink: 0,
                  }}
                />
                <Group gap="sm" p="md" wrap="nowrap" style={{ flex: 1 }}>
                  <ThemeIcon
                    size={42}
                    radius="md"
                    variant="light"
                    color={pendingDamages > 0 ? 'red' : 'gray'}
                    style={{ flexShrink: 0 }}
                  >
                    <IconAlertTriangle size={20} />
                  </ThemeIcon>
                  <Box>
                    <Text size="xs" c="dimmed">
                      {t('portal.stat_damage_charges')}
                    </Text>
                    <Text size="lg" fw={800} c={pendingDamages > 0 ? 'red' : 'dimmed'}>
                      {pendingDamages > 0
                        ? `₺${pendingDamages.toLocaleString()}`
                        : t('portal.none')}
                    </Text>
                  </Box>
                </Group>
              </Group>
            </Paper>
          </SimpleGrid>

          {pendingDamages > 0 && (
            <Alert icon={<IconInfoCircle size={14} />} color="orange" radius="xl" variant="light">
              {t('portal.damage_charges_warning')}
            </Alert>
          )}

          {/* Tabs */}
          <Paper
            radius="xl"
            style={{
              overflow: 'hidden',
              border: '1px solid var(--mantine-color-default-border)',
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            }}
          >
            <Tabs defaultValue="transactions" radius={0}>
              <Tabs.List px="md" pt="xs">
                <Tabs.Tab value="transactions" leftSection={<IconReceipt size={14} />}>
                  {t('portal.tab_transactions')} ({transactions.length})
                </Tabs.Tab>
                <Tabs.Tab value="damages" leftSection={<IconAlertTriangle size={14} />} color="red">
                  {t('portal.tab_damage_reports')} ({damages.length})
                </Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="transactions" p="md">
                <Box visibleFrom="sm">
                  <TransactionsTable items={transactions} />
                </Box>
                <Box hiddenFrom="sm">
                  <TransactionCards items={transactions} />
                </Box>
              </Tabs.Panel>

              <Tabs.Panel value="damages" p="md">
                <Box visibleFrom="sm">
                  <DamagesTable items={damages} />
                </Box>
                <Box hiddenFrom="sm">
                  <DamageCards items={damages} />
                </Box>
              </Tabs.Panel>
            </Tabs>
          </Paper>
        </>
      )}
    </Stack>
  );
}

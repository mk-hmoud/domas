import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Badge,
  Box,
  Card,
  Group,
  SimpleGrid,
  Skeleton,
  Stack,
  Table,
  Tabs,
  Text,
  ThemeIcon,
  Title,
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
        <ThemeIcon size={40} radius="xl" variant="light" color="gray">
          <IconReceipt size={20} />
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
        borderRadius: 'var(--mantine-radius-md)',
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
                  <Badge size="sm" variant="light" color={color}>
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
                    <Badge size="sm" variant="dot" color="green">
                      {t('portal.approved_label')}
                    </Badge>
                  ) : (
                    <Badge size="sm" variant="dot" color="gray">
                      {t('portal.payment_pending')}
                    </Badge>
                  )}
                </Table.Td>
                <Table.Td style={{ textAlign: 'right' }}>
                  <Text size="sm" fw={700}>
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
        <ThemeIcon size={40} radius="xl" variant="light" color="gray">
          <IconReceipt size={20} />
        </ThemeIcon>
        <Text size="sm" c="dimmed">
          {t('portal.no_transactions')}
        </Text>
      </Stack>
    );
  }

  return (
    <Stack gap="xs">
      {items.map((tx) => {
        const { label, color } = transactionTypeLabel(tx.transactionType);
        return (
          <Card key={tx.id} withBorder radius="md" p="sm">
            <Group justify="space-between" align="flex-start">
              <Box style={{ flex: 1 }}>
                <Group gap="xs" mb={2}>
                  <Badge size="xs" variant="light" color={color}>
                    {label}
                  </Badge>
                  {tx.isApproved ? (
                    <Badge size="xs" variant="dot" color="green">
                      {t('portal.approved_label')}
                    </Badge>
                  ) : (
                    <Badge size="xs" variant="dot" color="gray">
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
              <Text size="sm" fw={700}>
                ₺{tx.amount.toLocaleString()}
              </Text>
            </Group>
          </Card>
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
        <ThemeIcon size={40} radius="xl" variant="light" color="gray">
          <IconAlertTriangle size={20} />
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
        borderRadius: 'var(--mantine-radius-md)',
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
                  <Badge size="sm" variant="light" color={statusColor}>
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
        <ThemeIcon size={40} radius="xl" variant="light" color="gray">
          <IconAlertTriangle size={20} />
        </ThemeIcon>
        <Text size="sm" c="dimmed">
          {t('portal.no_damage_liabilities')}
        </Text>
      </Stack>
    );
  }

  return (
    <Stack gap="xs">
      {items.map((d) => {
        const statusColor =
          d.reportStatus === 'approved' ? 'red' : d.reportStatus === 'rejected' ? 'gray' : 'orange';
        return (
          <Card key={d.id} withBorder radius="md" p="sm">
            <Group justify="space-between" align="flex-start">
              <Box style={{ flex: 1 }}>
                <Badge size="xs" variant="light" color={statusColor} mb={4}>
                  {d.reportStatus.charAt(0).toUpperCase() + d.reportStatus.slice(1)}
                </Badge>
                <Text size="sm" fw={500}>
                  {d.description}
                </Text>
                <Text size="xs" c="dimmed" mt={2}>
                  {t('portal.reported_prefix')} {new Date(d.reportedAt).toLocaleDateString()}
                </Text>
              </Box>
              <Text size="sm" fw={700} c="red">
                {d.currency} {d.amount.toLocaleString()}
              </Text>
            </Group>
          </Card>
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

  const totalPaid = transactions.filter((t) => t.isApproved).reduce((sum, t) => sum + t.amount, 0);

  const pendingTransactions = transactions.filter((t) => !t.isApproved).length;

  const pendingDamages = damages
    .filter((d) => d.reportStatus === 'approved')
    .reduce((sum, d) => sum + d.amount, 0);

  return (
    <Stack gap="lg">
      <Box>
        <Title order={3}>{t('portal.financial_title')}</Title>
        <Text size="sm" c="dimmed">
          {t('portal.financial_subtitle')}
        </Text>
      </Box>

      {isLoading ? (
        <Stack gap="md">
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
            <Skeleton height={80} radius="md" />
            <Skeleton height={80} radius="md" />
            <Skeleton height={80} radius="md" />
          </SimpleGrid>
          <Skeleton height={200} radius="md" />
        </Stack>
      ) : (
        <>
          {/* Stats row */}
          <SimpleGrid cols={{ base: 1, xs: 2, sm: 3 }} spacing="md">
            <Card withBorder radius="md" p="md">
              <Group gap="sm" wrap="nowrap">
                <ThemeIcon
                  size={40}
                  radius="xl"
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
                  <Text size="lg" fw={700} c="teal">
                    ₺{totalPaid.toLocaleString()}
                  </Text>
                </Box>
              </Group>
            </Card>

            <Card withBorder radius="md" p="md">
              <Group gap="sm" wrap="nowrap">
                <ThemeIcon
                  size={40}
                  radius="xl"
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
                  <Text size="lg" fw={700} c={pendingTransactions > 0 ? 'orange' : 'dimmed'}>
                    {pendingTransactions}
                  </Text>
                </Box>
              </Group>
            </Card>

            <Card withBorder radius="md" p="md">
              <Group gap="sm" wrap="nowrap">
                <ThemeIcon
                  size={40}
                  radius="xl"
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
                  <Text size="lg" fw={700} c={pendingDamages > 0 ? 'red' : 'dimmed'}>
                    {pendingDamages > 0 ? `₺${pendingDamages.toLocaleString()}` : t('portal.none')}
                  </Text>
                </Box>
              </Group>
            </Card>
          </SimpleGrid>

          {pendingDamages > 0 && (
            <Alert icon={<IconInfoCircle size={14} />} color="orange" radius="md" variant="light">
              {t('portal.damage_charges_warning')}
            </Alert>
          )}

          {/* Tabs */}
          <Tabs defaultValue="transactions" radius="md">
            <Tabs.List>
              <Tabs.Tab value="transactions" leftSection={<IconReceipt size={14} />}>
                {t('portal.tab_transactions')} ({transactions.length})
              </Tabs.Tab>
              <Tabs.Tab value="damages" leftSection={<IconAlertTriangle size={14} />}>
                {t('portal.tab_damage_reports')} ({damages.length})
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="transactions" pt="md">
              <Box visibleFrom="sm">
                <TransactionsTable items={transactions} />
              </Box>
              <Box hiddenFrom="sm">
                <TransactionCards items={transactions} />
              </Box>
            </Tabs.Panel>

            <Tabs.Panel value="damages" pt="md">
              <Box visibleFrom="sm">
                <DamagesTable items={damages} />
              </Box>
              <Box hiddenFrom="sm">
                <DamageCards items={damages} />
              </Box>
            </Tabs.Panel>
          </Tabs>
        </>
      )}
    </Stack>
  );
}

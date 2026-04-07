import { useEffect, useState } from 'react';
import {
  Alert,
  Badge,
  Box,
  Card,
  Divider,
  Group,
  Skeleton,
  Stack,
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

function transactionTypeLabel(type: StudentTransaction['transactionType']): {
  label: string;
  color: string;
} {
  switch (type) {
    case 'deposit':
      return { label: 'Deposit', color: 'blue' };
    case 'rent':
      return { label: 'Rent', color: 'teal' };
    case 'fine':
      return { label: 'Fine', color: 'red' };
    default:
      return { label: type, color: 'gray' };
  }
}

function TransactionsList({ items }: { items: StudentTransaction[] }) {
  if (items.length === 0) {
    return (
      <Stack align="center" gap="xs" py="xl">
        <ThemeIcon size={40} radius="xl" variant="light" color="gray">
          <IconReceipt size={20} />
        </ThemeIcon>
        <Text size="sm" c="dimmed">
          No transactions recorded yet.
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
                      Approved
                    </Badge>
                  ) : (
                    <Badge size="xs" variant="dot" color="gray">
                      Pending
                    </Badge>
                  )}
                </Group>
                <Text size="xs" c="dimmed">
                  {tx.semesterDisplayName}
                </Text>
                <Text size="xs" c="dimmed" mt={2}>
                  {new Date(tx.createdAt).toLocaleDateString()}
                  {tx.approvedAt && ` · Approved ${new Date(tx.approvedAt).toLocaleDateString()}`}
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

function DamagesList({ items }: { items: StudentDamageLiability[] }) {
  if (items.length === 0) {
    return (
      <Stack align="center" gap="xs" py="xl">
        <ThemeIcon size={40} radius="xl" variant="light" color="gray">
          <IconAlertTriangle size={20} />
        </ThemeIcon>
        <Text size="sm" c="dimmed">
          No damage liabilities on your account.
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
                <Group gap="xs" mb={2}>
                  <Badge size="xs" variant="light" color={statusColor}>
                    {d.reportStatus.charAt(0).toUpperCase() + d.reportStatus.slice(1)}
                  </Badge>
                </Group>
                <Text size="sm" fw={500}>
                  {d.description}
                </Text>
                <Text size="xs" c="dimmed" mt={2}>
                  Reported: {new Date(d.reportedAt).toLocaleDateString()}
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

export function FinancialPage() {
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

  // Compute balance summary
  const totalPaid = transactions.filter((t) => t.isApproved).reduce((sum, t) => sum + t.amount, 0);

  const pendingDamages = damages
    .filter((d) => d.reportStatus === 'approved')
    .reduce((sum, d) => sum + d.amount, 0);

  return (
    <Stack p="md" gap="md" maw={640} mx="auto">
      <Box>
        <Title order={4}>Financial</Title>
        <Text size="sm" c="dimmed">
          Your payments and charges
        </Text>
      </Box>

      {isLoading ? (
        <Stack gap="sm">
          <Skeleton height={80} radius="md" />
          <Skeleton height={80} radius="md" />
          <Skeleton height={80} radius="md" />
        </Stack>
      ) : (
        <>
          {/* Summary card */}
          <Card withBorder radius="md" p="md">
            <Stack gap="sm">
              <Text fw={600} size="sm">
                Summary
              </Text>
              <Divider />
              <Group justify="space-between">
                <Group gap="xs">
                  <ThemeIcon size={24} radius="xl" variant="light" color="teal">
                    <IconCreditCard size={12} />
                  </ThemeIcon>
                  <Text size="sm">Total paid</Text>
                </Group>
                <Text size="sm" fw={700} c="teal">
                  ₺{totalPaid.toLocaleString()}
                </Text>
              </Group>
              {pendingDamages > 0 && (
                <Group justify="space-between">
                  <Group gap="xs">
                    <ThemeIcon size={24} radius="xl" variant="light" color="red">
                      <IconAlertTriangle size={12} />
                    </ThemeIcon>
                    <Text size="sm">Damage charges</Text>
                  </Group>
                  <Text size="sm" fw={700} c="red">
                    ₺{pendingDamages.toLocaleString()}
                  </Text>
                </Group>
              )}
            </Stack>
          </Card>

          {pendingDamages > 0 && (
            <Alert icon={<IconInfoCircle size={14} />} color="orange" radius="md" variant="light">
              You have outstanding damage charges. Please visit the dormitory office to settle them.
            </Alert>
          )}

          {/* Tabs */}
          <Tabs defaultValue="transactions" radius="md">
            <Tabs.List>
              <Tabs.Tab value="transactions" leftSection={<IconReceipt size={14} />}>
                Transactions
              </Tabs.Tab>
              <Tabs.Tab value="damages" leftSection={<IconAlertTriangle size={14} />}>
                Damage Reports
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="transactions" pt="md">
              <TransactionsList items={transactions} />
            </Tabs.Panel>

            <Tabs.Panel value="damages" pt="md">
              <DamagesList items={damages} />
            </Tabs.Panel>
          </Tabs>
        </>
      )}
    </Stack>
  );
}

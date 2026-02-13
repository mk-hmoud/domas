import { useState, useMemo, useEffect } from 'react';
import {
  TextInput,
  Tabs,
  Title,
  Text,
  Container,
  Group,
  Card,
  Badge,
  Button,
  Drawer,
  Stack,
  Divider,
  Paper,
  LoadingOverlay,
  Box,
} from '@mantine/core';
import { IconClock, IconCircleCheck, IconSearch, IconX, IconCheck } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { bookings, students, semesters } from '@domas/api-client';
import { BookingOpsStatus, PaymentStatus } from '@domas/ts-types';
import { notifications } from '@mantine/notifications';
import { PaymentsTable, StudentPayment, AccountingBulkActionsBar } from '@domas/ui';
import { modals } from '@mantine/modals';

export function AccountingPage() {
  const { t } = useTranslation();
  const [payments, setPayments] = useState<StudentPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<StudentPayment | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bookingsData, studentsData, semestersData] = await Promise.all([
        bookings.findAll(),
        students.findAll({ limit: 1000 }),
        semesters.findAll({ limit: 100 }),
      ]);

      const studentMap = new Map(studentsData.data.map((s) => [s.id, s]));
      const semesterMap = new Map(semestersData.data.map((s) => [s.id, s]));

      const mappedPayments: StudentPayment[] = bookingsData.map((booking) => {
        const student = studentMap.get(booking.studentId);
        const semester = semesterMap.get(booking.semesterId);

        const isTR = student?.nationalityCode === 'TR';
        const amount = isTR ? semester?.depositAmountTry || 0 : semester?.depositAmountForeign || 0;
        const currency = isTR ? 'TRY' : semester?.foreignCurrencyCode || 'EUR';

        return {
          id: booking.id,
          studentNumber: student?.studentNumber || 'N/A',
          studentName: student ? `${student.firstName} ${student.lastName}` : 'Unknown Student',
          studentEmail: student?.email || 'N/A',
          bookingType: semester?.displayName || 'Unknown Semester',
          amount,
          currency,
          status: booking.status,
          date: booking.createdAt,
          processedAt: booking.accountingApprovedAt,
        };
      });

      setPayments(mappedPayments);
    } catch (error) {
      console.error(error);
      notifications.show({
        title: t('error'),
        message: t('failed_to_fetch_data'),
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const { pendingPayments, processedPayments } = useMemo(() => {
    const pending = payments.filter((p) => p.status === BookingOpsStatus.PENDING_ACCOUNTING);
    const processed = payments
      .filter(
        (p) =>
          p.status !== BookingOpsStatus.PENDING_ACCOUNTING && p.status !== BookingOpsStatus.DRAFT,
      )
      .sort((a, b) => {
        const dateA = a.processedAt
          ? new Date(a.processedAt).getTime()
          : new Date(a.date).getTime();
        const dateB = b.processedAt
          ? new Date(b.processedAt).getTime()
          : new Date(b.date).getTime();
        return dateB - dateA;
      });
    return { pendingPayments: pending, processedPayments: processed };
  }, [payments]);

  const filterPayments = (list: StudentPayment[]) => {
    if (!searchQuery) return list;
    const query = searchQuery.toLowerCase();
    return list.filter(
      (p) =>
        p.studentNumber.toLowerCase().includes(query) ||
        p.studentName.toLowerCase().includes(query) ||
        p.studentEmail.toLowerCase().includes(query) ||
        p.bookingType.toLowerCase().includes(query),
    );
  };

  const filteredPending = useMemo(
    () => filterPayments(pendingPayments),
    [pendingPayments, searchQuery],
  );
  const filteredHistory = useMemo(
    () => filterPayments(processedPayments),
    [processedPayments, searchQuery],
  );

  const handleRowClick = (payment: StudentPayment) => {
    setSelectedPayment(payment);
    setPanelOpen(true);
  };

  const handleToggleSelection = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const handleToggleSelectAll = (list: StudentPayment[]) => {
    const selectableIds = list
      .filter((p) => p.status === BookingOpsStatus.PENDING_ACCOUNTING)
      .map((p) => p.id);
    const allSelected = selectableIds.every((id) => selectedIds.includes(id));

    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !selectableIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...selectableIds])));
    }
  };

  const handleAcceptPayment = async (payment: StudentPayment) => {
    try {
      await bookings.approveFinancials(payment.id, {
        approved: true,
        paymentStatus: PaymentStatus.PAID,
      });
      notifications.show({
        title: t('success'),
        message: t('payment_accepted'),
        color: 'green',
      });
      setPanelOpen(false);
      setSelectedPayment(null);
      fetchData();
    } catch (error) {
      notifications.show({
        title: t('error'),
        message: t('failed_to_accept_payment'),
        color: 'red',
      });
    }
  };

  const handleRejectPayment = async (payment: StudentPayment) => {
    try {
      await bookings.approveFinancials(payment.id, {
        approved: false,
      });
      notifications.show({
        title: t('success'),
        message: t('payment_rejected'),
        color: 'blue',
      });
      setPanelOpen(false);
      setSelectedPayment(null);
      fetchData();
    } catch (error) {
      notifications.show({
        title: t('error'),
        message: t('failed_to_reject_payment'),
        color: 'red',
      });
    }
  };

  const handleBulkAccept = () => {
    modals.openConfirmModal({
      title: t('accept_selected_payments', {
        defaultValue: 'Accept Selected Payments',
      }),
      children: (
        <Text size="sm">
          {t('bulk_accept_confirm', {
            count: selectedIds.length,
            defaultValue: `Are you sure you want to accept ${selectedIds.length} payments?`,
          })}
        </Text>
      ),
      labels: { confirm: t('confirm'), cancel: t('cancel') },
      confirmProps: { color: 'green' },
      onConfirm: async () => {
        try {
          await Promise.all(
            selectedIds.map((id) =>
              bookings.approveFinancials(id, {
                approved: true,
                paymentStatus: PaymentStatus.PAID,
              }),
            ),
          );
          notifications.show({
            title: t('success'),
            message: t('payment_accepted'),
            color: 'green',
          });
          fetchData();
          setSelectedIds([]);
        } catch (error) {
          notifications.show({
            title: t('error'),
            message: t('failed_to_accept_payment'),
            color: 'red',
          });
        }
      },
    });
  };

  const handleBulkReject = () => {
    modals.openConfirmModal({
      title: t('reject_selected_payments', {
        defaultValue: 'Reject Selected Payments',
      }),
      children: (
        <Text size="sm">
          {t('bulk_reject_confirm', {
            count: selectedIds.length,
            defaultValue: `Are you sure you want to reject ${selectedIds.length} payments?`,
          })}
        </Text>
      ),
      labels: { confirm: t('confirm'), cancel: t('cancel') },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await Promise.all(
            selectedIds.map((id) => bookings.approveFinancials(id, { approved: false })),
          );
          notifications.show({
            title: t('success'),
            message: t('payment_rejected'),
            color: 'blue',
          });
          fetchData();
          setSelectedIds([]);
        } catch (error) {
          notifications.show({
            title: t('error'),
            message: t('failed_to_reject_payment'),
            color: 'red',
          });
        }
      },
    });
  };

  const formatCurrency = (amount: number, currency = 'TRY') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <Container size="lg" py="xl" style={{ position: 'relative' }}>
      <LoadingOverlay visible={loading} />

      <Group justify="space-between" mb="lg">
        <div>
          <Title order={2}>
            {t('accounting_page_title', {
              defaultValue: 'Accounting Dashboard',
            })}
          </Title>
          <Text c="dimmed" size="sm">
            {t('accounting_page_description', {
              defaultValue: 'Manage and process student booking payments',
            })}
          </Text>
        </div>
      </Group>

      <Card withBorder padding="md" radius="md" mb="md">
        <TextInput
          placeholder={t('search_placeholder')}
          leftSection={<IconSearch size={16} />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
        />
      </Card>

      <Tabs defaultValue="pending">
        <Tabs.List mb="md">
          <Tabs.Tab value="pending" leftSection={<IconClock size={14} />}>
            {t('pending')} ({pendingPayments.length})
          </Tabs.Tab>
          <Tabs.Tab value="history" leftSection={<IconCircleCheck size={14} />}>
            {t('history')} ({processedPayments.length})
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="pending">
          <Paper withBorder radius="md">
            <PaymentsTable
              data={filteredPending}
              onSelect={handleRowClick}
              onAccept={handleAcceptPayment}
              onReject={handleRejectPayment}
              selectedIds={selectedIds}
              onToggleSelection={handleToggleSelection}
              onToggleSelectAll={() => handleToggleSelectAll(filteredPending)}
            />
            {filteredPending.length === 0 && !loading && (
              <Text c="dimmed" ta="center" py="xl">
                {t('no_payments_found', {
                  defaultValue: 'No pending payments found',
                })}
              </Text>
            )}
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="history">
          <Paper withBorder radius="md">
            <PaymentsTable data={filteredHistory} onSelect={handleRowClick} />
            {filteredHistory.length === 0 && !loading && (
              <Text c="dimmed" ta="center" py="xl">
                {t('no_history_found', { defaultValue: 'No history found' })}
              </Text>
            )}
          </Paper>
        </Tabs.Panel>
      </Tabs>

      <AccountingBulkActionsBar
        selectedCount={selectedIds.length}
        onAccept={handleBulkAccept}
        onReject={handleBulkReject}
        onClear={() => setSelectedIds([])}
      />

      <Drawer
        opened={panelOpen}
        onClose={() => setPanelOpen(false)}
        title={t('payment_details')}
        position="right"
        size="md"
      >
        {selectedPayment && (
          <Stack gap="md">
            <Group justify="space-between">
              <Title order={3}>{selectedPayment.studentName}</Title>
              <Badge
                color={
                  selectedPayment.status === BookingOpsStatus.PENDING_ACCOUNTING
                    ? 'yellow'
                    : 'green'
                }
              >
                {selectedPayment.status.replace(/_/g, ' ')}
              </Badge>
            </Group>

            <Divider />

            <Box>
              <Text size="xs" c="dimmed">
                {t('student_number')}
              </Text>
              <Text fw={500}>{selectedPayment.studentNumber}</Text>
            </Box>

            <Box>
              <Text size="xs" c="dimmed">
                {t('email')}
              </Text>
              <Text fw={500}>{selectedPayment.studentEmail}</Text>
            </Box>

            <Box>
              <Text size="xs" c="dimmed">
                {t('booking')}
              </Text>
              <Text fw={500}>{selectedPayment.bookingType}</Text>
            </Box>

            <Box>
              <Text size="xs" c="dimmed">
                {t('amount')}
              </Text>
              <Text size="xl" fw={700} c="blue">
                {formatCurrency(selectedPayment.amount, selectedPayment.currency)}
              </Text>
            </Box>

            <Box>
              <Text size="xs" c="dimmed">
                {t('date')}
              </Text>
              <Text fw={500}>{new Date(selectedPayment.date).toLocaleString()}</Text>
            </Box>

            {selectedPayment.status === BookingOpsStatus.PENDING_ACCOUNTING && (
              <Group grow mt="xl">
                <Button
                  color="red"
                  variant="light"
                  leftSection={<IconX size={16} />}
                  onClick={() => handleRejectPayment(selectedPayment)}
                >
                  {t('reject')}
                </Button>
                <Button
                  color="green"
                  leftSection={<IconCheck size={16} />}
                  onClick={() => handleAcceptPayment(selectedPayment)}
                >
                  {t('accept')}
                </Button>
              </Group>
            )}
          </Stack>
        )}
      </Drawer>
    </Container>
  );
}

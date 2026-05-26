import { useState, useMemo, useEffect } from 'react';
import {
  TextInput,
  Tabs,
  Text,
  Group,
  Card,
  Badge,
  Button,
  Drawer,
  Stack,
  Divider,
  Paper,
  LoadingOverlay,
  Table,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import {
  IconClock,
  IconCircleCheck,
  IconSearch,
  IconX,
  IconCheck,
  IconArrowsExchange,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { bookings, students, semesters, roomChanges } from '@domas/api-client';
import { BookingOpsStatus, PaymentStatus, RoomChangeRequestView } from '@domas/ts-types';
import { notifications } from '@mantine/notifications';
import {
  PaymentsTable,
  StudentPayment,
  AccountingBulkActionsBar,
  PageHeader,
  PageShell,
  LabelValue,
  EmptyState,
} from '@domas/ui';
import { modals } from '@mantine/modals';

export function AccountingPage() {
  const { t } = useTranslation();
  const [payments, setPayments] = useState<StudentPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<StudentPayment | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [roomChangeRequests, setRoomChangeRequests] = useState<RoomChangeRequestView[]>([]);
  const [roomChangeLoading, setRoomChangeLoading] = useState(true);

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

  const fetchRoomChangeRequests = async () => {
    setRoomChangeLoading(true);
    try {
      const all = await roomChanges.getAll();
      setRoomChangeRequests(all.filter((r) => r.requiresPayment));
    } catch {
      notifications.show({ title: t('error'), message: t('failed_to_fetch_data'), color: 'red' });
    } finally {
      setRoomChangeLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchRoomChangeRequests();
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

  const pendingRoomChangePayments = useMemo(
    () => roomChangeRequests.filter((r) => r.status === 'pending_payment'),
    [roomChangeRequests],
  );
  const processedRoomChangePayments = useMemo(
    () =>
      roomChangeRequests.filter((r) => r.status !== 'pending_payment' && r.status !== 'pending'),
    [roomChangeRequests],
  );

  const handleApproveRoomChangePayment = async (request: RoomChangeRequestView) => {
    try {
      await roomChanges.approvePayment(request.id, { approved: true });
      notifications.show({ title: t('success'), message: t('payment_accepted'), color: 'green' });
      fetchRoomChangeRequests();
    } catch {
      notifications.show({
        title: t('error'),
        message: t('failed_to_accept_payment'),
        color: 'red',
      });
    }
  };

  const handleRejectRoomChangePayment = (request: RoomChangeRequestView) => {
    modals.openConfirmModal({
      title: t('reject_payment', { defaultValue: 'Reject Payment' }),
      children: (
        <Text size="sm">
          {t('reject_room_change_payment_confirm', {
            defaultValue: `Reject the payment for ${request.studentName}'s room change? This will also reject their request.`,
            name: request.studentName,
          })}
        </Text>
      ),
      labels: { confirm: t('reject'), cancel: t('cancel') },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await roomChanges.approvePayment(request.id, { approved: false });
          notifications.show({
            title: t('success'),
            message: t('payment_rejected'),
            color: 'blue',
          });
          fetchRoomChangeRequests();
        } catch {
          notifications.show({
            title: t('error'),
            message: t('failed_to_reject_payment'),
            color: 'red',
          });
        }
      },
    });
  };

  return (
    <>
      <PageHeader
        title={t('accounting_page_title', { defaultValue: 'Accounting Dashboard' })}
        subtitle={t('accounting_page_description', {
          defaultValue: 'Manage and process student booking payments',
        })}
      />
      <PageShell>
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
            <Tabs.Tab
              value="pending"
              leftSection={<IconClock size={14} />}
              rightSection={
                pendingPayments.length > 0 ? (
                  <Badge size="xs" color="orange" variant="filled">
                    {pendingPayments.length}
                  </Badge>
                ) : undefined
              }
            >
              {t('pending')}
            </Tabs.Tab>
            <Tabs.Tab
              value="history"
              leftSection={<IconCircleCheck size={14} />}
              rightSection={
                <Badge size="xs" color="gray" variant="light">
                  {processedPayments.length}
                </Badge>
              }
            >
              {t('history')}
            </Tabs.Tab>
            <Tabs.Tab
              value="room-changes"
              leftSection={<IconArrowsExchange size={14} />}
              rightSection={
                pendingRoomChangePayments.length > 0 ? (
                  <Badge size="xs" color="orange" variant="filled">
                    {pendingRoomChangePayments.length}
                  </Badge>
                ) : undefined
              }
            >
              {t('room_change_payments', { defaultValue: 'Room Change Fees' })}
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="pending">
            <Paper withBorder radius="md" style={{ position: 'relative' }}>
              <LoadingOverlay visible={loading} overlayProps={{ blur: 2 }} />
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
                <EmptyState
                  title={t('no_payments_found', { defaultValue: 'No pending payments found' })}
                />
              )}
            </Paper>
          </Tabs.Panel>

          <Tabs.Panel value="history">
            <Paper withBorder radius="md" style={{ position: 'relative' }}>
              <LoadingOverlay visible={loading} overlayProps={{ blur: 2 }} />
              <PaymentsTable data={filteredHistory} onSelect={handleRowClick} />
              {filteredHistory.length === 0 && !loading && (
                <EmptyState title={t('no_history_found', { defaultValue: 'No history found' })} />
              )}
            </Paper>
          </Tabs.Panel>

          <Tabs.Panel value="room-changes">
            <Stack gap="md">
              <Paper withBorder radius="md" style={{ position: 'relative' }}>
                <LoadingOverlay visible={roomChangeLoading} overlayProps={{ blur: 2 }} />
                {pendingRoomChangePayments.length === 0 && !roomChangeLoading ? (
                  <EmptyState
                    title={t('no_pending_room_change_payments', {
                      defaultValue: 'No pending room change fee approvals',
                    })}
                  />
                ) : (
                  <Table striped highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>{t('student')}</Table.Th>
                        <Table.Th>{t('student_number')}</Table.Th>
                        <Table.Th>{t('requested_bed', { defaultValue: 'Requested Bed' })}</Table.Th>
                        <Table.Th>{t('amount')}</Table.Th>
                        <Table.Th>{t('date')}</Table.Th>
                        <Table.Th></Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {pendingRoomChangePayments.map((r) => (
                        <Table.Tr key={r.id}>
                          <Table.Td>{r.studentName}</Table.Td>
                          <Table.Td>{r.studentNumber}</Table.Td>
                          <Table.Td>
                            {r.requestedBedLabel}
                            <Text size="xs" c="dimmed">
                              {r.requestedLocationPath}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Text fw={600} c="blue">
                              {formatCurrency(r.paymentAmount ?? 0, r.paymentCurrency ?? 'TRY')}
                            </Text>
                          </Table.Td>
                          <Table.Td>{new Date(r.createdAt).toLocaleDateString()}</Table.Td>
                          <Table.Td>
                            <Group gap="xs" justify="flex-end">
                              <Tooltip label={t('reject')}>
                                <ActionIcon
                                  color="red"
                                  variant="light"
                                  onClick={() => handleRejectRoomChangePayment(r)}
                                >
                                  <IconX size={14} />
                                </ActionIcon>
                              </Tooltip>
                              <Tooltip label={t('accept')}>
                                <ActionIcon
                                  color="green"
                                  variant="light"
                                  onClick={() => handleApproveRoomChangePayment(r)}
                                >
                                  <IconCheck size={14} />
                                </ActionIcon>
                              </Tooltip>
                            </Group>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                )}
              </Paper>

              {processedRoomChangePayments.length > 0 && (
                <Paper withBorder radius="md">
                  <Text size="sm" fw={600} p="sm" c="dimmed">
                    {t('processed', { defaultValue: 'Processed' })}
                  </Text>
                  <Table striped>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>{t('student')}</Table.Th>
                        <Table.Th>{t('requested_bed', { defaultValue: 'Requested Bed' })}</Table.Th>
                        <Table.Th>{t('amount')}</Table.Th>
                        <Table.Th>{t('status')}</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {processedRoomChangePayments.map((r) => (
                        <Table.Tr key={r.id}>
                          <Table.Td>{r.studentName}</Table.Td>
                          <Table.Td>{r.requestedBedLabel}</Table.Td>
                          <Table.Td>
                            {formatCurrency(r.paymentAmount ?? 0, r.paymentCurrency ?? 'TRY')}
                          </Table.Td>
                          <Table.Td>
                            <Badge
                              size="xs"
                              color={r.isAccountingApproved ? 'green' : 'red'}
                              variant="light"
                            >
                              {r.isAccountingApproved ? t('approved') : t('rejected')}
                            </Badge>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Paper>
              )}
            </Stack>
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
            <Stack gap="lg">
              <Group justify="space-between" align="flex-start">
                <Text fw={700} size="md">
                  {selectedPayment.studentName}
                </Text>
                <Badge
                  variant="light"
                  color={
                    selectedPayment.status === BookingOpsStatus.PENDING_ACCOUNTING
                      ? 'yellow'
                      : selectedPayment.status === BookingOpsStatus.REJECTED ||
                          selectedPayment.status === BookingOpsStatus.CANCELLED
                        ? 'red'
                        : 'green'
                  }
                >
                  {selectedPayment.status.replace(/_/g, ' ')}
                </Badge>
              </Group>

              <Divider />

              <Group grow>
                <LabelValue label={t('student_number')}>{selectedPayment.studentNumber}</LabelValue>
                <LabelValue label={t('email')}>{selectedPayment.studentEmail}</LabelValue>
              </Group>

              <LabelValue label={t('booking')}>{selectedPayment.bookingType}</LabelValue>

              <LabelValue label={t('amount')}>
                <Text size="xl" fw={700} c="blue">
                  {formatCurrency(selectedPayment.amount, selectedPayment.currency)}
                </Text>
              </LabelValue>

              <LabelValue label={t('date')}>
                {new Date(selectedPayment.date).toLocaleString()}
              </LabelValue>

              {selectedPayment.status === BookingOpsStatus.PENDING_ACCOUNTING && (
                <Group grow mt="md">
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
      </PageShell>
    </>
  );
}

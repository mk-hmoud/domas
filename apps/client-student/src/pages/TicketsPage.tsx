import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Badge, Box, Button, Group, Loader, Paper, Stack, Text, ThemeIcon } from '@domas/ui';
import { IconAlertCircle, IconMessageReport, IconPlus } from '@tabler/icons-react';
import { portalTickets } from '@domas/api-client';
import { CreateTicketDto, StudentTicketView, TicketStatus } from '@domas/ts-types';
import { notifications } from '@mantine/notifications';
import { useCurrentBooking } from '../hooks/useCurrentBooking';
import { PortalPageHeader } from '../components/PortalPageHeader';
import { CreateTicketModal } from '../components/CreateTicketModal';

const STATUS_COLOR: Record<TicketStatus, string> = {
  [TicketStatus.OPEN]: 'yellow',
  [TicketStatus.ESCALATED]: 'blue',
  [TicketStatus.RESOLVED]: 'green',
  [TicketStatus.REJECTED]: 'red',
};

export function TicketsPage() {
  const { t } = useTranslation();
  const { booking, isLoading: bookingLoading } = useCurrentBooking();
  const [ticketList, setTicketList] = useState<StudentTicketView[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpened, setModalOpened] = useState(false);

  const fetchTickets = () => {
    setLoading(true);
    portalTickets
      .getAll()
      .then(setTicketList)
      .catch(() => setTicketList([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSubmit = async (dto: CreateTicketDto) => {
    try {
      await portalTickets.create(dto);
      notifications.show({ message: t('portal.ticket_submit_success'), color: 'green' });
      setModalOpened(false);
      fetchTickets();
    } catch {
      notifications.show({ message: t('portal.ticket_submit_error'), color: 'red' });
    }
  };

  const active = ticketList.filter(
    (ti) => ti.status === TicketStatus.OPEN || ti.status === TicketStatus.ESCALATED,
  );
  const history = ticketList.filter(
    (ti) => ti.status === TicketStatus.RESOLVED || ti.status === TicketStatus.REJECTED,
  );

  return (
    <Stack gap="lg">
      <PortalPageHeader
        icon={IconMessageReport}
        color="orange"
        title={t('portal.tickets_title')}
        subtitle={t('portal.tickets_subtitle')}
        action={
          <Button
            leftSection={<IconPlus size={16} />}
            radius="xl"
            variant="gradient"
            gradient={{ from: 'blue', to: 'cyan' }}
            disabled={bookingLoading || !booking}
            onClick={() => setModalOpened(true)}
          >
            {t('report_an_issue')}
          </Button>
        }
      />

      {!bookingLoading && !booking && (
        <Alert icon={<IconAlertCircle size={16} />} color="yellow" radius="xl" variant="light">
          {t('portal.tickets_no_booking')}
        </Alert>
      )}

      {loading ? (
        <Group justify="center" py="xl">
          <Loader size="lg" />
        </Group>
      ) : (
        <>
          {active.length > 0 && (
            <Stack gap="sm">
              <Text fw={700} size="sm">
                {t('portal.tickets_active_section')}
              </Text>
              {active.map((ti) => (
                <TicketCard key={ti.id} ticket={ti} />
              ))}
            </Stack>
          )}

          <Stack gap="sm">
            <Text fw={700} size="sm">
              {t('portal.tickets_history_section')}
            </Text>
            {history.length === 0 ? (
              <Text size="sm" c="dimmed">
                {t('portal.tickets_no_history')}
              </Text>
            ) : (
              history.map((ti) => <TicketCard key={ti.id} ticket={ti} />)
            )}
          </Stack>
        </>
      )}

      <CreateTicketModal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        onSubmit={handleSubmit}
      />
    </Stack>
  );
}

function TicketCard({ ticket }: { ticket: StudentTicketView }) {
  const { t } = useTranslation();
  return (
    <Paper radius="xl" p="md" style={{ border: '1px solid var(--mantine-color-default-border)' }}>
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
          <ThemeIcon
            size={32}
            radius="md"
            variant="light"
            color={STATUS_COLOR[ticket.status]}
            style={{ flexShrink: 0 }}
          >
            <IconMessageReport size={16} />
          </ThemeIcon>
          <Box style={{ minWidth: 0 }}>
            <Text size="sm" fw={600} lineClamp={1}>
              {ticket.title}
            </Text>
            <Text size="xs" c="dimmed" lineClamp={2}>
              {ticket.description}
            </Text>
            {ticket.status === TicketStatus.REJECTED && ticket.rejectionReason && (
              <Text size="xs" c="red.7" mt={2}>
                {ticket.rejectionReason}
              </Text>
            )}
            {ticket.status === TicketStatus.RESOLVED && ticket.resolutionNotes && (
              <Text size="xs" c="green.7" mt={2}>
                {ticket.resolutionNotes}
              </Text>
            )}
          </Box>
        </Group>
        <Stack gap={4} align="flex-end" style={{ flexShrink: 0 }}>
          <Badge color={STATUS_COLOR[ticket.status]} variant="light" radius="xl" size="sm">
            {t(`ticket_status.${ticket.status}`)}
          </Badge>
          <Text size="xs" c="dimmed">
            {new Date(ticket.createdAt).toLocaleDateString()}
          </Text>
        </Stack>
      </Group>
    </Paper>
  );
}

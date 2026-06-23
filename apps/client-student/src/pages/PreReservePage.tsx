import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Box,
  Button,
  Group,
  Paper,
  Select,
  Stack,
  Text,
  Textarea,
  ThemeIcon,
  Title,
} from '@domas/ui';
import { IconAlertCircle, IconArrowLeft, IconCalendarCheck } from '@tabler/icons-react';
import { PortalSemester, RoomTypeCatalogItem } from '@domas/ts-types';
import { portalPreReservations, portalSemesters } from '@domas/api-client';

export function PreReservePage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isTr = i18n.language === 'tr';

  const [availableSemesters, setAvailableSemesters] = useState<PortalSemester[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomTypeCatalogItem[]>([]);
  const [isLoadingSemesters, setIsLoadingSemesters] = useState(true);
  const [isLoadingRoomTypes, setIsLoadingRoomTypes] = useState(false);

  const [selectedSemesterId, setSelectedSemesterId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<string | null>(null);
  const [note, setNote] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    portalSemesters
      .getBookable()
      .then((all) => {
        const preReservable = all.filter((s) => s.allowPreReservations);
        setAvailableSemesters(preReservable);
      })
      .catch(() => {})
      .finally(() => setIsLoadingSemesters(false));
  }, []);

  const selectedSemester =
    availableSemesters.find((s) => String(s.id) === selectedSemesterId) ?? null;

  useEffect(() => {
    if (!selectedSemester) {
      setRoomTypes([]);
      setSelectedRoomTypeId(null);
      setStartDate('');
      setEndDate('');
      return;
    }
    setStartDate(selectedSemester.startDate);
    setEndDate(selectedSemester.endDate);
    setIsLoadingRoomTypes(true);
    portalSemesters
      .getRoomCatalog(selectedSemester.id)
      .then(setRoomTypes)
      .catch(() => setRoomTypes([]))
      .finally(() => setIsLoadingRoomTypes(false));
  }, [selectedSemesterId]);

  const canSubmit = !!selectedSemesterId && !!startDate && !!endDate && !isSubmitting;

  const handleSubmit = async () => {
    if (!selectedSemesterId) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await portalPreReservations.create({
        semesterId: parseInt(selectedSemesterId, 10),
        startDate,
        endDate,
        roomTypeId: selectedRoomTypeId ? parseInt(selectedRoomTypeId, 10) : undefined,
        note: note.trim() || undefined,
      });
      navigate('/dashboard');
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        t('portal.error_generic', { defaultValue: 'Something went wrong' });
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Stack gap="lg" maw={560} mx="auto">
      <Group gap="sm">
        <Button
          variant="subtle"
          leftSection={<IconArrowLeft size={16} />}
          onClick={() => navigate('/dashboard')}
          px={0}
        >
          {t('portal.back', { defaultValue: 'Back' })}
        </Button>
      </Group>

      <Box>
        <Group gap="sm" mb={4}>
          <ThemeIcon size={40} radius="xl" variant="light" color="teal">
            <IconCalendarCheck size={20} />
          </ThemeIcon>
          <Title order={3}>
            {t('portal.pre_reserve_title', { defaultValue: 'Pre-Reserve a Spot' })}
          </Title>
        </Group>
        <Text size="sm" c="dimmed">
          {t('portal.pre_reserve_description', {
            defaultValue:
              'Hold a time slot for an upcoming semester. A room and bed will be assigned by admin later.',
          })}
        </Text>
      </Box>

      <Paper radius="xl" p="xl" withBorder>
        <Stack gap="md">
          {isLoadingSemesters ? (
            <Text size="sm" c="dimmed">
              {t('portal.loading', { defaultValue: 'Loading…' })}
            </Text>
          ) : availableSemesters.length === 0 ? (
            <Alert icon={<IconAlertCircle size={16} />} color="gray" radius="lg">
              {t('portal.no_pre_reservable_semesters', {
                defaultValue: 'No semesters are currently accepting pre-reservations.',
              })}
            </Alert>
          ) : (
            <>
              <Select
                label={t('portal.semester_label', { defaultValue: 'Semester' })}
                placeholder={t('portal.select_semester', { defaultValue: 'Select a semester' })}
                data={availableSemesters.map((s) => ({
                  value: String(s.id),
                  label: s.displayName,
                }))}
                value={selectedSemesterId}
                onChange={setSelectedSemesterId}
                radius="lg"
              />

              {selectedSemester && (
                <>
                  <Group grow>
                    <Box>
                      <Text size="sm" fw={500} mb={4}>
                        {t('portal.start_date', { defaultValue: 'Start date' })}
                      </Text>
                      <input
                        type="date"
                        value={startDate}
                        min={selectedSemester.startDate}
                        max={selectedSemester.endDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: 8,
                          border: '1px solid var(--mantine-color-default-border)',
                          fontSize: 14,
                          background: 'var(--mantine-color-body)',
                          color: 'var(--mantine-color-text)',
                        }}
                      />
                    </Box>
                    <Box>
                      <Text size="sm" fw={500} mb={4}>
                        {t('portal.end_date', { defaultValue: 'End date' })}
                      </Text>
                      <input
                        type="date"
                        value={endDate}
                        min={startDate || selectedSemester.startDate}
                        max={selectedSemester.endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: 8,
                          border: '1px solid var(--mantine-color-default-border)',
                          fontSize: 14,
                          background: 'var(--mantine-color-body)',
                          color: 'var(--mantine-color-text)',
                        }}
                      />
                    </Box>
                  </Group>

                  <Select
                    label={t('portal.room_type_preference', {
                      defaultValue: 'Room type preference (optional)',
                    })}
                    placeholder={t('portal.no_preference', { defaultValue: 'No preference' })}
                    clearable
                    data={roomTypes.map((rt) => ({
                      value: String(rt.id),
                      label: isTr && rt.nameTr ? rt.nameTr : rt.name,
                    }))}
                    value={selectedRoomTypeId}
                    onChange={setSelectedRoomTypeId}
                    disabled={isLoadingRoomTypes}
                    radius="lg"
                  />

                  <Textarea
                    label={t('portal.note_optional', { defaultValue: 'Note (optional)' })}
                    placeholder={t('portal.pre_reserve_note_placeholder', {
                      defaultValue: 'Any special requirements or context for the admin…',
                    })}
                    value={note}
                    onChange={(e) => setNote(e.currentTarget.value)}
                    radius="lg"
                    autosize
                    minRows={2}
                    maxRows={5}
                  />
                </>
              )}

              {error && (
                <Alert icon={<IconAlertCircle size={16} />} color="red" radius="lg">
                  {error}
                </Alert>
              )}

              <Button
                onClick={handleSubmit}
                loading={isSubmitting}
                disabled={!canSubmit}
                radius="xl"
                leftSection={<IconCalendarCheck size={16} />}
                variant="gradient"
                gradient={{ from: 'teal', to: 'cyan' }}
              >
                {t('portal.submit_pre_reservation', { defaultValue: 'Submit Pre-Reservation' })}
              </Button>
            </>
          )}
        </Stack>
      </Paper>
    </Stack>
  );
}

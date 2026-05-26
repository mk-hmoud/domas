import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Box,
  Button,
  Group,
  Modal,
  Paper,
  SegmentedControl,
  Skeleton,
  Stack,
  Text,
  Textarea,
  ThemeIcon,
} from '@domas/ui';
import { IconBed, IconInfoCircle, IconMapPin, IconX } from '@tabler/icons-react';
import { AvailableBed } from '@domas/ts-types';
import { portalRoomChanges, portalSemesters } from '@domas/api-client';

interface Props {
  opened: boolean;
  onClose: () => void;
  semesterId: number;
  onSuccess: () => void;
}

export function RoomChangeBedModal({ opened, onClose, semesterId, onSuccess }: Props) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'specific' | 'open'>('specific');
  const [beds, setBeds] = useState<AvailableBed[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBedId, setSelectedBedId] = useState<number | null>(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!opened) return;
    setMode('specific');
    setSelectedBedId(null);
    setNote('');
    setError(null);
    setLoading(true);
    portalSemesters
      .getAvailableBeds(semesterId)
      .then(setBeds)
      .catch(() => setError(t('portal.beds_load_error')))
      .finally(() => setLoading(false));
  }, [opened, semesterId]);

  const rooms = useMemo(() => {
    const map = new Map<
      number,
      { roomId: number; roomName: string; locationPath: string; beds: AvailableBed[] }
    >();
    beds.forEach((bed) => {
      const entry = map.get(bed.roomId);
      if (entry) {
        entry.beds.push(bed);
      } else {
        const segments = bed.locationPath.split(' > ');
        const contextPath = segments.slice(1, -1).join(' › ');
        map.set(bed.roomId, {
          roomId: bed.roomId,
          roomName: bed.roomName,
          locationPath: contextPath,
          beds: [bed],
        });
      }
    });
    return [...map.values()].sort((a, b) => a.roomName.localeCompare(b.roomName));
  }, [beds]);

  const handleSubmit = async () => {
    if (mode === 'specific' && !selectedBedId) return;
    setSubmitting(true);
    setError(null);
    try {
      await portalRoomChanges.create(semesterId, {
        requestedBedId: mode === 'specific' ? selectedBedId! : undefined,
        note: note || undefined,
      });
      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? t('portal.room_change_submit_error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={t('portal.room_change_modal_title')}
      size="lg"
      scrollAreaComponent={undefined}
    >
      <Stack gap="md">
        {error && (
          <Alert icon={<IconX size={14} />} color="red" radius="md">
            {error}
          </Alert>
        )}

        <SegmentedControl
          value={mode}
          onChange={(v) => {
            setMode(v as 'specific' | 'open');
            setSelectedBedId(null);
          }}
          data={[
            {
              label: t('portal.room_change_mode_specific', { defaultValue: 'Choose a bed' }),
              value: 'specific',
            },
            {
              label: t('portal.room_change_mode_open', { defaultValue: 'Open request' }),
              value: 'open',
            },
          ]}
          fullWidth
        />

        {mode === 'open' ? (
          <Alert icon={<IconInfoCircle size={14} />} color="blue" variant="light" radius="md">
            {t('portal.room_change_open_hint', {
              defaultValue: 'Staff will assign you a bed when they review your request.',
            })}
          </Alert>
        ) : loading ? (
          <Stack gap="sm">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} height={60} radius="lg" />
            ))}
          </Stack>
        ) : rooms.length === 0 ? (
          <Alert icon={<IconInfoCircle size={14} />} color="blue" radius="md">
            {t('portal.room_change_no_available_beds')}
          </Alert>
        ) : (
          <Stack gap="sm" style={{ maxHeight: 380, overflowY: 'auto' }}>
            {rooms.map((room) => (
              <Paper
                key={room.roomId}
                radius="lg"
                p="sm"
                withBorder
                style={{
                  borderColor: room.beds.some((b) => b.id === selectedBedId)
                    ? 'var(--mantine-color-blue-5)'
                    : undefined,
                }}
              >
                <Stack gap={6}>
                  <Group gap={6} wrap="nowrap">
                    <ThemeIcon size={20} radius="sm" variant="light" color="teal">
                      <IconMapPin size={12} />
                    </ThemeIcon>
                    <Box style={{ minWidth: 0 }}>
                      <Text size="xs" fw={600} lineClamp={1}>
                        {room.roomName}
                      </Text>
                      {room.locationPath && (
                        <Text size="xs" c="dimmed" lineClamp={1}>
                          {room.locationPath}
                        </Text>
                      )}
                    </Box>
                  </Group>

                  <Group gap={6} wrap="wrap">
                    {room.beds.map((bed) => {
                      const isSelected = bed.id === selectedBedId;
                      return (
                        <Paper
                          key={bed.id}
                          radius="md"
                          px="sm"
                          py={6}
                          withBorder
                          style={{
                            cursor: 'pointer',
                            background: isSelected ? 'var(--mantine-color-blue-light)' : undefined,
                            borderColor: isSelected ? 'var(--mantine-color-blue-5)' : undefined,
                            borderWidth: isSelected ? 2 : 1,
                            transition: 'all 0.12s ease',
                          }}
                          onClick={() => setSelectedBedId(isSelected ? null : bed.id)}
                        >
                          <Group gap={5} wrap="nowrap">
                            <ThemeIcon
                              size={16}
                              radius="sm"
                              variant={isSelected ? 'filled' : 'light'}
                              color="blue"
                            >
                              <IconBed size={10} />
                            </ThemeIcon>
                            <Text size="xs" fw={isSelected ? 700 : 500}>
                              {t('portal.bed_label', { label: bed.label })}
                            </Text>
                          </Group>
                        </Paper>
                      );
                    })}
                  </Group>
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}

        {(mode === 'open' || selectedBedId) && (
          <Textarea
            label={t('portal.room_change_note_label')}
            placeholder={t('portal.room_change_note_placeholder')}
            radius="md"
            autosize
            minRows={2}
            maxRows={4}
            value={note}
            onChange={(e) => setNote(e.currentTarget.value)}
          />
        )}

        <Group justify="flex-end" mt="xs">
          <Button variant="default" onClick={onClose} disabled={submitting}>
            {t('cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={mode === 'specific' && !selectedBedId}
            loading={submitting}
          >
            {t('portal.room_change_submit')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

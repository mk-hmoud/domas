import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  Divider,
  Grid,
  Group,
  Stack,
  Text,
  TextInput,
  Title,
} from '@domas/ui';
import { IconCheck, IconDeviceFloppy, IconInfoCircle, IconUser } from '@tabler/icons-react';
import { portalProfile } from '@domas/api-client';
import { useStudentAuth } from '../contexts/StudentAuthContext';

export function ProfilePage() {
  const { student, logout } = useStudentAuth();
  const { t } = useTranslation();

  const [email, setEmail] = useState(student?.email ?? '');
  const [phoneNumber, setPhoneNumber] = useState(student?.phoneNumber ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  if (!student) return null;

  const fullName = `${student.firstName} ${student.lastName}`;
  const initials = `${student.firstName[0]}${student.lastName[0]}`.toUpperCase();

  const hasChanges =
    email.trim() !== (student.email ?? '') || phoneNumber.trim() !== (student.phoneNumber ?? '');

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError(null);
    try {
      await portalProfile.updateContact({
        email: email.trim() || undefined,
        phoneNumber: phoneNumber.trim() || undefined,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? t('portal.contact_save_error');
      setSaveError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Stack gap="md">
      <Box>
        <Title order={4}>{t('portal.profile_title')}</Title>
        <Text size="sm" c="dimmed">
          {t('portal.profile_subtitle')}
        </Text>
      </Box>

      <Grid gutter="md" align="flex-start">
        {/* Left — identity (read-only) */}
        <Grid.Col span={{ base: 12, sm: 5 }}>
          <Card withBorder radius="md" p="md">
            <Group gap="md" mb="md">
              <Avatar size={56} radius="xl" color="blue">
                {initials}
              </Avatar>
              <Box>
                <Text fw={700} size="md">
                  {fullName}
                </Text>
                <Text size="sm" c="dimmed">
                  {student.studentNumber}
                </Text>
              </Box>
            </Group>

            <Divider mb="md" />

            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  {t('department')}
                </Text>
                <Text size="sm" ta="right" style={{ maxWidth: '60%' }}>
                  {student.department}
                </Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  {t('gender')}
                </Text>
                <Text size="sm" tt="capitalize">
                  {student.gender}
                </Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  {t('nationality')}
                </Text>
                <Text size="sm">{student.nationalityCode}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  {t('portal.date_of_birth')}
                </Text>
                <Text size="sm">{new Date(student.birthDate).toLocaleDateString()}</Text>
              </Group>
            </Stack>
          </Card>
        </Grid.Col>

        {/* Right — editable contact + session */}
        <Grid.Col span={{ base: 12, sm: 7 }}>
          <Stack gap="md">
            <Card withBorder radius="md" p="md">
              <Stack gap="md">
                <Group gap="xs">
                  <IconUser size={16} />
                  <Text fw={600} size="sm">
                    {t('portal.contact_information')}
                  </Text>
                </Group>

                <Alert icon={<IconInfoCircle size={14} />} color="blue" variant="light" radius="md">
                  {t('portal.contact_info_hint')}
                </Alert>

                <TextInput
                  label={t('email')}
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.currentTarget.value)}
                  inputMode="email"
                  autoComplete="email"
                />

                <TextInput
                  label={t('phone_number')}
                  placeholder="+90 5XX XXX XX XX"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.currentTarget.value)}
                  inputMode="tel"
                  autoComplete="tel"
                />

                {saveError && (
                  <Alert
                    color="red"
                    radius="md"
                    variant="light"
                    withCloseButton
                    onClose={() => setSaveError(null)}
                  >
                    {saveError}
                  </Alert>
                )}

                {saveSuccess && (
                  <Alert icon={<IconCheck size={14} />} color="green" radius="md" variant="light">
                    {t('portal.contact_saved')}
                  </Alert>
                )}

                <Button
                  leftSection={<IconDeviceFloppy size={16} />}
                  onClick={handleSave}
                  loading={isSaving}
                  disabled={!hasChanges || isSaving}
                >
                  {t('save_changes')}
                </Button>
              </Stack>
            </Card>

            <Card withBorder radius="md" p="md">
              <Stack gap="xs">
                <Text fw={600} size="sm">
                  {t('portal.session')}
                </Text>
                <Text size="xs" c="dimmed">
                  {t('portal.signed_in_as', { number: student.studentNumber })}
                </Text>
                <Button
                  variant="outline"
                  color="red"
                  onClick={logout}
                  style={{ alignSelf: 'flex-start' }}
                >
                  {t('portal.sign_out')}
                </Button>
              </Stack>
            </Card>
          </Stack>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}

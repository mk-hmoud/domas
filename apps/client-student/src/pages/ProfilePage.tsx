import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Avatar, Box, Button, Grid, Group, Paper, Stack, Text, TextInput } from '@domas/ui';
import {
  IconBrandWhatsapp,
  IconCheck,
  IconDeviceFloppy,
  IconInfoCircle,
  IconLogout,
  IconMail,
  IconPhone,
} from '@tabler/icons-react';
import { portalProfile } from '@domas/api-client';
import { useStudentAuth } from '../contexts/StudentAuthContext';

export function ProfilePage() {
  const { student, logout } = useStudentAuth();
  const { t } = useTranslation();

  const [email, setEmail] = useState(student?.email ?? '');
  const [phoneNumber, setPhoneNumber] = useState(student?.phoneNumber ?? '');
  const [whatsappNumber, setWhatsappNumber] = useState(student?.whatsappNumber ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  if (!student) return null;

  const fullName = `${student.firstName} ${student.lastName}`;
  const initials = `${student.firstName[0]}${student.lastName[0]}`.toUpperCase();

  const hasChanges =
    email.trim() !== (student.email ?? '') ||
    phoneNumber.trim() !== (student.phoneNumber ?? '') ||
    whatsappNumber.trim() !== (student.whatsappNumber ?? '');

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError(null);
    try {
      await portalProfile.updateContact({
        email: email.trim() || undefined,
        phoneNumber: phoneNumber.trim() || undefined,
        whatsappNumber: whatsappNumber.trim() || undefined,
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
    <Stack gap="lg">
      {/* Compact profile header */}
      <Group gap="md" align="center" mb={4}>
        <Avatar
          size={48}
          radius="lg"
          color="blue"
          style={{ flexShrink: 0, fontSize: 18, fontWeight: 700 }}
        >
          {initials}
        </Avatar>
        <Box style={{ minWidth: 0 }}>
          <Text fw={700} size="xl" lh={1.1} truncate>
            {fullName}
          </Text>
          <Text size="sm" c="dimmed">
            {student.studentNumber} · {student.department}
          </Text>
        </Box>
      </Group>

      <Grid gutter="md" align="flex-start">
        {/* Left — identity (read-only) */}
        <Grid.Col span={{ base: 12, sm: 5 }}>
          <Paper
            radius="xl"
            p="lg"
            style={{
              border: '1px solid var(--mantine-color-default-border)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
            }}
          >
            <Text fw={700} size="sm" mb="md">
              {t('portal.profile_title')}
            </Text>

            <Stack gap="sm">
              {[
                { label: t('department'), value: student.department },
                { label: t('gender'), value: student.gender },
                { label: t('nationality'), value: student.nationalityCode },
                {
                  label: t('portal.date_of_birth'),
                  value: new Date(student.birthDate).toLocaleDateString(),
                },
              ].map(({ label, value }) => (
                <Group key={label} justify="space-between" wrap="nowrap">
                  <Text size="sm" c="dimmed" style={{ flexShrink: 0 }}>
                    {label}
                  </Text>
                  <Text size="sm" fw={500} ta="right" style={{ maxWidth: '60%' }}>
                    {value}
                  </Text>
                </Group>
              ))}
            </Stack>
          </Paper>
        </Grid.Col>

        {/* Right — editable contact + session */}
        <Grid.Col span={{ base: 12, sm: 7 }}>
          <Stack gap="md">
            <Paper
              radius="xl"
              p="lg"
              style={{
                border: '1px solid var(--mantine-color-default-border)',
                boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
              }}
            >
              <Stack gap="lg">
                <Text fw={700} size="sm">
                  {t('portal.contact_information')}
                </Text>

                <Alert icon={<IconInfoCircle size={14} />} color="blue" variant="light" radius="lg">
                  {t('portal.contact_info_hint')}
                </Alert>

                <TextInput
                  label={t('email')}
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.currentTarget.value)}
                  inputMode="email"
                  autoComplete="email"
                  radius="lg"
                  leftSection={<IconMail size={15} />}
                />

                <TextInput
                  label={t('phone_number')}
                  placeholder="+90 5XX XXX XX XX"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.currentTarget.value)}
                  inputMode="tel"
                  autoComplete="tel"
                  radius="lg"
                  leftSection={<IconPhone size={15} />}
                />

                <TextInput
                  label={t('whatsapp_number', { defaultValue: 'WhatsApp Number' })}
                  placeholder="+90 5XX XXX XX XX"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.currentTarget.value)}
                  inputMode="tel"
                  autoComplete="tel"
                  radius="lg"
                  leftSection={<IconBrandWhatsapp size={15} />}
                />

                {saveError && (
                  <Alert
                    color="red"
                    radius="lg"
                    variant="light"
                    withCloseButton
                    onClose={() => setSaveError(null)}
                  >
                    {saveError}
                  </Alert>
                )}

                {saveSuccess && (
                  <Alert icon={<IconCheck size={14} />} color="green" radius="lg" variant="light">
                    {t('portal.contact_saved')}
                  </Alert>
                )}

                <Button
                  leftSection={<IconDeviceFloppy size={16} />}
                  onClick={handleSave}
                  loading={isSaving}
                  disabled={!hasChanges || isSaving}
                  radius="xl"
                  variant="gradient"
                  gradient={{ from: 'blue', to: 'cyan' }}
                  style={{
                    boxShadow:
                      hasChanges && !isSaving ? '0 4px 14px rgba(34,139,230,0.3)' : undefined,
                    alignSelf: 'flex-start',
                  }}
                >
                  {t('save_changes')}
                </Button>
              </Stack>
            </Paper>

            <Paper
              radius="xl"
              p="lg"
              style={{
                border: '1px solid var(--mantine-color-red-3)',
                background: 'var(--mantine-color-red-light)',
              }}
            >
              <Stack gap="sm">
                <Text fw={700} size="sm">
                  {t('portal.session')}
                </Text>
                <Text size="xs" c="dimmed">
                  {t('portal.signed_in_as', { number: student.studentNumber })}
                </Text>
                <Button
                  variant="filled"
                  color="red"
                  leftSection={<IconLogout size={15} />}
                  onClick={logout}
                  radius="xl"
                  style={{ alignSelf: 'flex-start' }}
                >
                  {t('portal.sign_out')}
                </Button>
              </Stack>
            </Paper>
          </Stack>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}

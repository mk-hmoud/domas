import { useState } from 'react';
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
      const msg = err?.response?.data?.message ?? 'Failed to save changes.';
      setSaveError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Stack gap="md">
      <Box>
        <Title order={4}>Profile</Title>
        <Text size="sm" c="dimmed">
          Your account information
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
                  Department
                </Text>
                <Text size="sm" ta="right" style={{ maxWidth: '60%' }}>
                  {student.department}
                </Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  Gender
                </Text>
                <Text size="sm" tt="capitalize">
                  {student.gender}
                </Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  Nationality
                </Text>
                <Text size="sm">{student.nationalityCode}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  Date of Birth
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
                    Contact Information
                  </Text>
                </Group>

                <Alert icon={<IconInfoCircle size={14} />} color="blue" variant="light" radius="md">
                  Keep your contact details up to date so the dormitory office can reach you.
                </Alert>

                <TextInput
                  label="Email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.currentTarget.value)}
                  inputMode="email"
                  autoComplete="email"
                />

                <TextInput
                  label="Phone Number"
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
                    Contact information saved successfully.
                  </Alert>
                )}

                <Button
                  leftSection={<IconDeviceFloppy size={16} />}
                  onClick={handleSave}
                  loading={isSaving}
                  disabled={!hasChanges || isSaving}
                >
                  Save Changes
                </Button>
              </Stack>
            </Card>

            <Card withBorder radius="md" p="md">
              <Stack gap="xs">
                <Text fw={600} size="sm">
                  Session
                </Text>
                <Text size="xs" c="dimmed">
                  Signed in as student {student.studentNumber}
                </Text>
                <Button
                  variant="outline"
                  color="red"
                  onClick={logout}
                  style={{ alignSelf: 'flex-start' }}
                >
                  Sign Out
                </Button>
              </Stack>
            </Card>
          </Stack>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}

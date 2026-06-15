import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Center,
  DatePickerInput,
  Group,
  Image,
  Paper,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
} from '@domas/ui';
import {
  IconAlertCircle,
  IconArrowLeft,
  IconFileDescription,
  IconUpload,
  IconX,
} from '@tabler/icons-react';
import logo from '../assets/eul-logo.png';
import { useTranslation } from 'react-i18next';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { portalApplications } from '@domas/api-client';
import {
  ApplicationDocumentType,
  DEPARTMENTS,
  GenderType,
  SubmitApplicationDto,
} from '@domas/ts-types';
import { COUNTRIES } from '@domas/ts-types';

export function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [submitting, setSubmitting] = useState(false);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const [birthDate, setBirthDate] = useState<string | null>(null);
  const [birthDateError, setBirthDateError] = useState('');
  const [documentType, setDocumentType] = useState<ApplicationDocumentType>('freshman');
  const [certExpiryDate, setCertExpiryDate] = useState<string | null>(null);
  const [certExpiryError, setCertExpiryError] = useState('');

  const form = useForm<
    Omit<SubmitApplicationDto, 'birthDate' | 'documentType' | 'documentExpiryDate'>
  >({
    initialValues: {
      studentNumber: '',
      firstName: '',
      lastName: '',
      gender: GenderType.MALE,
      nationalityCode: '',
      nationalId: '',
      birthPlace: '',
      department: '',
      email: '',
      phoneNumber: '',
      whatsappNumber: '',
    },
    validate: {
      studentNumber: (v) => (v.trim() ? null : t('required_field', 'Required')),
      firstName: (v) => (v.trim() ? null : t('required_field', 'Required')),
      lastName: (v) => (v.trim() ? null : t('required_field', 'Required')),
      gender: (v) => (v ? null : t('required_field', 'Required')),
      nationalityCode: (v) => (v ? null : t('required_field', 'Required')),
      nationalId: (v) => (v.trim() ? null : t('required_field', 'Required')),
      birthPlace: (v) => (v.trim() ? null : t('required_field', 'Required')),
      department: (v) => (v ? null : t('required_field', 'Required')),
    },
  });

  const ACCEPTED = 'application/pdf,image/jpeg,image/png,image/webp';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    e.target.value = '';
    if (file) {
      setDocumentFile(file);
      setFileError('');
    }
  };

  const handleSubmit = async (
    values: Omit<SubmitApplicationDto, 'birthDate' | 'documentType' | 'documentExpiryDate'>,
  ) => {
    if (!birthDate) {
      setBirthDateError(t('required_field', 'Required'));
      return;
    }
    setBirthDateError('');

    if (documentType === 'returning' && !certExpiryDate) {
      setCertExpiryError(t('required_field', 'Required'));
      return;
    }
    setCertExpiryError('');

    if (!documentFile) {
      setFileError(
        documentType === 'returning'
          ? t('certificate_required', 'Student certificate is required')
          : t('letter_required', 'Acceptance letter is required'),
      );
      return;
    }

    const documentExpiryDateStr =
      documentType === 'returning' && certExpiryDate ? certExpiryDate : undefined;

    setSubmitting(true);
    try {
      const application = await portalApplications.submit(
        {
          ...values,
          birthDate: birthDate!,
          documentType,
          documentExpiryDate: documentExpiryDateStr,
          email: values.email || undefined,
          phoneNumber: values.phoneNumber || undefined,
          whatsappNumber: values.whatsappNumber || undefined,
        },
        documentFile,
      );
      navigate(`/register/status?id=${application.id}`, { replace: true });
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      notifications.show({
        title: t('error'),
        message: Array.isArray(msg) ? msg.join(', ') : (msg ?? t('action_failed', 'Action failed')),
        color: 'red',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const countryData = COUNTRIES.map(([code, name]) => ({ value: code, label: name }));
  const departmentData = DEPARTMENTS.map((d) => ({ value: d, label: d }));

  const isReturning = documentType === 'returning';

  return (
    <Box style={{ minHeight: '100dvh', background: 'var(--mantine-color-body)' }}>
      <Center p="md" pt="xl">
        <Stack w="100%" maw={560} gap="lg">
          <Stack gap={4} align="center">
            <Image src={logo} h={80} w="auto" fit="contain" mb={4} />
            <Title order={2} fw={800}>
              {t('portal.register_title', 'Student Registration')}
            </Title>
            <Text size="sm" c="dimmed" ta="center">
              {t('portal.register_subtitle', 'Fill in your details to apply for accommodation.')}
            </Text>
          </Stack>

          <Paper
            radius="xl"
            p="xl"
            style={{
              border: '1px solid var(--mantine-color-default-border)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
            }}
          >
            <form onSubmit={form.onSubmit(handleSubmit)}>
              <Stack gap="md">
                {/* Document type selector */}
                <Select
                  label={t('portal.registration_type', 'Registration Type')}
                  required
                  radius="lg"
                  value={documentType}
                  onChange={(v) => {
                    setDocumentType((v as ApplicationDocumentType) ?? 'freshman');
                    setDocumentFile(null);
                    setFileError('');
                    setCertExpiryDate(null);
                    setCertExpiryError('');
                  }}
                  data={[
                    {
                      value: 'freshman',
                      label: t(
                        'portal.doc_type_freshman',
                        'New Student — I have an acceptance letter',
                      ),
                    },
                    {
                      value: 'returning',
                      label: t(
                        'portal.doc_type_returning',
                        'Registered Student — I have a student certificate',
                      ),
                    },
                  ]}
                />

                <Text fw={700} size="sm" mt="xs">
                  {t('portal.identity', 'Identity')}
                </Text>

                <Group grow>
                  <TextInput
                    label={t('first_name')}
                    required
                    radius="lg"
                    {...form.getInputProps('firstName')}
                  />
                  <TextInput
                    label={t('last_name')}
                    required
                    radius="lg"
                    {...form.getInputProps('lastName')}
                  />
                </Group>

                <TextInput
                  label={t('student_number')}
                  required
                  radius="lg"
                  {...form.getInputProps('studentNumber')}
                />

                <Group grow>
                  <Select
                    label={t('gender')}
                    required
                    radius="lg"
                    data={[
                      { value: GenderType.MALE, label: t('male', 'Male') },
                      { value: GenderType.FEMALE, label: t('female', 'Female') },
                    ]}
                    {...form.getInputProps('gender')}
                  />
                  <Select
                    label={t('nationality')}
                    required
                    radius="lg"
                    searchable
                    data={countryData}
                    {...form.getInputProps('nationalityCode')}
                  />
                </Group>

                <Group grow>
                  <TextInput
                    label={t('national_id')}
                    required
                    radius="lg"
                    {...form.getInputProps('nationalId')}
                  />
                  <DatePickerInput
                    label={t('birth_date')}
                    required
                    radius="lg"
                    valueFormat="DD/MM/YYYY"
                    value={birthDate}
                    onChange={(value) => {
                      if (!value) {
                        setBirthDate(null);
                        return;
                      }
                      setBirthDate(
                        typeof value === 'string'
                          ? value
                          : (value as Date).toISOString().split('T')[0],
                      );
                    }}
                    error={birthDateError}
                  />
                </Group>

                <Group grow>
                  <TextInput
                    label={t('birth_place')}
                    required
                    radius="lg"
                    {...form.getInputProps('birthPlace')}
                  />
                  <Select
                    label={t('department')}
                    required
                    radius="lg"
                    searchable
                    data={departmentData}
                    {...form.getInputProps('department')}
                  />
                </Group>

                <Text fw={700} size="sm" mt="xs">
                  {t('portal.contact', 'Contact (optional)')}
                </Text>

                <Group grow>
                  <TextInput
                    label={t('email')}
                    radius="lg"
                    inputMode="email"
                    {...form.getInputProps('email')}
                  />
                  <TextInput
                    label={t('phone_number')}
                    radius="lg"
                    inputMode="tel"
                    {...form.getInputProps('phoneNumber')}
                  />
                </Group>

                <Text fw={700} size="sm" mt="xs">
                  {isReturning
                    ? t('portal.student_certificate', 'Student Certificate')
                    : t('portal.acceptance_letter', 'Acceptance Letter')}
                </Text>

                {isReturning && (
                  <DatePickerInput
                    label={t('portal.certificate_expiry', 'Certificate Expiry Date')}
                    required
                    radius="lg"
                    valueFormat="DD/MM/YYYY"
                    value={certExpiryDate}
                    onChange={setCertExpiryDate}
                    error={certExpiryError}
                    minDate={new Date()}
                  />
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED}
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />

                {documentFile ? (
                  <Paper withBorder p="sm" radius="md">
                    <Group justify="space-between" wrap="nowrap">
                      <Group gap="xs">
                        <IconFileDescription size={16} />
                        <Text size="sm" fw={500} truncate>
                          {documentFile.name}
                        </Text>
                        <Text size="xs" c="dimmed">
                          ({(documentFile.size / 1024).toFixed(0)} KB)
                        </Text>
                      </Group>
                      <Button
                        size="compact-xs"
                        variant="subtle"
                        color="red"
                        onClick={() => setDocumentFile(null)}
                      >
                        <IconX size={14} />
                      </Button>
                    </Group>
                  </Paper>
                ) : (
                  <Button
                    variant="light"
                    radius="lg"
                    leftSection={<IconUpload size={16} />}
                    onClick={() => fileInputRef.current?.click()}
                    color={fileError ? 'red' : undefined}
                  >
                    {isReturning
                      ? t('portal.upload_certificate', 'Upload Student Certificate')
                      : t('portal.upload_letter', 'Upload Acceptance Letter')}
                  </Button>
                )}

                {fileError && (
                  <Alert
                    icon={<IconAlertCircle size={14} />}
                    color="red"
                    variant="light"
                    radius="lg"
                  >
                    {fileError}
                  </Alert>
                )}

                <Text size="xs" c="dimmed">
                  {t('portal.letter_formats', 'Accepted formats: PDF, JPEG, PNG, WebP — max 10 MB')}
                </Text>

                <Button
                  type="submit"
                  loading={submitting}
                  radius="xl"
                  size="md"
                  variant="gradient"
                  gradient={{ from: 'blue', to: 'cyan' }}
                  mt="xs"
                >
                  {t('portal.submit_application', 'Submit Application')}
                </Button>
              </Stack>
            </form>
          </Paper>

          <Center>
            <Button
              variant="subtle"
              leftSection={<IconArrowLeft size={14} />}
              component={Link}
              to="/login"
            >
              {t('portal.back_to_login', 'Back to login')}
            </Button>
          </Center>
        </Stack>
      </Center>
    </Box>
  );
}

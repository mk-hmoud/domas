import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Divider,
  Group,
  Loader,
  Paper,
  Radio,
  Skeleton,
  Stack,
  Stepper,
  Text,
  ThemeIcon,
  Title,
} from '@domas/ui';
import {
  IconArrowLeft,
  IconArrowRight,
  IconBed,
  IconBuilding,
  IconCalendar,
  IconCheck,
  IconInfoCircle,
  IconX,
} from '@tabler/icons-react';
import { AvailableBed, PortalSemester } from '@domas/ts-types';
import { portalBookings, portalSemesters } from '@domas/api-client';
import { useCurrentBooking } from '../hooks/useCurrentBooking';

// ─── Step 1 — Semester picker ─────────────────────────────────────────────────

function SemesterStep({
  semesters,
  selected,
  onSelect,
}: {
  semesters: PortalSemester[];
  selected: PortalSemester | null;
  onSelect: (s: PortalSemester) => void;
}) {
  if (semesters.length === 0) {
    return (
      <Alert icon={<IconInfoCircle size={16} />} color="blue" radius="md">
        There are no accommodation periods currently open for applications. Check back later.
      </Alert>
    );
  }

  return (
    <Stack gap="sm">
      <Text size="sm" c="dimmed">
        Select the semester you want to apply for.
      </Text>
      {semesters.map((s) => (
        <Paper
          key={s.id}
          withBorder
          radius="md"
          p="md"
          style={{
            cursor: 'pointer',
            borderColor: selected?.id === s.id ? 'var(--mantine-color-blue-5)' : undefined,
            background: selected?.id === s.id ? 'var(--mantine-color-blue-0)' : undefined,
          }}
          onClick={() => onSelect(s)}
        >
          <Group justify="space-between" align="flex-start">
            <Box style={{ flex: 1 }}>
              <Group gap="xs" mb={4}>
                <Radio
                  checked={selected?.id === s.id}
                  onChange={() => onSelect(s)}
                  size="sm"
                  label={<Text fw={600}>{s.displayName}</Text>}
                />
              </Group>

              <Stack gap={2} pl={28}>
                <Group gap="xs">
                  <Text size="xs" c="dimmed">
                    Period:
                  </Text>
                  <Text size="xs">
                    {new Date(s.startDate).toLocaleDateString()} –{' '}
                    {new Date(s.endDate).toLocaleDateString()}
                  </Text>
                </Group>

                {s.bookingEndDate && (
                  <Group gap="xs">
                    <Text size="xs" c="dimmed">
                      Apply by:
                    </Text>
                    <Text size="xs" fw={500} c="orange">
                      {new Date(s.bookingEndDate).toLocaleDateString()}
                    </Text>
                  </Group>
                )}

                <Group gap="xs">
                  <Text size="xs" c="dimmed">
                    Deposit:
                  </Text>
                  <Text size="xs">
                    {s.depositAmountTry > 0
                      ? `₺${s.depositAmountTry.toLocaleString()}`
                      : `${s.depositAmountForeign} ${s.foreignCurrencyCode}`}
                  </Text>
                </Group>
              </Stack>
            </Box>
          </Group>
        </Paper>
      ))}
    </Stack>
  );
}

// ─── Step 2 — Bed picker ──────────────────────────────────────────────────────

function BedStep({
  semesterId,
  selected,
  onSelect,
}: {
  semesterId: number;
  selected: AvailableBed | null;
  onSelect: (b: AvailableBed) => void;
}) {
  const [beds, setBeds] = useState<AvailableBed[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setError(false);
    portalSemesters
      .getAvailableBeds(semesterId)
      .then(setBeds)
      .catch(() => setError(true))
      .finally(() => setIsLoading(false));
  }, [semesterId]);

  if (isLoading) {
    return (
      <Stack gap="sm">
        <Skeleton height={72} radius="md" />
        <Skeleton height={72} radius="md" />
        <Skeleton height={72} radius="md" />
      </Stack>
    );
  }

  if (error) {
    return (
      <Alert icon={<IconX size={16} />} color="red" radius="md">
        Failed to load available beds. Please go back and try again.
      </Alert>
    );
  }

  if (beds.length === 0) {
    return (
      <Alert icon={<IconInfoCircle size={16} />} color="blue" radius="md">
        No beds are available for this semester at the moment.
      </Alert>
    );
  }

  // Group by location
  const grouped = beds.reduce<Record<string, AvailableBed[]>>((acc, bed) => {
    const key = bed.locationPath;
    if (!acc[key]) acc[key] = [];
    acc[key].push(bed);
    return acc;
  }, {});

  return (
    <Stack gap="md">
      <Text size="sm" c="dimmed">
        Choose a bed from the available options.
      </Text>

      {Object.entries(grouped).map(([location, locationBeds]) => (
        <Stack key={location} gap="xs">
          <Group gap="xs">
            <ThemeIcon size={20} variant="transparent" c="dimmed">
              <IconBuilding size={14} />
            </ThemeIcon>
            <Text size="xs" fw={600} c="dimmed" tt="uppercase">
              {location}
            </Text>
          </Group>

          {locationBeds.map((bed) => {
            const isSelected = selected?.id === bed.id;
            return (
              <Paper
                key={bed.id}
                withBorder
                radius="md"
                p="sm"
                style={{
                  cursor: 'pointer',
                  borderColor: isSelected ? 'var(--mantine-color-blue-5)' : undefined,
                  background: isSelected ? 'var(--mantine-color-blue-0)' : undefined,
                }}
                onClick={() => onSelect(bed)}
              >
                <Group justify="space-between" align="center">
                  <Group gap="sm">
                    <Radio checked={isSelected} onChange={() => onSelect(bed)} size="sm" />
                    <Box>
                      <Text size="sm" fw={500}>
                        {bed.roomName} — Bed {bed.label}
                      </Text>
                      <Group gap={4} mt={2}>
                        {bed.genderLock && (
                          <Badge size="xs" variant="light" color="grape">
                            {bed.genderLock === 'male' ? 'Male' : 'Female'}
                          </Badge>
                        )}
                        {bed.isTrOnly && (
                          <Badge size="xs" variant="light" color="teal">
                            TR Citizens
                          </Badge>
                        )}
                        {bed.isForeignerOnly && (
                          <Badge size="xs" variant="light" color="orange">
                            International
                          </Badge>
                        )}
                      </Group>
                    </Box>
                  </Group>

                  {bed.basePrice != null && (
                    <Text size="sm" fw={600} c="blue">
                      ₺{bed.basePrice.toLocaleString()}
                    </Text>
                  )}
                </Group>
              </Paper>
            );
          })}
        </Stack>
      ))}
    </Stack>
  );
}

// ─── Step 3 — Review & confirm ────────────────────────────────────────────────

function ReviewStep({ semester, bed }: { semester: PortalSemester; bed: AvailableBed }) {
  return (
    <Stack gap="md">
      <Text size="sm" c="dimmed">
        Review your selection before submitting.
      </Text>

      <Paper withBorder radius="md" p="md">
        <Stack gap="sm">
          <Group gap="sm">
            <ThemeIcon size={32} radius="xl" variant="light" color="blue">
              <IconCalendar size={16} />
            </ThemeIcon>
            <Box>
              <Text size="xs" c="dimmed">
                Semester
              </Text>
              <Text size="sm" fw={600}>
                {semester.displayName}
              </Text>
            </Box>
          </Group>

          <Divider />

          <Group gap="sm">
            <ThemeIcon size={32} radius="xl" variant="light" color="teal">
              <IconBed size={16} />
            </ThemeIcon>
            <Box>
              <Text size="xs" c="dimmed">
                Accommodation
              </Text>
              <Text size="sm" fw={600}>
                {bed.roomName} — Bed {bed.label}
              </Text>
              <Text size="xs" c="dimmed">
                {bed.locationPath}
              </Text>
            </Box>
          </Group>

          <Divider />

          <Stack gap={4}>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                Period:
              </Text>
              <Text size="sm">
                {new Date(semester.startDate).toLocaleDateString()} –{' '}
                {new Date(semester.endDate).toLocaleDateString()}
              </Text>
            </Group>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                Deposit due:
              </Text>
              <Text size="sm" fw={500}>
                {semester.depositAmountTry > 0
                  ? `₺${semester.depositAmountTry.toLocaleString()}`
                  : `${semester.depositAmountForeign} ${semester.foreignCurrencyCode}`}
              </Text>
            </Group>
            {semester.paymentDeadlineDate && (
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  Payment deadline:
                </Text>
                <Text size="sm" c="orange">
                  {new Date(semester.paymentDeadlineDate).toLocaleDateString()}
                </Text>
              </Group>
            )}
          </Stack>
        </Stack>
      </Paper>

      <Alert icon={<IconInfoCircle size={14} />} color="blue" radius="md" variant="light">
        By submitting, your application will be sent for review by the accounting office. You will
        be notified once it is processed.
      </Alert>
    </Stack>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function ApplyPage() {
  const navigate = useNavigate();
  const { booking } = useCurrentBooking();

  const [step, setStep] = useState(0);
  const [semesters, setSemesters] = useState<PortalSemester[]>([]);
  const [isLoadingSemesters, setIsLoadingSemesters] = useState(true);
  const [selectedSemester, setSelectedSemester] = useState<PortalSemester | null>(null);
  const [selectedBed, setSelectedBed] = useState<AvailableBed | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Load bookable semesters on mount
  useEffect(() => {
    portalSemesters
      .getBookable()
      .then((data) => {
        setSemesters(data);
        // Auto-select if only one semester
        if (data.length === 1) setSelectedSemester(data[0]);
      })
      .catch(() => {})
      .finally(() => setIsLoadingSemesters(false));
  }, []);

  // Already has an active/pending booking — redirect to dashboard
  const hasActiveBooking = booking !== null;

  const handleNext = () => {
    if (step === 0 && selectedSemester) setStep(1);
    else if (step === 1 && selectedBed) setStep(2);
  };

  const handleBack = () => {
    if (step > 0) {
      setStep((s) => s - 1);
      if (step === 1) setSelectedBed(null);
    }
  };

  const handleSubmit = async () => {
    if (!selectedSemester || !selectedBed) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await portalBookings.create({ semesterId: selectedSemester.id, bedId: selectedBed.id });
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Failed to submit application. Please try again.';
      setSubmitError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canAdvance =
    (step === 0 && selectedSemester !== null) || (step === 1 && selectedBed !== null);

  return (
    <Stack p="md" gap="md" maw={640} mx="auto">
      <Box>
        <Title order={4}>Apply for Accommodation</Title>
        <Text size="sm" c="dimmed">
          Complete the steps below to submit your application.
        </Text>
      </Box>

      {hasActiveBooking && (
        <Alert icon={<IconInfoCircle size={16} />} color="orange" radius="md">
          You already have an active or pending booking. Visit{' '}
          <Text
            component="span"
            size="sm"
            c="blue"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate('/booking')}
          >
            My Room
          </Text>{' '}
          to view it.
        </Alert>
      )}

      {/* Stepper header */}
      <Stepper active={step} size="sm" radius="md">
        <Stepper.Step label="Semester" description="Choose period" />
        <Stepper.Step label="Bed" description="Choose room" />
        <Stepper.Step label="Confirm" description="Review & submit" />
      </Stepper>

      {/* Step content */}
      <Card withBorder radius="md" p="md">
        {isLoadingSemesters ? (
          <Stack gap="sm">
            <Skeleton height={80} radius="md" />
            <Skeleton height={80} radius="md" />
          </Stack>
        ) : step === 0 ? (
          <SemesterStep
            semesters={semesters}
            selected={selectedSemester}
            onSelect={(s) => {
              setSelectedSemester(s);
              setSelectedBed(null); // reset bed when semester changes
            }}
          />
        ) : step === 1 && selectedSemester ? (
          <BedStep
            semesterId={selectedSemester.id}
            selected={selectedBed}
            onSelect={setSelectedBed}
          />
        ) : step === 2 && selectedSemester && selectedBed ? (
          <ReviewStep semester={selectedSemester} bed={selectedBed} />
        ) : null}
      </Card>

      {/* Error */}
      {submitError && (
        <Alert
          icon={<IconX size={16} />}
          color="red"
          radius="md"
          onClose={() => setSubmitError(null)}
          withCloseButton
        >
          {submitError}
        </Alert>
      )}

      {/* Navigation */}
      <Group justify="space-between">
        <Button
          variant="subtle"
          leftSection={<IconArrowLeft size={16} />}
          onClick={step === 0 ? () => navigate('/dashboard') : handleBack}
          disabled={isSubmitting}
        >
          {step === 0 ? 'Cancel' : 'Back'}
        </Button>

        {step < 2 ? (
          <Button
            rightSection={<IconArrowRight size={16} />}
            onClick={handleNext}
            disabled={!canAdvance}
          >
            Next
          </Button>
        ) : (
          <Button
            leftSection={
              isSubmitting ? <Loader size={14} color="white" /> : <IconCheck size={16} />
            }
            onClick={handleSubmit}
            disabled={isSubmitting || hasActiveBooking}
            color="green"
          >
            {isSubmitting ? 'Submitting…' : 'Submit Application'}
          </Button>
        )}
      </Group>
    </Stack>
  );
}

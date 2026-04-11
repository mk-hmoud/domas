import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  SimpleGrid,
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
  IconChevronRight,
  IconCircle,
  IconCircleCheck,
  IconCircleDot,
  IconInfoCircle,
  IconMapPin,
  IconStack2,
  IconX,
} from '@tabler/icons-react';
import { AvailableBed, PortalSemester } from '@domas/ts-types';
import { portalBookings, portalSemesters } from '@domas/api-client';
import { useCurrentBooking } from '../hooks/useCurrentBooking';

// ─── Step content: Semester picker ───────────────────────────────────────────

function SemesterStep({
  semesters,
  selected,
  onSelect,
}: {
  semesters: PortalSemester[];
  selected: PortalSemester | null;
  onSelect: (s: PortalSemester) => void;
}) {
  const { t } = useTranslation();

  if (semesters.length === 0) {
    return (
      <Alert icon={<IconInfoCircle size={16} />} color="blue" radius="md">
        {t('portal.no_semesters_description')}
      </Alert>
    );
  }

  return (
    <Stack gap="sm">
      <Text size="sm" c="dimmed">
        {t('portal.select_semester_hint')}
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
            background: selected?.id === s.id ? 'var(--mantine-color-blue-light)' : undefined,
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
                    {t('portal.period_label')}
                  </Text>
                  <Text size="xs">
                    {new Date(s.startDate).toLocaleDateString()} –{' '}
                    {new Date(s.endDate).toLocaleDateString()}
                  </Text>
                </Group>
                {s.bookingEndDate && (
                  <Group gap="xs">
                    <Text size="xs" c="dimmed">
                      {t('portal.apply_by')}
                    </Text>
                    <Text size="xs" fw={500} c="orange">
                      {new Date(s.bookingEndDate).toLocaleDateString()}
                    </Text>
                  </Group>
                )}
                <Group gap="xs">
                  <Text size="xs" c="dimmed">
                    {t('portal.deposit_label')}
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

// ─── Step content: Bed picker (drilldown) ─────────────────────────────────────

const LEVEL_ICONS = [IconMapPin, IconBuilding, IconStack2] as const;

function BedStep({
  semesterId,
  selected,
  onSelect,
}: {
  semesterId: number;
  selected: AvailableBed | null;
  onSelect: (b: AvailableBed) => void;
}) {
  const { t } = useTranslation();
  const [beds, setBeds] = useState<AvailableBed[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [path, setPath] = useState<string[]>([]);

  useEffect(() => {
    setIsLoading(true);
    setError(false);
    setPath([]);
    portalSemesters
      .getAvailableBeds(semesterId)
      .then(setBeds)
      .catch(() => setError(true))
      .finally(() => setIsLoading(false));
  }, [semesterId]);

  // Remove the root node ("University") — it adds no navigation value
  const parsedBeds = useMemo(
    () => beds.map((b) => ({ ...b, segments: b.locationPath.split(' > ').slice(1) })),
    [beds],
  );

  // Beds that match the current drill path
  const filteredBeds = useMemo(
    () => parsedBeds.filter((b) => path.every((seg, i) => b.segments[i] === seg)),
    [parsedBeds, path],
  );

  // Group by the next path segment
  const groups = useMemo(() => {
    const map = new Map<string, number>();
    filteredBeds.forEach((b) => {
      const key = b.segments[path.length];
      if (key == null) return;
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    return [...map.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredBeds, path.length]);

  // No further grouping → we're at the bed level
  const showBeds = groups.length === 0;

  const LevelIcon = LEVEL_ICONS[Math.min(path.length, LEVEL_ICONS.length - 1)];

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
        {t('portal.beds_load_error')}
      </Alert>
    );
  }

  if (beds.length === 0) {
    return (
      <Alert icon={<IconInfoCircle size={16} />} color="blue" radius="md">
        {t('portal.no_beds_for_semester')}
      </Alert>
    );
  }

  return (
    <Stack gap="md">
      <Text size="sm" c="dimmed">
        {t('portal.browse_beds_hint')}
      </Text>

      {/* Breadcrumb */}
      <Group gap={4} wrap="wrap" align="center">
        <Text
          size="xs"
          c={path.length === 0 ? 'blue' : 'dimmed'}
          fw={path.length === 0 ? 600 : 400}
          style={{ cursor: 'pointer' }}
          onClick={() => setPath([])}
        >
          {t('portal.all_locations')}
        </Text>
        {path.map((seg, i) => (
          <Group key={i} gap={4} wrap="nowrap">
            <IconChevronRight size={11} style={{ color: 'var(--mantine-color-dimmed)' }} />
            <Text
              size="xs"
              c={i === path.length - 1 ? 'blue' : 'dimmed'}
              fw={i === path.length - 1 ? 600 : 400}
              style={{ cursor: 'pointer' }}
              onClick={() => setPath((p) => p.slice(0, i + 1))}
            >
              {seg}
            </Text>
          </Group>
        ))}
      </Group>

      {/* Back button */}
      {path.length > 0 && (
        <Box>
          <Button
            variant="subtle"
            size="xs"
            color="gray"
            leftSection={<IconArrowLeft size={14} />}
            onClick={() => setPath((p) => p.slice(0, -1))}
          >
            {t('back')}
          </Button>
        </Box>
      )}

      {/* Navigation cards */}
      {!showBeds && (
        <SimpleGrid cols={2} spacing="sm">
          {groups.map(({ name, count }) => (
            <Paper
              key={name}
              withBorder
              radius="md"
              p="md"
              style={{ cursor: 'pointer' }}
              onClick={() => setPath((p) => [...p, name])}
            >
              <Group justify="space-between" wrap="nowrap">
                <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
                  <ThemeIcon
                    size={36}
                    radius="xl"
                    variant="light"
                    color="blue"
                    style={{ flexShrink: 0 }}
                  >
                    <LevelIcon size={18} />
                  </ThemeIcon>
                  <Box style={{ minWidth: 0 }}>
                    <Text size="sm" fw={600} lineClamp={1}>
                      {name}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {count === 1
                        ? t('portal.bed_count_singular', { count })
                        : t('portal.bed_count_plural', { count })}
                    </Text>
                  </Box>
                </Group>
                <IconChevronRight
                  size={16}
                  style={{ color: 'var(--mantine-color-dimmed)', flexShrink: 0 }}
                />
              </Group>
            </Paper>
          ))}
        </SimpleGrid>
      )}

      {/* Bed cards */}
      {showBeds && (
        <Stack gap="xs">
          {filteredBeds.length === 0 ? (
            <Alert icon={<IconInfoCircle size={16} />} color="blue" radius="md">
              {t('portal.no_beds_at_location')}
            </Alert>
          ) : (
            <>
              <Text size="xs" c="dimmed">
                {filteredBeds.length === 1
                  ? t('portal.beds_available_singular', { count: filteredBeds.length })
                  : t('portal.beds_available_plural', { count: filteredBeds.length })}
              </Text>
              {filteredBeds.map((bed) => {
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
                      background: isSelected ? 'var(--mantine-color-blue-light)' : undefined,
                    }}
                    onClick={() => onSelect(bed)}
                  >
                    <Group justify="space-between" align="center">
                      <Group gap="sm">
                        <Radio checked={isSelected} onChange={() => onSelect(bed)} size="sm" />
                        <Box>
                          <Text size="sm" fw={500}>
                            {t('portal.bed_label', { label: bed.label })}
                          </Text>
                          <Group gap={4} mt={2}>
                            {bed.genderLock && (
                              <Badge size="xs" variant="light" color="grape">
                                {bed.genderLock === 'male' ? t('male') : t('female')}
                              </Badge>
                            )}
                            {bed.isTrOnly && (
                              <Badge size="xs" variant="light" color="teal">
                                {t('portal.tr_citizens')}
                              </Badge>
                            )}
                            {bed.isForeignerOnly && (
                              <Badge size="xs" variant="light" color="orange">
                                {t('portal.international')}
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
            </>
          )}
        </Stack>
      )}
    </Stack>
  );
}

// ─── Step content: Review ─────────────────────────────────────────────────────

function ReviewStep({ semester, bed }: { semester: PortalSemester; bed: AvailableBed }) {
  const { t } = useTranslation();
  return (
    <Stack gap="md">
      <Text size="sm" c="dimmed">
        {t('portal.review_hint')}
      </Text>
      <Paper withBorder radius="md" p="md">
        <Stack gap="sm">
          <Group gap="sm">
            <ThemeIcon size={32} radius="xl" variant="light" color="blue">
              <IconCalendar size={16} />
            </ThemeIcon>
            <Box>
              <Text size="xs" c="dimmed">
                {t('portal.step_semester_label')}
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
                {t('portal.accommodation_label')}
              </Text>
              <Text size="sm" fw={600}>
                {bed.roomName} — {t('portal.bed_label', { label: bed.label })}
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
                {t('portal.period_label')}
              </Text>
              <Text size="sm">
                {new Date(semester.startDate).toLocaleDateString()} –{' '}
                {new Date(semester.endDate).toLocaleDateString()}
              </Text>
            </Group>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                {t('portal.deposit_due_label')}
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
                  {t('portal.payment_deadline_label')}
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
        {t('portal.submit_notice')}
      </Alert>
    </Stack>
  );
}

// ─── Desktop step sidebar ─────────────────────────────────────────────────────

function DesktopStepsSidebar({ activeStep }: { activeStep: number }) {
  const { t } = useTranslation();
  const STEPS = [
    { label: t('portal.step_semester_label'), description: t('portal.step_semester_desc') },
    { label: t('portal.step_bed_label'), description: t('portal.step_bed_desc') },
    { label: t('portal.step_confirm_label'), description: t('portal.step_confirm_desc') },
  ];

  return (
    <Paper withBorder radius="md" p="lg" style={{ height: '100%' }}>
      <Text fw={700} size="sm" mb="lg">
        {t('portal.application_steps')}
      </Text>
      <Stack gap="lg">
        {STEPS.map((s, i) => {
          const isDone = i < activeStep;
          const isActive = i === activeStep;
          return (
            <Group key={s.label} gap="sm" align="flex-start">
              <ThemeIcon
                size={28}
                radius="xl"
                variant={isDone ? 'filled' : isActive ? 'filled' : 'light'}
                color={isDone ? 'green' : isActive ? 'blue' : 'gray'}
                style={{ flexShrink: 0, marginTop: 2 }}
              >
                {isDone ? (
                  <IconCircleCheck size={16} />
                ) : isActive ? (
                  <IconCircleDot size={16} />
                ) : (
                  <IconCircle size={16} />
                )}
              </ThemeIcon>
              <Box>
                <Text
                  size="sm"
                  fw={isActive ? 700 : isDone ? 500 : 400}
                  c={isActive ? undefined : isDone ? undefined : 'dimmed'}
                >
                  {s.label}
                </Text>
                <Text size="xs" c="dimmed">
                  {s.description}
                </Text>
              </Box>
            </Group>
          );
        })}
      </Stack>
    </Paper>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function ApplyPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { booking } = useCurrentBooking();

  const [step, setStep] = useState(0);
  const [semesters, setSemesters] = useState<PortalSemester[]>([]);
  const [isLoadingSemesters, setIsLoadingSemesters] = useState(true);
  const [selectedSemester, setSelectedSemester] = useState<PortalSemester | null>(null);
  const [selectedBed, setSelectedBed] = useState<AvailableBed | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    portalSemesters
      .getBookable()
      .then((data) => {
        setSemesters(data);
        if (data.length === 1) setSelectedSemester(data[0]);
      })
      .catch(() => {})
      .finally(() => setIsLoadingSemesters(false));
  }, []);

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
      const msg = err?.response?.data?.message ?? t('portal.submit_error');
      setSubmitError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canAdvance =
    (step === 0 && selectedSemester !== null) || (step === 1 && selectedBed !== null);

  const stepContent = isLoadingSemesters ? (
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
        setSelectedBed(null);
      }}
    />
  ) : step === 1 && selectedSemester ? (
    <BedStep semesterId={selectedSemester.id} selected={selectedBed} onSelect={setSelectedBed} />
  ) : step === 2 && selectedSemester && selectedBed ? (
    <ReviewStep semester={selectedSemester} bed={selectedBed} />
  ) : null;

  const navButtons = (
    <Group justify="space-between">
      <Button
        variant="subtle"
        leftSection={<IconArrowLeft size={16} />}
        onClick={step === 0 ? () => navigate('/dashboard') : handleBack}
        disabled={isSubmitting}
      >
        {step === 0 ? t('cancel') : t('back')}
      </Button>
      {step < 2 ? (
        <Button
          rightSection={<IconArrowRight size={16} />}
          onClick={handleNext}
          disabled={!canAdvance}
        >
          {t('next')}
        </Button>
      ) : (
        <Button
          leftSection={isSubmitting ? <Loader size={14} color="white" /> : <IconCheck size={16} />}
          onClick={handleSubmit}
          disabled={isSubmitting || hasActiveBooking}
          color="green"
        >
          {isSubmitting ? t('portal.submitting') : t('portal.submit_application')}
        </Button>
      )}
    </Group>
  );

  return (
    <Stack gap="lg">
      <Box>
        <Title order={3}>{t('portal.apply_title')}</Title>
        <Text size="sm" c="dimmed">
          {t('portal.apply_subtitle')}
        </Text>
      </Box>

      {hasActiveBooking && (
        <Alert icon={<IconInfoCircle size={16} />} color="orange" radius="md">
          {t('portal.already_has_booking_part1')}{' '}
          <Text
            component="span"
            size="sm"
            c="blue"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate('/booking')}
          >
            {t('portal.nav_my_room')}
          </Text>{' '}
          {t('portal.already_has_booking_part2')}
        </Alert>
      )}

      {/* ── Desktop layout: step sidebar + content panel ── */}
      <Box visibleFrom="sm">
        <Group align="flex-start" gap="lg" wrap="nowrap">
          {/* Left: step list */}
          <Box style={{ width: 220, flexShrink: 0 }}>
            <DesktopStepsSidebar activeStep={step} />
          </Box>

          {/* Right: active step content */}
          <Box style={{ flex: 1, minWidth: 0 }}>
            <Stack gap="md">
              <Card withBorder radius="md" p="lg" style={{ minHeight: 320 }}>
                {stepContent}
              </Card>

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

              {navButtons}
            </Stack>
          </Box>
        </Group>
      </Box>

      {/* ── Mobile layout: horizontal stepper + content card ── */}
      <Box hiddenFrom="sm">
        <Stack gap="md">
          <Stepper active={step} size="sm" radius="md">
            <Stepper.Step
              label={t('portal.step_semester_label')}
              description={t('portal.step_semester_desc')}
            />
            <Stepper.Step
              label={t('portal.step_bed_label')}
              description={t('portal.step_bed_desc')}
            />
            <Stepper.Step
              label={t('portal.step_confirm_label')}
              description={t('portal.step_confirm_desc')}
            />
          </Stepper>

          <Card withBorder radius="md" p="md">
            {stepContent}
          </Card>

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

          {navButtons}
        </Stack>
      </Box>
    </Stack>
  );
}

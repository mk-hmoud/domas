import { Box, Group, Stack, Text, ThemeIcon } from '@domas/ui';
import { IconCheck, IconClockHour4, IconDoor, IconFileText, IconX } from '@tabler/icons-react';
import { BookingOpsStatus } from '@domas/ts-types';
import { useTranslation } from 'react-i18next';

type StepStatus = 'done' | 'active' | 'pending' | 'error';

interface Step {
  label: string;
  description: string;
  status: StepStatus;
}

function stepColor(status: StepStatus): string {
  if (status === 'done') return 'green';
  if (status === 'error') return 'red';
  if (status === 'active') return 'blue';
  return 'gray';
}

function StepItem({ step, isLast }: { step: Step; isLast: boolean }) {
  const color = stepColor(step.status);
  const isPending = step.status === 'pending';
  const isDone = step.status === 'done';
  const isActive = step.status === 'active';
  const isError = step.status === 'error';

  const connectorColor = isDone
    ? 'linear-gradient(180deg, var(--mantine-color-green-5), var(--mantine-color-green-4))'
    : isActive
      ? 'linear-gradient(180deg, var(--mantine-color-blue-4), var(--mantine-color-gray-3))'
      : 'var(--mantine-color-gray-3)';

  return (
    <Box style={{ position: 'relative' }}>
      <Group gap="sm" align="flex-start" wrap="nowrap">
        {/* Circle + connector */}
        <Box
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <ThemeIcon
            size={32}
            radius="xl"
            variant={isPending ? 'light' : isDone ? 'gradient' : isError ? 'filled' : 'gradient'}
            gradient={
              isDone
                ? { from: 'green', to: 'teal' }
                : isActive
                  ? { from: 'blue', to: 'cyan' }
                  : undefined
            }
            color={isPending ? 'gray' : color}
            style={{
              boxShadow: isActive
                ? '0 4px 12px rgba(34,139,230,0.35)'
                : isDone
                  ? '0 2px 8px rgba(64,192,87,0.25)'
                  : undefined,
              transition: 'all 0.2s ease',
            }}
          >
            {isDone ? (
              <IconCheck size={15} />
            ) : isError ? (
              <IconX size={15} />
            ) : isActive ? (
              <IconClockHour4 size={15} />
            ) : null}
          </ThemeIcon>

          {!isLast && (
            <Box
              style={{
                width: 2,
                flex: 1,
                minHeight: 28,
                background: connectorColor,
                margin: '4px 0',
                borderRadius: 2,
                transition: 'background 0.3s ease',
              }}
            />
          )}
        </Box>

        {/* Text */}
        <Stack gap={2} pb={isLast ? 0 : 'sm'} style={{ flex: 1, paddingTop: 4 }}>
          <Text
            size="sm"
            fw={isActive ? 700 : isDone ? 600 : 400}
            c={isPending ? 'dimmed' : isError ? 'red' : undefined}
            lh={1.3}
          >
            {step.label}
          </Text>
          <Text size="xs" c="dimmed" lh={1.3}>
            {step.description}
          </Text>

          {isActive && (
            <Box mt={4}>
              <Box
                style={{
                  height: 3,
                  background:
                    'linear-gradient(90deg, var(--mantine-color-blue-5), var(--mantine-color-cyan-5))',
                  borderRadius: 2,
                  width: '50%',
                }}
              />
            </Box>
          )}
        </Stack>
      </Group>
    </Box>
  );
}

interface BookingStatusStepperProps {
  status: BookingOpsStatus;
}

export function BookingStatusStepper({ status }: BookingStatusStepperProps) {
  const { t } = useTranslation();

  const order: BookingOpsStatus[] = [
    BookingOpsStatus.PENDING_ACCOUNTING,
    BookingOpsStatus.READY_FOR_CHECKIN,
    BookingOpsStatus.ACTIVE,
  ];

  const idx = order.indexOf(
    status === BookingOpsStatus.CONFIRMED ? BookingOpsStatus.READY_FOR_CHECKIN : status,
  );

  const steps: Step[] = [
    {
      label: t('portal.stepper_submitted'),
      description: t('portal.stepper_submitted_desc'),
      status: 'done',
    },
    {
      label: t('portal.stepper_under_review'),
      description: t('portal.stepper_under_review_desc'),
      status:
        status === BookingOpsStatus.REJECTED
          ? 'error'
          : idx === 0
            ? 'active'
            : idx > 0
              ? 'done'
              : 'pending',
    },
    {
      label: t('portal.stepper_approved'),
      description: t('portal.stepper_approved_desc'),
      status:
        status === BookingOpsStatus.REJECTED
          ? 'pending'
          : idx === 1
            ? 'active'
            : idx > 1
              ? 'done'
              : 'pending',
    },
    {
      label: t('portal.stepper_checked_in'),
      description: t('portal.stepper_checked_in_desc'),
      status:
        status === BookingOpsStatus.REJECTED
          ? 'pending'
          : status === BookingOpsStatus.ACTIVE
            ? 'active'
            : status === BookingOpsStatus.COMPLETED || status === BookingOpsStatus.TRANSFERRED
              ? 'done'
              : 'pending',
    },
  ];

  return (
    <Stack gap={0}>
      {steps.map((step, i) => (
        <StepItem key={step.label} step={step} isLast={i === steps.length - 1} />
      ))}
    </Stack>
  );
}

export function BookingStatusBadgeIcon({ status }: { status: BookingOpsStatus }) {
  if (status === BookingOpsStatus.ACTIVE) return <IconDoor size={16} />;
  if (status === BookingOpsStatus.REJECTED) return <IconX size={16} />;
  if (status === BookingOpsStatus.READY_FOR_CHECKIN || status === BookingOpsStatus.CONFIRMED)
    return <IconFileText size={16} />;
  return <IconClockHour4 size={16} />;
}

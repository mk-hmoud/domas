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

function stepIcon(status: StepStatus) {
  if (status === 'done') return <IconCheck size={14} />;
  if (status === 'error') return <IconX size={14} />;
  if (status === 'active') return <IconClockHour4 size={14} />;
  return null;
}

function stepColor(status: StepStatus): string {
  if (status === 'done') return 'green';
  if (status === 'error') return 'red';
  if (status === 'active') return 'blue';
  return 'gray';
}

function StepItem({ step, isLast }: { step: Step; isLast: boolean }) {
  const color = stepColor(step.status);
  const icon = stepIcon(step.status);
  const isPending = step.status === 'pending';

  return (
    <Box style={{ position: 'relative' }}>
      <Group gap="sm" align="flex-start">
        {/* Circle + connector line */}
        <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <ThemeIcon
            size={28}
            radius="xl"
            color={isPending ? 'gray' : color}
            variant={isPending ? 'outline' : 'filled'}
          >
            {icon}
          </ThemeIcon>
          {!isLast && (
            <Box
              style={{
                width: 2,
                flex: 1,
                minHeight: 24,
                background: `var(--mantine-color-${isPending ? 'gray' : color}-${isPending ? '3' : '4'})`,
              }}
            />
          )}
        </Box>

        {/* Label + description */}
        <Stack gap={2} pb={isLast ? 0 : 'sm'}>
          <Text
            size="sm"
            fw={step.status === 'active' ? 600 : 500}
            c={isPending ? 'dimmed' : undefined}
          >
            {step.label}
          </Text>
          <Text size="xs" c="dimmed">
            {step.description}
          </Text>
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

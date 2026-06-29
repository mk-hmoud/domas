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

function StepItem({ step, isLast }: { step: Step; isLast: boolean }) {
  const isDone = step.status === 'done';
  const isActive = step.status === 'active';
  const isError = step.status === 'error';
  const isPending = step.status === 'pending';

  const iconColor = isDone ? 'blue' : isActive ? 'blue' : isError ? 'red' : 'gray';
  const iconVariant = isPending ? 'outline' : 'filled';

  const connectorColor =
    isDone || isActive ? 'var(--mantine-color-blue-5)' : 'var(--mantine-color-gray-3)';

  return (
    <Box>
      <Group gap="sm" align="flex-start" wrap="nowrap">
        {/* Icon + connector */}
        <Box
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}
        >
          <ThemeIcon size={28} radius="xl" variant={iconVariant} color={iconColor}>
            {isDone ? (
              <IconCheck size={13} />
            ) : isError ? (
              <IconX size={13} />
            ) : isActive ? (
              <IconClockHour4 size={13} />
            ) : null}
          </ThemeIcon>

          {!isLast && (
            <Box
              style={{
                width: 1,
                flex: 1,
                minHeight: 24,
                background: connectorColor,
                margin: '3px 0',
              }}
            />
          )}
        </Box>

        {/* Text */}
        <Stack gap={1} pb={isLast ? 0 : 'sm'} style={{ flex: 1, paddingTop: 3 }}>
          <Text
            size="sm"
            fw={isActive ? 600 : isDone ? 500 : 400}
            c={isPending ? 'dimmed' : isError ? 'red' : undefined}
            lh={1.3}
          >
            {step.label}
          </Text>
          <Text size="xs" c="dimmed" lh={1.4}>
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

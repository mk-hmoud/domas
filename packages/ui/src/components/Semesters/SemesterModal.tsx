import { useEffect } from "react";
import {
  Modal,
  Button,
  Group,
  Select,
  NumberInput,
  SimpleGrid,
  Divider,
  Alert,
  Stack,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { useTranslation } from "react-i18next";
import {
  CreateSemesterDto,
  Semester,
  SemesterType,
  SemesterStatus,
} from "@domas/ts-types";
import { IconInfoCircle } from "@tabler/icons-react";

interface SemesterModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (values: CreateSemesterDto) => Promise<void>;
  initialValues?: Semester | null;
  lastSemester?: Semester | null; // For smart pre-filling
  loading?: boolean;
}

export function SemesterModal({
  opened,
  onClose,
  onSubmit,
  initialValues,
  lastSemester,
  loading = false,
}: SemesterModalProps) {
  const { t } = useTranslation();

  const form = useForm<any>({
    initialValues: {
      type: SemesterType.FALL,
      academicYear: "",
      startDate: null,
      endDate: null,
      bookingStartDate: null,
      bookingEndDate: null,
      depositAmountTry: 0,
      depositAmountForeign: 0,
      foreignCurrencyCode: "USD",
      status: SemesterStatus.PLANNED,
      maxRoomChanges: null as number | null,
    },
    validate: {
      academicYear: (val) => (val ? null : t("field_required")),
      startDate: (val) => (val ? null : t("field_required")),
      endDate: (val) => (val ? null : t("field_required")),
      bookingStartDate: (val) => (val ? null : t("field_required")),
      bookingEndDate: (val) => (val ? null : t("field_required")),
    },
  });

  // Generate Academic Year Options (Current Year +/- 2)
  const currentYear = new Date().getFullYear();
  const academicYearOptions = Array.from({ length: 5 }, (_, i) => {
    const startYear = currentYear - 2 + i;
    return `${startYear}-${startYear + 1}`;
  });

  useEffect(() => {
    if (opened) {
      if (initialValues) {
        form.setValues({
          type: initialValues.type,
          academicYear: initialValues.academicYear,
          startDate: initialValues.startDate
            ? new Date(initialValues.startDate)
            : null,
          endDate: initialValues.endDate
            ? new Date(initialValues.endDate)
            : null,
          bookingStartDate: initialValues.bookingStartDate
            ? new Date(initialValues.bookingStartDate)
            : null,
          bookingEndDate: initialValues.bookingEndDate
            ? new Date(initialValues.bookingEndDate)
            : null,
          depositAmountTry: initialValues.depositAmountTry,
          depositAmountForeign: initialValues.depositAmountForeign,
          foreignCurrencyCode: initialValues.foreignCurrencyCode,
          status: initialValues.status,
          maxRoomChanges: initialValues.maxRoomChanges ?? null,
        });
      } else if (lastSemester) {
        // Smart Pre-fill Logic
        let nextType = SemesterType.FALL;
        let nextYear = lastSemester.academicYear;
        let nextStartDate: Date | null = null;

        if (lastSemester.type === SemesterType.FALL) {
          nextType = SemesterType.SPRING;
        } else if (lastSemester.type === SemesterType.SPRING) {
          nextType = SemesterType.SUMMER;
        } else if (lastSemester.type === SemesterType.SUMMER) {
          nextType = SemesterType.FALL;
          // Increment Academic Year if moving from Summer -> Fall
          const [start, end] = lastSemester.academicYear.split("-").map(Number);
          if (!isNaN(start) && !isNaN(end)) {
            nextYear = `${start + 1}-${end + 1}`;
          }
        }

        if (lastSemester.endDate) {
          const lastEnd = new Date(lastSemester.endDate);
          nextStartDate = new Date(lastEnd);
          nextStartDate.setDate(lastEnd.getDate() + 1);
        }

        form.setValues({
          type: nextType,
          academicYear: nextYear,
          startDate: nextStartDate,
          endDate: null,
          bookingStartDate: null,
          bookingEndDate: null,
          depositAmountTry: lastSemester.depositAmountTry,
          depositAmountForeign: lastSemester.depositAmountForeign,
          foreignCurrencyCode: lastSemester.foreignCurrencyCode,
          status: SemesterStatus.PLANNED,
          maxRoomChanges: null,
        });
      } else {
        form.reset();
        // Set default academic year if resetting
        const defaultYear = `${currentYear}-${currentYear + 1}`;
        form.setFieldValue("academicYear", defaultYear);
      }
    }
  }, [opened, initialValues, lastSemester]);
  const handleSubmit = async (values: any) => {
    const toIso = (date: any) => {
      if (!date) return undefined;
      if (date instanceof Date) return date.toISOString();
      return date;
    };

    const payload: CreateSemesterDto = {
      ...values,
      depositAmountTry: Number(values.depositAmountTry),
      depositAmountForeign: Number(values.depositAmountForeign),
      startDate: toIso(values.startDate),
      endDate: toIso(values.endDate),
      bookingStartDate: toIso(values.bookingStartDate),
      bookingEndDate: toIso(values.bookingEndDate),
      maxRoomChanges:
        values.maxRoomChanges != null && values.maxRoomChanges !== ""
          ? Number(values.maxRoomChanges)
          : null,
    };
    await onSubmit(payload);
    onClose();
  };
  const initialStatus = initialValues?.status;
  const isIdentityLocked =
    initialStatus === SemesterStatus.OPEN ||
    initialStatus === SemesterStatus.ACTIVE;
  const isFinancialLocked =
    initialStatus === SemesterStatus.ACTIVE ||
    initialStatus === SemesterStatus.CLOSED ||
    initialStatus === SemesterStatus.ARCHIVED;
  const isInitiallyActive = initialStatus === SemesterStatus.ACTIVE;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={initialValues ? t("edit_semester") : t("create_semester")}
      size="lg"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          {isInitiallyActive && initialValues && (
            <Alert
              icon={<IconInfoCircle size={16} />}
              title={t("semester.active_warning_title", {
                defaultValue: "Active Semester",
              })}
              color="blue"
              variant="light"
            >
              {t("semester.active_warning_text", {
                defaultValue:
                  "This semester is currently active. Some core identity and financial fields are locked to maintain data integrity.",
              })}
            </Alert>
          )}

          <SimpleGrid cols={2}>
            <Select
              label={t("semester.type", { defaultValue: "Type" })}
              data={[
                { value: SemesterType.FALL, label: t("semester.types.fall") },
                {
                  value: SemesterType.SPRING,
                  label: t("semester.types.spring"),
                },
                {
                  value: SemesterType.SUMMER,
                  label: t("semester.types.summer"),
                },
              ]}
              required
              disabled={isIdentityLocked}
              {...form.getInputProps("type")}
            />
            <Select
              label={t("semester.academic_year", {
                defaultValue: "Academic Year",
              })}
              placeholder="e.g. 2023-2024"
              data={academicYearOptions}
              required
              searchable
              disabled={isIdentityLocked}
              {...form.getInputProps("academicYear")}
            />
          </SimpleGrid>

          <Divider
            label={t("semester.duration", { defaultValue: "Duration" })}
            labelPosition="center"
          />

          <SimpleGrid cols={2}>
            <DatePickerInput
              label={t("start_date")}
              required
              valueFormat="DD/MM/YYYY"
              maxDate={
                isInitiallyActive && initialValues
                  ? new Date(initialValues.startDate)
                  : undefined
              }
              disabled={isInitiallyActive}
              {...form.getInputProps("startDate")}
            />
            <DatePickerInput
              label={t("end_date")}
              required
              valueFormat="DD/MM/YYYY"
              minDate={
                isInitiallyActive && initialValues
                  ? new Date(initialValues.endDate)
                  : undefined
              }
              {...form.getInputProps("endDate")}
            />
          </SimpleGrid>

          <SimpleGrid cols={2}>
            <DatePickerInput
              label={t("semester.booking_start", {
                defaultValue: "Booking Start",
              })}
              required
              valueFormat="DD/MM/YYYY"
              {...form.getInputProps("bookingStartDate")}
            />
            <DatePickerInput
              label={t("semester.booking_end", { defaultValue: "Booking End" })}
              required
              valueFormat="DD/MM/YYYY"
              {...form.getInputProps("bookingEndDate")}
            />
          </SimpleGrid>

          <Divider
            label={t("semester.financials", { defaultValue: "Financials" })}
            labelPosition="center"
          />

          <SimpleGrid cols={3}>
            <NumberInput
              label={t("semester.deposit_try", {
                defaultValue: "Deposit (TRY)",
              })}
              min={0}
              disabled={isFinancialLocked}
              {...form.getInputProps("depositAmountTry")}
            />
            <NumberInput
              label={t("semester.deposit_foreign", {
                defaultValue: "Deposit (Foreign)",
              })}
              min={0}
              disabled={isFinancialLocked}
              {...form.getInputProps("depositAmountForeign")}
            />
            <Select
              label={t("semester.currency", { defaultValue: "Currency" })}
              data={["USD", "EUR", "GBP"]}
              disabled={isFinancialLocked}
              {...form.getInputProps("foreignCurrencyCode")}
            />
          </SimpleGrid>

          <NumberInput
            label={t("semester.max_room_changes", {
              defaultValue: "Max Room Changes",
            })}
            description={t("semester.max_room_changes_hint", {
              defaultValue: "Leave empty for unlimited changes",
            })}
            placeholder={t("unlimited", { defaultValue: "Unlimited" })}
            min={0}
            value={form.values.maxRoomChanges ?? ""}
            onChange={(v) =>
              form.setFieldValue(
                "maxRoomChanges",
                v === "" ? null : (v as number),
              )
            }
          />

          <Select
            label={t("status")}
            data={[
              {
                value: SemesterStatus.PLANNED,
                label: t("semester.statuses.planned"),
              },
              {
                value: SemesterStatus.OPEN,
                label: t("semester.statuses.open"),
              },
              {
                value: SemesterStatus.ACTIVE,
                label: t("semester.statuses.active"),
              },
              {
                value: SemesterStatus.CLOSED,
                label: t("semester.statuses.closed"),
              },
              {
                value: SemesterStatus.ARCHIVED,
                label: t("semester.statuses.archived"),
              },
            ]}
            required
            {...form.getInputProps("status")}
          />

          <Group justify="flex-end" mt="xl">
            <Button variant="default" onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button type="submit" loading={loading}>
              {initialValues ? t("save") : t("create")}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

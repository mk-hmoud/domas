import {
  Modal,
  Select,
  Button,
  Stack,
  Group,
  Alert,
  Text,
  Box,
  Switch,
  SimpleGrid,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useTranslation } from "react-i18next";
import { TransferBookingDto, Semester } from "@domas/ts-types";
import {
  IconInfoCircle,
  IconCalendarEvent,
  IconArrowsLeftRight,
} from "@tabler/icons-react";
import { useState, useMemo, useEffect } from "react";
import { DatePickerInput } from "@mantine/dates";
import dayjs from "dayjs";

interface TransferSemesterModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (values: TransferBookingDto) => Promise<void>;
  semesters: Semester[];
  studentNames?: string[];
  loading?: boolean;
}

export function TransferSemesterModal({
  opened,
  onClose,
  onSubmit,
  semesters,
  studentNames = [],
  loading = false,
}: TransferSemesterModalProps) {
  const { t } = useTranslation();
  const [showDateAdjustments, setShowDateAdjustments] = useState(false);

  const form = useForm<any>({
    initialValues: {
      targetSemesterId: 0,
      startDate: null,
      endDate: null,
    },
    validate: {
      targetSemesterId: (val) => (val > 0 ? null : t("field_required")),
      startDate: (val) =>
        showDateAdjustments && !val ? t("field_required") : null,
      endDate: (val) =>
        showDateAdjustments && !val ? t("field_required") : null,
    },
  });

  const selectedSemester = useMemo(
    () => semesters.find((s) => s.id === form.values.targetSemesterId),
    [semesters, form.values.targetSemesterId],
  );

  useEffect(() => {
    if (opened) {
      form.reset();
      setShowDateAdjustments(false);
    }
  }, [opened]);

  // When "Adjustment" is toggled on, pre-fill with semester dates
  useEffect(() => {
    if (showDateAdjustments && selectedSemester) {
      form.setFieldValue("startDate", new Date(selectedSemester.startDate));
      form.setFieldValue("endDate", new Date(selectedSemester.endDate));
    }
  }, [showDateAdjustments, selectedSemester]);

  const handleSubmit = async (values: any) => {
    const toIso = (date: any) => {
      if (!date) return undefined;
      if (date instanceof Date) return date.toISOString();
      return new Date(date).toISOString();
    };

    const payload: TransferBookingDto = {
      targetSemesterId: Number(values.targetSemesterId),
    };

    if (showDateAdjustments) {
      payload.startDate = toIso(values.startDate);
      payload.endDate = toIso(values.endDate);
    }

    await onSubmit(payload);
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={t("transfer_to_semester", {
        defaultValue: "Transfer to Next Semester",
      })}
      size="md"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Alert color="blue" icon={<IconArrowsLeftRight size={16} />}>
            <Text size="sm" fw={500} mb={5}>
              {t("transfer_summary", {
                count: studentNames.length,
                defaultValue: `Transferring ${studentNames.length} student(s)`,
              })}
            </Text>
            <Text size="xs">
              {t("transfer_info_text_bulk", {
                defaultValue:
                  "Selected bookings will be recreated in the target semester. Existing inventory snapshots will be cloned to the new period.",
              })}
            </Text>
          </Alert>

          <Select
            label={t("target_semester", { defaultValue: "Target Semester" })}
            placeholder={t("pick_one")}
            data={semesters.map((s) => ({
              value: s.id.toString(),
              label: `${s.displayName} (${dayjs(s.startDate).format("DD/MM/YY")} - ${dayjs(s.endDate).format("DD/MM/YY")})`,
            }))}
            required
            searchable
            {...form.getInputProps("targetSemesterId")}
            onChange={(val) =>
              form.setFieldValue("targetSemesterId", Number(val))
            }
            value={
              form.values.targetSemesterId === 0
                ? null
                : form.values.targetSemesterId.toString()
            }
          />

          {selectedSemester && (
            <Alert
              icon={<IconInfoCircle size={16} />}
              color="gray"
              variant="light"
            >
              <Box>
                <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                  {t("standard_period")}:
                </Text>
                <Text size="sm">
                  {dayjs(selectedSemester.startDate).format("DD MMMM YYYY")} —{" "}
                  {dayjs(selectedSemester.endDate).format("DD MMMM YYYY")}
                </Text>
              </Box>
            </Alert>
          )}

          <Box>
            <Group justify="space-between" mb="xs">
              <Text size="sm" fw={500}>
                {t("custom_transfer_dates", { defaultValue: "Custom Dates?" })}
              </Text>
              <Switch
                checked={showDateAdjustments}
                onChange={(event) =>
                  setShowDateAdjustments(event.currentTarget.checked)
                }
                size="sm"
              />
            </Group>

            {showDateAdjustments && (
              <SimpleGrid cols={2} mt="xs">
                <DatePickerInput
                  label={t("start_date")}
                  required
                  leftSection={<IconCalendarEvent size={16} />}
                  valueFormat="DD/MM/YYYY"
                  {...form.getInputProps("startDate")}
                />
                <DatePickerInput
                  label={t("end_date")}
                  required
                  leftSection={<IconCalendarEvent size={16} />}
                  valueFormat="DD/MM/YYYY"
                  {...form.getInputProps("endDate")}
                />
              </SimpleGrid>
            )}
          </Box>

          <Group justify="flex-end" mt="xl">
            <Button variant="default" onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button type="submit" loading={loading} color="blue">
              {t("transfer_now", { defaultValue: "Transfer Now" })}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

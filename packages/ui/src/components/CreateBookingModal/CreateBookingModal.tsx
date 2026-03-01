import { useState, useEffect, useMemo } from "react";
import {
  Button,
  Modal,
  Select,
  Group,
  SimpleGrid,
  ActionIcon,
  Divider,
  Switch,
  Alert,
  Text,
  Box,
  Stack,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { useTranslation } from "react-i18next";
import { CreateBookingDto, CreateStudentDto, Semester } from "@domas/ts-types";
import {
  IconPlus,
  IconCalendarEvent,
  IconInfoCircle,
} from "@tabler/icons-react";
import { StudentModal } from "../Students";
import { HierarchicalBedSelector } from "../Locations";
import dayjs from "dayjs";

interface CreateBookingModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (values: CreateBookingDto) => Promise<void>;
  onCreateStudent: (values: CreateStudentDto) => Promise<void>;
  students: { value: string; label: string }[];
  semesters: Semester[];
  initialStudentId?: string | null;
  initialBedId?: number | null;
  isEdit?: boolean;
}

export function CreateBookingModal({
  opened,
  onClose,
  onSubmit,
  onCreateStudent,
  students,
  semesters,
  initialStudentId,
  initialBedId,
  isEdit,
}: CreateBookingModalProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [studentModalOpened, setStudentModalOpened] = useState(false);
  const [showDateAdjustments, setShowDateAdjustments] = useState(false);

  const form = useForm<any>({
    initialValues: {
      studentId: initialStudentId || "",
      bedId: initialBedId || 0,
      semesterId: 0,
      startDate: null,
      endDate: null,
    },
    validate: {
      studentId: (val) => (val ? null : t("field_required")),
      bedId: (val) => (Number(val) > 0 ? null : t("field_required")),
      semesterId: (val) => (Number(val) > 0 ? null : t("field_required")),
      startDate: (val) =>
        showDateAdjustments && !val ? t("field_required") : null,
      endDate: (val) =>
        showDateAdjustments && !val ? t("field_required") : null,
    },
  });

  const selectedSemester = useMemo(
    () => semesters.find((s) => s.id === form.values.semesterId),
    [semesters, form.values.semesterId],
  );

  const isOutOfBounds = useMemo(() => {
    if (
      !selectedSemester ||
      !showDateAdjustments ||
      !form.values.startDate ||
      !form.values.endDate
    )
      return false;
    const start = dayjs(form.values.startDate);
    const end = dayjs(form.values.endDate);
    const sStart = dayjs(selectedSemester.startDate);
    const sEnd = dayjs(selectedSemester.endDate);

    return start.isBefore(sStart, "day") || end.isAfter(sEnd, "day");
  }, [
    selectedSemester,
    showDateAdjustments,
    form.values.startDate,
    form.values.endDate,
  ]);

  // Sync initial values when they change
  useEffect(() => {
    if (opened) {
      form.setValues({
        studentId: initialStudentId || "",
        bedId: initialBedId || 0,
        semesterId: isEdit && initialStudentId ? form.values.semesterId : 0,
        startDate: null,
        endDate: null,
      });
      setShowDateAdjustments(false);
    }
  }, [opened, initialStudentId, initialBedId, isEdit]);

  // When "Adjustment" is toggled on, pre-fill with semester dates
  useEffect(() => {
    if (showDateAdjustments && selectedSemester) {
      form.setFieldValue("startDate", new Date(selectedSemester.startDate));
      form.setFieldValue("endDate", new Date(selectedSemester.endDate));
    }
  }, [showDateAdjustments, selectedSemester]);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const toIso = (date: any) => {
        if (!date) return undefined;
        if (date instanceof Date) return date.toISOString();
        return new Date(date).toISOString();
      };

      const payload: CreateBookingDto = {
        studentId: values.studentId,
        bedId: Number(values.bedId),
        semesterId: Number(values.semesterId),
      };

      // Only send dates if they were customized
      if (showDateAdjustments) {
        payload.startDate = toIso(values.startDate);
        payload.endDate = toIso(values.endDate);
      }

      await onSubmit(payload);
      form.reset();
      onClose();
    } catch (error) {
      console.error("Booking creation error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStudent = async (values: CreateStudentDto) => {
    await onCreateStudent(values);
    setStudentModalOpened(false);
  };

  return (
    <>
      <Modal
        opened={opened}
        onClose={onClose}
        title={isEdit ? t("edit_booking") : t("create_new_booking")}
        size="lg"
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Group align="flex-end" mb="sm">
            <Select
              label={t("student")}
              placeholder={t("select_student")}
              data={students}
              searchable
              required
              disabled={isEdit} // Can't change student during edit
              style={{ flex: 1 }}
              {...form.getInputProps("studentId")}
            />
            {!isEdit && (
              <ActionIcon
                variant="filled"
                color="blue"
                size="lg"
                mb={1}
                onClick={() => setStudentModalOpened(true)}
                title={t("create_student")}
              >
                <IconPlus size={18} />
              </ActionIcon>
            )}
          </Group>

          <Select
            label={t("semester_label")}
            placeholder={t("select_semester")}
            data={semesters.map((s) => ({
              value: s.id.toString(),
              label: `${s.displayName} (${dayjs(s.startDate).format("DD/MM/YY")} - ${dayjs(s.endDate).format("DD/MM/YY")})`,
            }))}
            required
            disabled={isEdit} // Semester shouldn't change easily after creation
            mb="md"
            {...form.getInputProps("semesterId")}
            onChange={(val) => form.setFieldValue("semesterId", Number(val))}
            value={form.values.semesterId?.toString()}
          />

          {selectedSemester && (
            <Alert
              icon={<IconInfoCircle size={16} />}
              color="blue"
              mb="md"
              variant="light"
            >
              <Box>
                <Text size="sm" fw={500}>
                  {t("standard_period")}:
                </Text>
                <Text size="sm">
                  {dayjs(selectedSemester.startDate).format("DD MMMM YYYY")} —{" "}
                  {dayjs(selectedSemester.endDate).format("DD MMMM YYYY")}
                </Text>
              </Box>
            </Alert>
          )}

          <Divider
            label={t("location_selection", "Housing Selection")}
            labelPosition="center"
            my="lg"
          />

          <HierarchicalBedSelector
            studentId={form.values.studentId}
            value={form.values.bedId}
            onChange={(val) => form.setFieldValue("bedId", val)}
            error={form.errors.bedId}
          />

          <Box mt="xl">
            <Group justify="space-between" mb="sm">
              <Text size="sm" fw={500}>
                {t("date_adjustments", "Stay Period Adjustments")}
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
              <Stack gap="xs">
                {isOutOfBounds && (
                  <Alert
                    color="orange"
                    icon={<IconInfoCircle size={16} />}
                    variant="light"
                  >
                    {t(
                      "out_of_bounds_warning",
                      "Note: Custom dates fall outside the standard semester period.",
                    )}
                  </Alert>
                )}
                <SimpleGrid cols={2}>
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
              </Stack>
            )}
          </Box>

          <Group justify="flex-end" mt="xl">
            <Button variant="default" onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button type="submit" loading={loading}>
              {isEdit ? t("save_changes") : t("create_booking")}
            </Button>
          </Group>
        </form>
      </Modal>

      <StudentModal
        opened={studentModalOpened}
        onClose={() => setStudentModalOpened(false)}
        onSubmit={handleCreateStudent}
      />
    </>
  );
}

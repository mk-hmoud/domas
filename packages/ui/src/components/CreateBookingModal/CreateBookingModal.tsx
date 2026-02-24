import { useState, useEffect } from "react";
import {
  Button,
  Modal,
  Select,
  Group,
  SimpleGrid,
  ActionIcon,
  Loader,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { useTranslation } from "react-i18next";
import { CreateBookingDto, CreateStudentDto, Bed } from "@domas/ts-types";
import { IconPlus } from "@tabler/icons-react";
import { StudentModal } from "../Students";
import { beds as bedsApi } from "@domas/api-client";

interface CreateBookingModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (values: CreateBookingDto) => Promise<void>;
  onCreateStudent: (values: CreateStudentDto) => Promise<void>;
  students: { value: string; label: string }[];
  semesters: { value: string; label: string }[];
  locationsMap: Map<number, string>;
}

export function CreateBookingModal({
  opened,
  onClose,
  onSubmit,
  onCreateStudent,
  students,
  semesters,
  locationsMap,
}: CreateBookingModalProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [studentModalOpened, setStudentModalOpened] = useState(false);
  const [eligibleBeds, setEligibleBeds] = useState<Bed[]>([]);
  const [loadingBeds, setLoadingBeds] = useState(false);

  const form = useForm<any>({
    initialValues: {
      studentId: "",
      bedId: 0,
      semesterId: 0,
      startDate: new Date(),
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
    },
    validate: {
      studentId: (val) => (val ? null : t("field_required")),
      bedId: (val) => (Number(val) > 0 ? null : t("field_required")),
      semesterId: (val) => (Number(val) > 0 ? null : t("field_required")),
      startDate: (val) => (val ? null : t("field_required")),
      endDate: (val) => (val ? null : t("field_required")),
    },
  });

  useEffect(() => {
    if (opened) {
      form.reset();
      setEligibleBeds([]);
    }
  }, [opened]);

  useEffect(() => {
    if (form.values.studentId) {
      fetchEligibleBeds(form.values.studentId);
    } else {
      setEligibleBeds([]);
      form.setFieldValue("bedId", 0);
    }
  }, [form.values.studentId]);

  const fetchEligibleBeds = async (studentId: string) => {
    setLoadingBeds(true);
    try {
      const result = await bedsApi.findEligible(studentId);
      setEligibleBeds(result);
      // Reset bed selection if current one is not in new list
      if (
        form.values.bedId &&
        !result.find((b) => b.id === Number(form.values.bedId))
      ) {
        form.setFieldValue("bedId", 0);
      }
    } catch (error) {
      console.error("Failed to fetch eligible beds:", error);
    } finally {
      setLoadingBeds(false);
    }
  };

  const bedOptions = eligibleBeds.map((b) => {
    const roomName = locationsMap.get(b.locationId) || "Unknown Room";
    return {
      value: b.id.toString(),
      label: `${roomName} - ${b.label}`,
    };
  });

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const toIso = (date: any) => {
        if (!date) return null;
        if (date instanceof Date) return date.toISOString();
        return new Date(date).toISOString();
      };

      await onSubmit({
        ...values,
        bedId: Number(values.bedId),
        semesterId: Number(values.semesterId),
        startDate: toIso(values.startDate) as string,
        endDate: toIso(values.endDate) as string,
      });
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
        title={t("create_new_booking")}
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
              style={{ flex: 1 }}
              {...form.getInputProps("studentId")}
            />
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
          </Group>

          <SimpleGrid cols={2} mt="md">
            <Select
              label={t("semester_label")}
              placeholder={t("select_semester")}
              data={semesters}
              required
              {...form.getInputProps("semesterId")}
              onChange={(val) => form.setFieldValue("semesterId", Number(val))}
              value={form.values.semesterId?.toString()}
            />
            <Select
              label={t("bed")}
              placeholder={
                eligibleBeds.length > 0
                  ? t("select_bed")
                  : t("select_student_first")
              }
              data={bedOptions}
              searchable
              required
              rightSection={loadingBeds ? <Loader size="xs" /> : null}
              disabled={!form.values.studentId || loadingBeds}
              {...form.getInputProps("bedId")}
              onChange={(val) => form.setFieldValue("bedId", Number(val))}
              value={
                form.values.bedId === 0 ? "" : form.values.bedId?.toString()
              }
            />
          </SimpleGrid>

          <SimpleGrid cols={2} mt="md">
            <DatePickerInput
              label={t("start_date")}
              required
              valueFormat="DD/MM/YYYY"
              {...form.getInputProps("startDate")}
            />
            <DatePickerInput
              label={t("end_date")}
              required
              valueFormat="DD/MM/YYYY"
              {...form.getInputProps("endDate")}
            />
          </SimpleGrid>

          <Group justify="flex-end" mt="xl">
            <Button variant="default" onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button type="submit" loading={loading}>
              {t("create_booking")}
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

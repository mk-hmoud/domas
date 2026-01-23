import { useState } from "react";
import {
  Button,
  Modal,
  Select,
  Group,
  SimpleGrid,
  TextInput,
  ActionIcon,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useTranslation } from "react-i18next";
import { CreateBookingDto, CreateStudentDto } from "@domas/ts-types";
import { IconPlus } from "@tabler/icons-react";
import { StudentModal } from "../Students";

interface CreateBookingModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (values: CreateBookingDto) => Promise<void>;
  onCreateStudent: (values: CreateStudentDto) => Promise<void>;
  students: { value: string; label: string }[];
  beds: { value: string; label: string }[];
  semesters: { value: string; label: string }[];
}

export function CreateBookingModal({
  opened,
  onClose,
  onSubmit,
  onCreateStudent,
  students,
  beds,
  semesters,
}: CreateBookingModalProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [studentModalOpened, setStudentModalOpened] = useState(false);

  const form = useForm<CreateBookingDto>({
    initialValues: {
      studentId: "",
      bedId: 0,
      semesterId: 0,
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
        .toISOString()
        .split("T")[0],
    },
    validate: {
      studentId: (val) => (val ? null : t("field_required")),
      bedId: (val) => (Number(val) > 0 ? null : t("field_required")),
      semesterId: (val) => (Number(val) > 0 ? null : t("field_required")),
    },
  });

  const handleSubmit = async (values: CreateBookingDto) => {
    setLoading(true);
    try {
      await onSubmit({
        ...values,
        bedId: Number(values.bedId),
        semesterId: Number(values.semesterId),
      });
      form.reset();
      onClose();
    } catch (error) {
      // Error handling is up to parent
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
              placeholder={t("select_bed")}
              data={beds}
              searchable
              required
              {...form.getInputProps("bedId")}
              onChange={(val) => form.setFieldValue("bedId", Number(val))}
              value={form.values.bedId?.toString()}
            />
          </SimpleGrid>

          <SimpleGrid cols={2} mt="md">
            <TextInput
              type="date"
              label={t("start_date")}
              required
              {...form.getInputProps("startDate")}
            />
            <TextInput
              type="date"
              label={t("end_date")}
              required
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

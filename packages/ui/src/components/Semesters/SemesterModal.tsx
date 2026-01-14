import { useEffect } from "react";
import { Modal, TextInput, Button, Group, Switch } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useTranslation } from "react-i18next";
import { CreateSemesterDto, Semester } from "@domas/ts-types";

interface SemesterModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (values: CreateSemesterDto) => Promise<void>;
  initialValues?: Semester | null;
  loading?: boolean;
}

export function SemesterModal({
  opened,
  onClose,
  onSubmit,
  initialValues,
  loading = false,
}: SemesterModalProps) {
  const { t } = useTranslation();

  const form = useForm<CreateSemesterDto>({
    initialValues: {
      name: "",
      startDate: "",
      endDate: "",
      isActive: false,
    },
    validate: {
      name: (val) => (val.length < 2 ? t("validation_name_short") : null),
      startDate: (val) => (!val ? t("field_required") : null),
      endDate: (val, values) => {
        if (!val) return t("field_required");
        if (new Date(val) <= new Date(values.startDate)) {
          return t("validation_date_order");
        }
        return null;
      },
    },
  });

  useEffect(() => {
    if (opened) {
      if (initialValues) {
        form.setValues({
          name: initialValues.name,
          startDate: new Date(initialValues.startDate)
            .toISOString()
            .split("T")[0],
          endDate: new Date(initialValues.endDate).toISOString().split("T")[0],
          isActive: initialValues.isActive,
        });
      } else {
        form.reset();
      }
    }
  }, [opened, initialValues]);

  const handleSubmit = async (values: typeof form.values) => {
    // Ensure dates are in ISO format if needed, but YYYY-MM-DD from date input is usually fine for backend or needs conversion
    // Backend CreateSemesterDto expects string (ISO or date).
    await onSubmit(values);
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={initialValues ? t("edit_semester") : t("create_semester")}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <TextInput
          label={t("semester_name")}
          placeholder="e.g. 2024 Spring"
          required
          mb="md"
          {...form.getInputProps("name")}
        />

        <TextInput
          type="date"
          label={t("start_date")}
          required
          mb="md"
          {...form.getInputProps("startDate")}
        />

        <TextInput
          type="date"
          label={t("end_date")}
          required
          mb="md"
          {...form.getInputProps("endDate")}
        />

        <Switch
          label={t("is_active")}
          mb="xl"
          checked={form.values.isActive}
          {...form.getInputProps("isActive", { type: "checkbox" })}
        />

        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button type="submit" loading={loading}>
            {initialValues ? t("save") : t("create")}
          </Button>
        </Group>
      </form>
    </Modal>
  );
}

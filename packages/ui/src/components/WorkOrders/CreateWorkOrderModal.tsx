import {
  Modal,
  Stack,
  TextInput,
  Textarea,
  Select,
  Group,
  Button,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { useMediaQuery } from "@mantine/hooks";
import { useTranslation } from "react-i18next";
import {
  CreateWorkOrderDto,
  WorkOrderPriority,
  AssignableTechnician,
} from "@domas/ts-types";
import { SmartLocationSelector } from "../Locations/SmartLocationSelector";

interface CreateWorkOrderModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (values: CreateWorkOrderDto) => Promise<void>;
  technicians: AssignableTechnician[];
  loading?: boolean;
}

interface FormValues {
  title: string;
  description: string;
  locationId: number;
  priority: WorkOrderPriority;
  assignedTo: string | null;
  dueDate: Date | null;
}

export function CreateWorkOrderModal({
  opened,
  onClose,
  onSubmit,
  technicians,
  loading,
}: CreateWorkOrderModalProps) {
  const { t } = useTranslation();
  const isMobile = useMediaQuery("(max-width: 48em)");

  const form = useForm<FormValues>({
    initialValues: {
      title: "",
      description: "",
      locationId: 0,
      priority: WorkOrderPriority.MEDIUM,
      assignedTo: null,
      dueDate: null,
    },
    validate: {
      title: (val) => (val.trim().length > 0 ? null : t("field_required")),
      locationId: (val) => (val > 0 ? null : t("field_required")),
    },
  });

  const handleSubmit = async (values: FormValues) => {
    await onSubmit({
      title: values.title,
      description: values.description || undefined,
      locationId: values.locationId,
      priority: values.priority,
      assignedTo: values.assignedTo ?? undefined,
      dueDate: values.dueDate ? values.dueDate.toISOString() : undefined,
    });
    form.reset();
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={t("create_work_order")}
      size="lg"
      fullScreen={isMobile}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput
            label={t("title")}
            placeholder={t("title")}
            required
            {...form.getInputProps("title")}
          />

          <Textarea
            label={t("description")}
            minRows={3}
            {...form.getInputProps("description")}
          />

          <SmartLocationSelector
            label={t("location")}
            placeholder={t("pick_one")}
            required
            value={
              form.values.locationId ? form.values.locationId.toString() : null
            }
            onChange={(val) =>
              form.setFieldValue("locationId", val ? parseInt(val) : 0)
            }
            error={form.errors.locationId}
          />

          <Group grow>
            <Select
              label={t("priority")}
              data={Object.values(WorkOrderPriority).map((p) => ({
                value: p,
                label: t(`work_order_priority.${p}`),
              }))}
              {...form.getInputProps("priority")}
            />

            <DatePickerInput
              label={t("due_date")}
              valueFormat="DD/MM/YYYY"
              clearable
              minDate={new Date()}
              {...form.getInputProps("dueDate")}
            />
          </Group>

          <Select
            label={t("assign_technician")}
            placeholder={t("select_technician")}
            data={technicians.map((tech) => ({
              value: tech.id,
              label: `${tech.firstName} ${tech.lastName}`,
            }))}
            searchable
            clearable
            {...form.getInputProps("assignedTo")}
          />

          <Group justify="flex-end" mt="xl">
            <Button variant="default" onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button type="submit" loading={loading}>
              {t("create")}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

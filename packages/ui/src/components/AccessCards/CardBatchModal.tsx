import {
  Modal,
  TextInput,
  NumberInput,
  Button,
  Stack,
  Group,
  Select,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useTranslation } from "react-i18next";
import { CreateCardBatchDto, Location } from "@domas/ts-types";

interface CardBatchModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (values: CreateCardBatchDto) => Promise<void>;
  locations: Location[];
  loading?: boolean;
}

export function CardBatchModal({
  opened,
  onClose,
  onSubmit,
  locations,
  loading,
}: CardBatchModalProps) {
  const { t } = useTranslation();

  const form = useForm<CreateCardBatchDto>({
    initialValues: {
      name: "",
      rangeStart: 1,
      rangeEnd: 100,
      locationId: undefined,
    },
    validate: {
      name: (val) => (val ? null : t("field_required")),
      rangeStart: (val) => (val > 0 ? null : t("invalid_number")),
      rangeEnd: (val, values) =>
        val > values.rangeStart
          ? null
          : t("validation_range_order", "End must be greater than start"),
    },
  });

  const handleSubmit = async (values: CreateCardBatchDto) => {
    await onSubmit(values);
    form.reset();
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={t("create_batch")}
      size="md"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput
            label={t("batch_name")}
            required
            {...form.getInputProps("name")}
          />

          <Select
            label={t("location")}
            placeholder={t("pick_one")}
            data={locations.map((loc) => ({
              value: loc.id.toString(),
              label: loc.name,
            }))}
            searchable
            clearable
            {...form.getInputProps("locationId")}
            onChange={(val) =>
              form.setFieldValue("locationId", val ? parseInt(val) : undefined)
            }
          />

          <Group grow>
            <NumberInput
              label={t("range_start")}
              required
              min={1}
              {...form.getInputProps("rangeStart")}
            />
            <NumberInput
              label={t("range_end")}
              required
              min={1}
              {...form.getInputProps("rangeEnd")}
            />
          </Group>

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

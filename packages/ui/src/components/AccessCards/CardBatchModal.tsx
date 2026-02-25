import {
  Modal,
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
      rangeStart: 1,
      rangeEnd: 100,
      locationId: undefined,
    },
    validate: {
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
          <Select
            label={t("location")}
            placeholder={t("pick_one")}
            data={locations.map((loc) => ({
              value: loc.id.toString(),
              label: loc.name,
            }))}
            searchable
            clearable
            required
            value={
              form.values.locationId ? form.values.locationId.toString() : null
            }
            onChange={(val) =>
              form.setFieldValue("locationId", val ? parseInt(val) : undefined)
            }
            error={form.errors.locationId}
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

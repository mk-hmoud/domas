import { useState, useEffect } from "react";
import { Modal, TextInput, Button, Group, Select } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useTranslation } from "react-i18next";
import { CreateBedDto, BedStatus } from "@domas/ts-types";

interface CreateBedModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (values: CreateBedDto) => Promise<void>;
  locationId: number;
  initialValues?: CreateBedDto | null;
}

export function CreateBedModal({
  opened,
  onClose,
  onSubmit,
  locationId,
  initialValues,
}: CreateBedModalProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const form = useForm<CreateBedDto>({
    initialValues: initialValues || {
      locationId,
      label: "",
      status: BedStatus.AVAILABLE,
    },
    validate: {
      label: (val) => (val ? null : t("field_required")),
    },
  });

  useEffect(() => {
    if (opened) {
      if (initialValues) {
        form.setValues(initialValues);
      } else {
        form.reset();
        form.setFieldValue("locationId", locationId);
      }
    }
  }, [opened, initialValues, locationId]);

  const handleSubmit = async (values: CreateBedDto) => {
    setLoading(true);
    try {
      await onSubmit({
        ...values,
        locationId: values.locationId || locationId,
      });
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={initialValues ? t("edit_bed") : t("create_bed")}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <TextInput
          label={t("bed_label", { defaultValue: "Label" })}
          placeholder="e.g. A, B, 1, 2"
          required
          {...form.getInputProps("label")}
        />

        <Select
          label={t("status")}
          mt="md"
          data={[
            {
              value: BedStatus.AVAILABLE,
              label: t("bed_status.available", { defaultValue: "Available" }),
            },
            {
              value: BedStatus.OCCUPIED,
              label: t("bed_status.occupied", { defaultValue: "Occupied" }),
            },
            {
              value: BedStatus.MAINTENANCE,
              label: t("bed_status.maintenance", {
                defaultValue: "Maintenance",
              }),
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
      </form>
    </Modal>
  );
}

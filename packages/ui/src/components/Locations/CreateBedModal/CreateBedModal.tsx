import { useState, useEffect } from "react";
import {
  Modal,
  TextInput,
  Button,
  Group,
  Select,
  Alert,
  Text,
  Stack,
  Box,
  Switch,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useTranslation } from "react-i18next";
import { CreateBedDto, BedStatus } from "@domas/ts-types";
import { IconInfoCircle } from "@tabler/icons-react";

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

  const isOccupied = initialValues?.status === BedStatus.OCCUPIED;

  const form = useForm<CreateBedDto>({
    initialValues: initialValues || {
      locationId,
      label: "",
      status: BedStatus.AVAILABLE,
      isTrOnly: false,
      isForeignerOnly: false,
      isGuestZone: false,
      isRectorate: false,
    },
    validate: {
      label: (val) => (val ? null : t("field_required")),
    },
  });

  useEffect(() => {
    if (opened) {
      if (initialValues) {
        form.setValues({
          ...initialValues,
          isTrOnly: initialValues.isTrOnly || false,
          isForeignerOnly: initialValues.isForeignerOnly || false,
          isGuestZone: initialValues.isGuestZone || false,
          isRectorate: initialValues.isRectorate || false,
        });
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

  const statusOptions = [
    {
      value: BedStatus.AVAILABLE,
      label: t("bed_status.available", { defaultValue: "Available" }),
    },
    {
      value: BedStatus.MAINTENANCE,
      label: t("bed_status.maintenance", {
        defaultValue: "Maintenance",
      }),
    },
  ];

  // If currently occupied, we show it but it's disabled.
  if (isOccupied) {
    statusOptions.push({
      value: BedStatus.OCCUPIED,
      label: t("bed_status.occupied", { defaultValue: "Occupied" }),
    });
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={initialValues ? t("edit_bed") : t("create_bed")}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput
            label={t("bed_label_field", { defaultValue: "Bed Label" })}
            placeholder="e.g. A, B, 1, 2"
            required
            {...form.getInputProps("label")}
          />

          <Box>
            <Select
              label={t("status")}
              data={statusOptions}
              required
              disabled={isOccupied}
              {...form.getInputProps("status")}
            />
            {isOccupied && (
              <Alert
                icon={<IconInfoCircle size={16} />}
                color="blue"
                mt="xs"
                variant="light"
              >
                <Text size="xs">
                  {t("occupied_status_lock_notice", {
                    defaultValue:
                      "This bed is occupied. Status changes must be performed through check-out or undo processes.",
                  })}
                </Text>
              </Alert>
            )}
          </Box>

          <Group>
            <Switch
              label={t("is_tr_only")}
              {...form.getInputProps("isTrOnly", { type: "checkbox" })}
            />
            <Switch
              label={t("is_foreigner_only")}
              {...form.getInputProps("isForeignerOnly", { type: "checkbox" })}
            />
            <Switch
              label={t("is_guest_zone_label")}
              {...form.getInputProps("isGuestZone", { type: "checkbox" })}
            />
            <Switch
              label={t("is_rectorate", "Rectorate")}
              {...form.getInputProps("isRectorate", { type: "checkbox" })}
            />
          </Group>
        </Stack>

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

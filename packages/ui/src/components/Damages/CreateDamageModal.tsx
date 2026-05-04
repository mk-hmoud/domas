import {
  Modal,
  Stack,
  Textarea,
  NumberInput,
  MultiSelect,
  Select,
  FileInput,
  Pill,
  Button,
  Group,
  Alert,
  Divider,
  Loader,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useTranslation } from "react-i18next";
import {
  CreateDamageReportDto,
  GuestStay,
  Student,
  InventoryAssignment,
} from "@domas/ts-types";
import { IconInfoCircle, IconPhoto } from "@tabler/icons-react";
import { useState, useEffect } from "react";
import { inventory, beds } from "@domas/api-client";
import { SmartLocationSelector } from "../Locations/SmartLocationSelector";

interface CreateDamageModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (values: CreateDamageReportDto, files: File[]) => Promise<void>;
  students: Student[];
  guestStays?: GuestStay[];
  loading?: boolean;
  initialValues?: Partial<CreateDamageReportDto>;
}

export function CreateDamageModal({
  opened,
  onClose,
  onSubmit,
  students,
  guestStays = [],
  loading,
  initialValues,
}: CreateDamageModalProps) {
  const { t, i18n } = useTranslation();
  const isTr = i18n.language === "tr";
  const [assignments, setAssignments] = useState<InventoryAssignment[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [selectedInventoryKey, setSelectedInventoryKey] = useState<
    string | null
  >(null);
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);

  const form = useForm<CreateDamageReportDto>({
    initialValues: {
      locationId: 0,
      catalogId: undefined,
      description: "",
      culpritIds: [],
      culpritGuestStayIds: [],
      manualCostTry: undefined,
      manualCostForeign: undefined,
      manualCurrencyCode: "USD",
    },
    validate: {
      locationId: (val) => (val > 0 ? null : t("field_required")),
      description: (val) =>
        val.length > 5 ? null : t("validation_name_short"),
    },
  });

  // Handle initialValues pre-filling
  useEffect(() => {
    if (opened && initialValues) {
      form.setValues({
        ...form.values,
        ...initialValues,
      });

      // If catalogId is provided, we need to try to find the assignment key
      if (initialValues.catalogId) {
        // If we already have assignments, find the key
        if (assignments.length > 0) {
          const matching = assignments.find(
            (a) => a.item?.id === initialValues.catalogId,
          );
          if (matching) setSelectedInventoryKey(matching.id);
        }
      }
    }
  }, [opened, initialValues, assignments.length]);

  // Fetch inventory assigned to location when location changes
  useEffect(() => {
    if (form.values.locationId > 0) {
      fetchInventory(form.values.locationId);
    } else {
      setAssignments([]);
      form.setFieldValue("catalogId", undefined);
      setSelectedInventoryKey(null);
    }
  }, [form.values.locationId]);

  const fetchInventory = async (locationId: number) => {
    setLoadingInventory(true);
    try {
      // 1. Fetch Room-level inventory
      const roomInventory = await inventory.findByLocation(locationId);

      // 2. Fetch Beds in this room to get their inventory
      const bedsRes = await beds.findAll({ locationId, limit: 100 });

      let allAssignments = [...roomInventory];

      if (bedsRes.data.length > 0) {
        const bedInventories = await Promise.all(
          bedsRes.data.map((b) => inventory.findByBed(b.id)),
        );

        // Flatten and add bed labels to items for clarity
        bedInventories.forEach((bedInv, index) => {
          const bedLabel = bedsRes.data[index].label;
          const itemsWithLabels = bedInv.map((a) => ({
            ...a,
            displayLabel: `${a.item?.nameEn || a.item?.nameTr} (Bed ${bedLabel})`,
          }));
          allAssignments = [...allAssignments, ...(itemsWithLabels as any)];
        });
      }

      setAssignments(allAssignments);
    } catch (error) {
      console.error("Failed to fetch inventory:", error);
    } finally {
      setLoadingInventory(false);
    }
  };

  const handleSubmit = async (values: CreateDamageReportDto) => {
    await onSubmit(values, evidenceFiles);
    form.reset();
    setAssignments([]);
    setSelectedInventoryKey(null);
    setEvidenceFiles([]);
    onClose();
  };

  const inventoryOptions = [
    ...assignments.map((a: any) => ({
      value: a.id, // Use unique assignment UUID
      label: a.displayLabel || (isTr ? a.item?.nameTr : a.item?.nameEn),
    })),
    { value: "manual", label: t("other_manual_cost", "Other (Manual Price)") },
  ];

  const isManual = selectedInventoryKey === "manual";

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={t("report_damage")}
      size="lg"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <SmartLocationSelector
            label={t("location")}
            placeholder={t("pick_one")}
            required
            value={
              form.values.locationId ? form.values.locationId.toString() : null
            }
            onChange={(val) => {
              const id = val ? parseInt(val) : 0;
              form.setFieldValue("locationId", id);
              form.setFieldValue("catalogId", undefined);
              setSelectedInventoryKey(null);
            }}
            error={form.errors.locationId}
          />

          <Select
            label={t("damaged_item")}
            placeholder={loadingInventory ? t("loading") : t("select_item")}
            data={inventoryOptions}
            searchable
            clearable
            nothingFoundMessage={
              form.values.locationId === 0
                ? t("select_location_first")
                : t("no_active_inventory")
            }
            leftSection={loadingInventory ? <Loader size="xs" /> : null}
            disabled={form.values.locationId === 0 || loadingInventory}
            value={selectedInventoryKey}
            onChange={(val) => {
              setSelectedInventoryKey(val);
              if (val && val !== "manual") {
                const assignment = assignments.find((a) => a.id === val);
                form.setFieldValue("catalogId", assignment?.item?.id);
                // Clear manual costs when item is selected
                form.setFieldValue("manualCostTry", undefined);
                form.setFieldValue("manualCostForeign", undefined);
              } else {
                form.setFieldValue("catalogId", undefined);
              }
            }}
          />

          <Textarea
            label={t("damage_description")}
            placeholder={t("describe_damage")}
            required
            minRows={3}
            {...form.getInputProps("description")}
          />

          <FileInput
            label={t("evidence_images", "Evidence Images")}
            placeholder={t("attach_photos", "Attach photos (optional)")}
            leftSection={<IconPhoto size={16} />}
            accept="image/jpeg,image/png,image/gif,image/webp"
            multiple
            value={evidenceFiles}
            onChange={setEvidenceFiles}
            valueComponent={() =>
              evidenceFiles.length > 0 ? (
                <Group gap={4} wrap="wrap">
                  {evidenceFiles.map((f, i) => (
                    <Pill key={i} size="sm">
                      {f.name}
                    </Pill>
                  ))}
                </Group>
              ) : null
            }
          />

          <MultiSelect
            label={t("culprits_students", {
              defaultValue: "Culprits — Students",
            })}
            placeholder={t("pick_one_or_more")}
            data={students.map((s) => ({
              value: s.id,
              label: `${s.firstName} ${s.lastName} (${s.studentNumber})`,
            }))}
            searchable
            clearable
            {...form.getInputProps("culpritIds")}
          />

          {guestStays.length > 0 && (
            <MultiSelect
              label={t("culprits_guests", {
                defaultValue: "Culprits — Guests",
              })}
              placeholder={t("pick_one_or_more")}
              data={guestStays.map((gs) => ({
                value: gs.id,
                label: [
                  `${gs.guest.firstName} ${gs.guest.lastName}`,
                  gs.guest.idNumber ? `#${gs.guest.idNumber}` : null,
                  `${gs.roomName}, ${t("bed_label", { defaultValue: "Bed {{label}}", label: gs.bedLabel })}`,
                  `${new Date(gs.checkInDate).toLocaleDateString()} – ${new Date(gs.checkOutDate).toLocaleDateString()}`,
                ]
                  .filter(Boolean)
                  .join(" · "),
              }))}
              searchable
              clearable
              {...form.getInputProps("culpritGuestStayIds")}
            />
          )}

          <Divider label={t("manual_cost")} labelPosition="center" />

          <Alert icon={<IconInfoCircle size={16} />} color="blue">
            {t("manual_cost_description")}
          </Alert>

          <Group grow>
            <NumberInput
              label={t("price_try")}
              min={0}
              disabled={!isManual}
              required={isManual}
              {...form.getInputProps("manualCostTry")}
            />
            <NumberInput
              label={t("price_foreign")}
              min={0}
              disabled={!isManual}
              required={isManual}
              {...form.getInputProps("manualCostForeign")}
            />
            <Select
              label={t("currency")}
              data={["USD", "EUR", "GBP"]}
              disabled={!isManual}
              {...form.getInputProps("manualCurrencyCode")}
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

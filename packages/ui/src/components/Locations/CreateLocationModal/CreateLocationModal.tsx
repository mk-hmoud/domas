import { useState, useEffect } from "react";
import {
  TextInput,
  NumberInput,
  Button,
  Modal,
  Select,
  Group,
  Tabs,
  SimpleGrid,
  Switch,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import {
  CreateLocationDto,
  LocationType,
  GenderType,
  LocationOwnership,
} from "@domas/ts-types";
import { useTranslation } from "react-i18next";

interface CreateLocationModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (
    values: CreateLocationDto | CreateLocationDto[],
    createBedsCount?: number,
  ) => Promise<void>;
  parentId?: number | null;
  parentType?: LocationType;
  initialValues?: any;
}

export function CreateLocationModal({
  opened,
  onClose,
  onSubmit,
  parentId,
  parentType,
  initialValues,
}: CreateLocationModalProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>("single");

  // Bulk State
  const [prefix, setPrefix] = useState("Room");
  const [startNumber, setStartNumber] = useState(101);
  const [endNumber, setEndNumber] = useState(120);
  const [autoCreateBeds, setAutoCreateBeds] = useState(false);
  const [bedCount, setBedCount] = useState(3);

  const form = useForm<CreateLocationDto>({
    initialValues: {
      name: "",
      type: LocationType.CAMPUS,
      parentId: parentId || undefined,
      genderLock: undefined,
      isGuestZone: false,
      isTrOnly: false,
      ownership: LocationOwnership.DORM,
      basePrice: 0,
    },
    validate: {
      name: (val) =>
        activeTab === "single" && val.length < 2
          ? t("validation_name_short")
          : null,
      type: (val) => (!val ? t("validation_type_required") : null),
    },
  });

  const getValidTypes = (pType?: LocationType) => {
    if (!pType) return []; // Prevent creating University or anything without a parent

    switch (pType) {
      case LocationType.UNIVERSITY:
        return [LocationType.CAMPUS, LocationType.BUILDING];

      case LocationType.CAMPUS:
        return [LocationType.BUILDING];

      case LocationType.BUILDING:
        return [LocationType.BLOCK, LocationType.FLOOR, LocationType.ROOM];

      case LocationType.BLOCK:
        return [LocationType.FLOOR, LocationType.ROOM];

      case LocationType.FLOOR:
        return [LocationType.ROOM];

      case LocationType.ROOM:
        return [LocationType.BED];

      default:
        return [];
    }
  };

  // Suggest next type based on parent or set initial values
  useEffect(() => {
    if (opened) {
      if (initialValues) {
        form.setValues({
          name: initialValues.name,
          type: initialValues.type,
          genderLock: initialValues.genderLock || undefined,
          isGuestZone: initialValues.isGuestZone || false,
          isTrOnly: initialValues.isTrOnly || false,
          ownership: initialValues.ownership || LocationOwnership.DORM,
          basePrice: initialValues.basePrice || 0,
        });
      } else {
        form.reset();
        form.setFieldValue("parentId", parentId || undefined);
        const validTypes = getValidTypes(parentType);
        if (validTypes.length > 0) {
          form.setFieldValue("type", validTypes[0]);
        }
      }
    }
  }, [opened, parentId, parentType, initialValues]);

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      if (activeTab === "single") {
        await onSubmit(values, autoCreateBeds ? bedCount : undefined);
      } else {
        // Bulk Create
        const dtos: CreateLocationDto[] = [];
        for (let i = startNumber; i <= endNumber; i++) {
          const name = `${prefix} ${i}`;
          dtos.push({ ...values, name });
        }
        await onSubmit(dtos, autoCreateBeds ? bedCount : undefined);
      }
      form.reset();
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const allowedTypes = getValidTypes(parentType);
  const typeOptions = allowedTypes.map((t) => ({
    value: t,
    label: t.toUpperCase(),
  }));
  const genderOptions = Object.values(GenderType).map((t) => ({
    value: t,
    label: t,
  }));
  const ownershipOptions = Object.values(LocationOwnership).map((o) => ({
    value: o,
    label: t(`ownerships.${o}`),
  }));
  const showRoomFields =
    form.values.type === LocationType.ROOM ||
    form.values.type === LocationType.BED;

  const showPriceField = form.values.type === LocationType.ROOM;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={parentId ? t("add_child_location") : t("create_root_location")}
      size="lg"
    >
      <form onSubmit={form.onSubmit(handleSubmit)} noValidate>
        {!initialValues && (
          <Tabs value={activeTab} onChange={setActiveTab} mb="md">
            <Tabs.List>
              <Tabs.Tab value="single">{t("single_create")}</Tabs.Tab>
              <Tabs.Tab value="bulk">{t("bulk_create")}</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="single" pt="xs">
              <TextInput
                label={t("name_label")}
                placeholder={t("name_placeholder")}
                required
                mb="md"
                {...form.getInputProps("name")}
              />
            </Tabs.Panel>

            <Tabs.Panel value="bulk" pt="xs">
              <SimpleGrid cols={3} mb="md">
                <TextInput
                  label={t("prefix")}
                  value={prefix}
                  onChange={(e) => setPrefix(e.currentTarget.value)}
                  required
                />
                <NumberInput
                  label={t("start_number")}
                  value={startNumber}
                  onChange={(val) => setStartNumber(Number(val))}
                  required
                />
                <NumberInput
                  label={t("end_number")}
                  value={endNumber}
                  onChange={(val) => setEndNumber(Number(val))}
                  required
                />
              </SimpleGrid>
            </Tabs.Panel>
          </Tabs>
        )}

        {initialValues && (
          <TextInput
            label={t("name_label")}
            placeholder={t("name_placeholder")}
            required
            mb="md"
            {...form.getInputProps("name")}
          />
        )}

        {form.values.type === LocationType.ROOM && !initialValues && (
          <Group mb="md" align="flex-end">
            <Switch
              label={t("auto_create_beds", {
                defaultValue: "Auto Create Beds (A, B, C...)",
              })}
              checked={autoCreateBeds}
              onChange={(e) => setAutoCreateBeds(e.currentTarget.checked)}
            />
            {autoCreateBeds && (
              <NumberInput
                label={t("bed_count", { defaultValue: "Bed Count" })}
                value={bedCount}
                onChange={(val) => setBedCount(Number(val))}
                min={1}
                max={6}
                style={{ width: 100 }}
              />
            )}
          </Group>
        )}

        <SimpleGrid cols={2}>
          <Select
            label={t("type_label")}
            data={typeOptions}
            required
            {...form.getInputProps("type")}
          />
          {showRoomFields && (
            <Select
              label={t("ownership")}
              data={ownershipOptions}
              required
              {...form.getInputProps("ownership")}
            />
          )}
        </SimpleGrid>

        <SimpleGrid cols={2} mt="md">
          {showPriceField && (
            <NumberInput
              label={t("base_price")}
              min={0}
              {...form.getInputProps("basePrice")}
            />
          )}
          {showRoomFields && (
            <Select
              label={t("gender_lock_label")}
              placeholder={t("none")}
              data={genderOptions}
              clearable
              {...form.getInputProps("genderLock")}
            />
          )}
        </SimpleGrid>

        {showRoomFields && (
          <Group pt={24}>
            <Switch
              label={t("is_guest_zone_label")}
              {...form.getInputProps("isGuestZone", { type: "checkbox" })}
            />
            <Switch
              label={t("is_tr_only")}
              {...form.getInputProps("isTrOnly", { type: "checkbox" })}
            />
          </Group>
        )}

        <Group justify="flex-end" mt="xl">
          <Button variant="default" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button type="submit" loading={loading}>
            {initialValues
              ? t("save")
              : activeTab === "bulk"
                ? `${t("create")} (${endNumber - startNumber + 1})`
                : t("create")}
          </Button>
        </Group>
      </form>
    </Modal>
  );
}

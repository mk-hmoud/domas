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
  onSubmit: (values: CreateLocationDto | CreateLocationDto[]) => Promise<void>;
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
        if (!parentId) {
          form.setFieldValue("type", LocationType.UNIVERSITY);
        } else if (parentType === LocationType.UNIVERSITY) {
          form.setFieldValue("type", LocationType.CAMPUS);
        } else if (parentType === LocationType.CAMPUS) {
          form.setFieldValue("type", LocationType.BUILDING);
        } else if (parentType === LocationType.BUILDING) {
          form.setFieldValue("type", LocationType.BLOCK);
        } else if (parentType === LocationType.BLOCK) {
          form.setFieldValue("type", LocationType.FLOOR);
        } else if (parentType === LocationType.FLOOR) {
          form.setFieldValue("type", LocationType.ROOM);
        }
      }
    }
  }, [opened, parentId, parentType, initialValues]);

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      if (activeTab === "single") {
        await onSubmit(values);
      } else {
        // Bulk Create
        const dtos: CreateLocationDto[] = [];
        for (let i = startNumber; i <= endNumber; i++) {
          const name = `${prefix} ${i}`;
          dtos.push({ ...values, name });
        }
        await onSubmit(dtos);
      }
      form.reset();
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const typeOptions = Object.values(LocationType).map((t) => ({
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
              <SimpleGrid cols={3}>
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

        <SimpleGrid cols={2}>
          <Select
            label={t("type_label")}
            data={typeOptions}
            required
            {...form.getInputProps("type")}
          />
          <Select
            label={t("ownership")}
            data={ownershipOptions}
            required
            {...form.getInputProps("ownership")}
          />
        </SimpleGrid>

        <SimpleGrid cols={2} mt="md">
          <NumberInput
            label={t("base_price")}
            min={0}
            {...form.getInputProps("basePrice")}
          />
          <Select
            label={t("gender_lock_label")}
            placeholder={t("none")}
            data={genderOptions}
            clearable
            {...form.getInputProps("genderLock")}
          />
        </SimpleGrid>

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

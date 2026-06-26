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
  StudentYearLock,
  LocationOwnership,
  RoomType,
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
  roomTypes?: RoomType[];
}

export function CreateLocationModal({
  opened,
  onClose,
  onSubmit,
  parentId,
  parentType,
  initialValues,
  roomTypes = [],
}: CreateLocationModalProps) {
  const { t, i18n } = useTranslation();
  const isTr = i18n.language === "tr";
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>("single");

  // Bulk State
  const [prefix, setPrefix] = useState("Room");
  const [prefixTr, setPrefixTr] = useState("");
  const [startNumber, setStartNumber] = useState("101");
  const [endNumber, setEndNumber] = useState("120");
  const [autoCreateBeds, setAutoCreateBeds] = useState(false);
  const [bedCount, setBedCount] = useState(3);

  const form = useForm<CreateLocationDto>({
    initialValues: {
      name: "",
      nameTr: "",
      type: LocationType.CAMPUS,
      parentId: parentId || undefined,
      genderLock: undefined,
      studentYearLock: undefined,
      isGuestZone: false,
      isTrOnly: false,
      isForeignerOnly: false,
      ownership: LocationOwnership.DORM,
      roomTypeId: undefined as number | undefined,
    },
    validate: {
      name: (val) =>
        activeTab === "single" && val.length < 2
          ? t("validation_name_short")
          : null,
      type: (val) => (!val ? t("validation_type_required") : null),
      roomTypeId: (val, values) =>
        values.type === LocationType.ROOM && !val
          ? t("validation_room_type_required", {
              defaultValue: "Room type is required for rooms",
            })
          : null,
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
      setAutoCreateBeds(false);
      setBedCount(3);
      setPrefixTr("");
      if (initialValues) {
        form.setValues({
          name: initialValues.name,
          nameTr: initialValues.nameTr || "",
          type: initialValues.type,
          genderLock: initialValues.genderLock || undefined,
          studentYearLock: initialValues.studentYearLock || undefined,
          isGuestZone: initialValues.isGuestZone || false,
          isTrOnly: initialValues.isTrOnly || false,
          isForeignerOnly: initialValues.isForeignerOnly || false,
          ownership: initialValues.ownership || LocationOwnership.DORM,
          roomTypeId: initialValues.roomTypeId ?? undefined,
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
    const payload = {
      ...values,
      nameTr: values.nameTr || undefined,
      roomTypeId: values.roomTypeId ?? undefined,
    };
    try {
      if (activeTab === "single") {
        await onSubmit(payload, autoCreateBeds ? bedCount : undefined);
      } else {
        // Bulk Create
        const start = parseInt(startNumber, 10);
        const end = parseInt(endNumber, 10);
        const hasLeadingZero =
          startNumber.startsWith("0") || endNumber.startsWith("0");
        const padLength = hasLeadingZero
          ? Math.max(startNumber.length, endNumber.length)
          : 0;
        const dtos: CreateLocationDto[] = [];
        for (let i = start; i <= end; i++) {
          const numStr = hasLeadingZero
            ? String(i).padStart(padLength, "0")
            : String(i);
          const name = `${prefix} ${numStr}`;
          const nameTr = prefixTr ? `${prefixTr} ${numStr}` : undefined;
          dtos.push({ ...payload, name, nameTr });
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
  const studentYearLockOptions = [
    {
      value: StudentYearLock.NEW,
      label: t("student_year_lock_new", "New students"),
    },
    {
      value: StudentYearLock.CURRENT,
      label: t("student_year_lock_current", "Current students"),
    },
  ];
  const ownershipOptions = Object.values(LocationOwnership).map((o) => ({
    value: o,
    label: t(`ownerships.${o}`),
  }));
  const showRoomFields =
    form.values.type === LocationType.ROOM ||
    form.values.type === LocationType.BED;

  const isRoomType = form.values.type === LocationType.ROOM;

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
              <SimpleGrid cols={2} mb="md">
                <TextInput
                  label={t("name_label")}
                  placeholder={t("name_placeholder")}
                  required
                  {...form.getInputProps("name")}
                />
                <TextInput
                  label={t("name_tr_label", {
                    defaultValue: "Turkish Name",
                  })}
                  placeholder={t("name_tr_placeholder", {
                    defaultValue: "Optional",
                  })}
                  {...form.getInputProps("nameTr")}
                />
              </SimpleGrid>
            </Tabs.Panel>

            <Tabs.Panel value="bulk" pt="xs">
              <SimpleGrid cols={2} mb="md">
                <TextInput
                  label={t("prefix")}
                  value={prefix}
                  onChange={(e) => setPrefix(e.currentTarget.value)}
                  required
                />
                <TextInput
                  label={t("prefix_tr", { defaultValue: "Turkish Prefix" })}
                  placeholder={t("name_tr_placeholder", {
                    defaultValue: "Optional",
                  })}
                  value={prefixTr}
                  onChange={(e) => setPrefixTr(e.currentTarget.value)}
                />
              </SimpleGrid>
              <SimpleGrid cols={2} mb="md">
                <TextInput
                  label={t("start_number")}
                  value={startNumber}
                  onChange={(e) => setStartNumber(e.currentTarget.value)}
                  required
                />
                <TextInput
                  label={t("end_number")}
                  value={endNumber}
                  onChange={(e) => setEndNumber(e.currentTarget.value)}
                  required
                />
              </SimpleGrid>
            </Tabs.Panel>
          </Tabs>
        )}

        {initialValues && (
          <SimpleGrid cols={2} mb="md">
            <TextInput
              label={t("name_label")}
              placeholder={t("name_placeholder")}
              required
              {...form.getInputProps("name")}
            />
            <TextInput
              label={t("name_tr_label", { defaultValue: "Turkish Name" })}
              placeholder={t("name_tr_placeholder", {
                defaultValue: "Optional",
              })}
              {...form.getInputProps("nameTr")}
            />
          </SimpleGrid>
        )}

        {form.values.type === LocationType.ROOM && !initialValues && (
          <Group mb="md" align="flex-end">
            <Switch
              label={t("auto_create_beds")}
              checked={autoCreateBeds}
              onChange={(e) => setAutoCreateBeds(e.currentTarget.checked)}
            />
            {autoCreateBeds && (
              <NumberInput
                label={t("bed_count")}
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

        {isRoomType && (
          <Select
            mt="md"
            label={t("room_type", { defaultValue: "Room Type" })}
            placeholder={t("select_room_type", {
              defaultValue: "Select a room type",
            })}
            withAsterisk
            data={roomTypes.map((rt) => ({
              value: String(rt.id),
              label: `${isTr && rt.nameTr ? rt.nameTr : rt.name} (${rt.capacity} ${t("beds", { defaultValue: "beds" })})`,
            }))}
            value={
              form.values.roomTypeId ? String(form.values.roomTypeId) : null
            }
            onChange={(v) =>
              form.setFieldValue("roomTypeId", v ? Number(v) : undefined)
            }
            error={form.errors.roomTypeId}
          />
        )}

        <SimpleGrid cols={2} mt="md">
          {showRoomFields && (
            <Select
              label={t("gender_lock_label")}
              placeholder={t("none")}
              data={genderOptions}
              clearable
              {...form.getInputProps("genderLock")}
            />
          )}
          {showRoomFields && (
            <Select
              label={t("student_year_lock_label", "Student year")}
              placeholder={t("none")}
              data={studentYearLockOptions}
              clearable
              {...form.getInputProps("studentYearLock")}
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
            <Switch
              label={t("is_foreigner_only")}
              {...form.getInputProps("isForeignerOnly", { type: "checkbox" })}
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
                ? `${t("create")} (${parseInt(endNumber, 10) - parseInt(startNumber, 10) + 1})`
                : t("create")}
          </Button>
        </Group>
      </form>
    </Modal>
  );
}

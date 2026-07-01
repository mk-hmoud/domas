import { useState, useEffect } from "react";
import {
  TextInput,
  Button,
  Modal,
  Select,
  Group,
  Tabs,
  SimpleGrid,
  Switch,
  Text,
  Alert,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import {
  CreateLocationDto,
  LocationType,
  GenderType,
  StudentYearLock,
  RoomType,
  AncestorFlagsResult,
} from "@domas/ts-types";
import { useTranslation } from "react-i18next";
import { IconInfoCircle } from "@tabler/icons-react";
import { FlagInheritancePanel } from "../FlagInheritancePanel";

interface CreateLocationModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (values: CreateLocationDto | CreateLocationDto[]) => Promise<void>;
  parentId?: number | null;
  parentType?: LocationType;
  initialValues?: any;
  roomTypes?: RoomType[];
  parentAncestorFlags?: AncestorFlagsResult | null;
}

export function CreateLocationModal({
  opened,
  onClose,
  onSubmit,
  parentId,
  parentType,
  initialValues,
  roomTypes = [],
  parentAncestorFlags,
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
      isRectorate: false,
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
    if (!pType) return [];

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

  useEffect(() => {
    if (opened) {
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
          isRectorate: initialValues.isRectorate || false,
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
        await onSubmit(payload);
      } else {
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

  const allowedTypes = getValidTypes(parentType);
  const typeOptions = initialValues
    ? [
        {
          value: initialValues.type as string,
          label: (initialValues.type as string).toUpperCase(),
        },
      ]
    : allowedTypes.map((t) => ({ value: t, label: t.toUpperCase() }));
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

  const isRoomType = form.values.type === LocationType.ROOM;
  const isBedType = form.values.type === LocationType.BED;
  const showRoomFields = isRoomType || isBedType;

  // Find the selected room type to preview its flags
  const selectedRoomType =
    isRoomType && form.values.roomTypeId
      ? roomTypes.find((rt) => rt.id === form.values.roomTypeId)
      : null;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        initialValues
          ? t("edit_location", "Edit Location")
          : parentId
            ? t("add_child_location")
            : t("create_root_location")
      }
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

        <SimpleGrid cols={2}>
          <Select
            label={t("type_label")}
            data={typeOptions}
            required
            disabled={!!initialValues}
            {...form.getInputProps("type")}
          />
          {showRoomFields && <div />}
        </SimpleGrid>

        {isRoomType && (
          <Select
            mt="md"
            label={t("room_type", { defaultValue: "Room Type" })}
            description={t("room_type_auto_beds_note", {
              defaultValue:
                "Beds will be created automatically based on the room type's capacity.",
            })}
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

        {/* For rooms: show read-only flag preview from room type */}
        {isRoomType && selectedRoomType && (
          <Alert
            mt="md"
            icon={<IconInfoCircle size={14} />}
            color="blue"
            variant="light"
            p="xs"
          >
            <Text size="xs" fw={500} mb={4}>
              {t("flags_from_room_type", {
                defaultValue: "Flags inherited from room type:",
              })}
            </Text>
            <Text size="xs" c="dimmed">
              {[
                selectedRoomType.genderLock &&
                  `${t("gender_lock_label", { defaultValue: "Gender" })}: ${selectedRoomType.genderLock}`,
                selectedRoomType.studentYearLock &&
                  `${t("student_year_lock_label", { defaultValue: "Year" })}: ${selectedRoomType.studentYearLock}`,
                selectedRoomType.isGuestZone &&
                  t("is_guest_zone_label", { defaultValue: "Guest Zone" }),
                selectedRoomType.isTrOnly &&
                  t("is_tr_only", { defaultValue: "TR Only" }),
                selectedRoomType.isForeignerOnly &&
                  t("is_foreigner_only", { defaultValue: "Foreigners Only" }),
                selectedRoomType.isRectorate &&
                  t("is_rectorate", { defaultValue: "Rectorate" }),
              ]
                .filter(Boolean)
                .join(" · ") ||
                t("no_flags_set", { defaultValue: "No special flags" })}
            </Text>
          </Alert>
        )}

        {parentAncestorFlags && (
          <FlagInheritancePanel
            ancestorFlags={parentAncestorFlags}
            ownFlags={
              initialValues
                ? {
                    isTrOnly: initialValues.isTrOnly,
                    isForeignerOnly: initialValues.isForeignerOnly,
                    isGuestZone: initialValues.isGuestZone,
                    isRectorate: initialValues.isRectorate,
                    genderLock: initialValues.genderLock,
                    studentYearLock: initialValues.studentYearLock,
                  }
                : undefined
            }
          />
        )}

        {/* Rooms: flags are controlled by room type — no direct editing */}
        {/* Beds + all structural types: show full flag controls */}
        {!isRoomType && (
          <>
            <SimpleGrid cols={2} mt="md">
              <Select
                label={t("gender_lock_label")}
                placeholder={t("none")}
                data={genderOptions}
                clearable
                {...form.getInputProps("genderLock")}
              />
              <Select
                label={t("student_year_lock_label", "Student year")}
                placeholder={t("none")}
                data={studentYearLockOptions}
                clearable
                {...form.getInputProps("studentYearLock")}
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
                onChange={(e) => {
                  form.setFieldValue("isTrOnly", e.currentTarget.checked);
                  if (e.currentTarget.checked)
                    form.setFieldValue("isForeignerOnly", false);
                }}
              />
              <Switch
                label={t("is_foreigner_only")}
                {...form.getInputProps("isForeignerOnly", { type: "checkbox" })}
                onChange={(e) => {
                  form.setFieldValue(
                    "isForeignerOnly",
                    e.currentTarget.checked,
                  );
                  if (e.currentTarget.checked)
                    form.setFieldValue("isTrOnly", false);
                }}
              />
              <Switch
                label={t("is_rectorate", "Rectorate")}
                {...form.getInputProps("isRectorate", { type: "checkbox" })}
              />
            </Group>
          </>
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

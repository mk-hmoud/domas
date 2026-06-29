import { useState } from "react";
import {
  Modal,
  Button,
  Group,
  Switch,
  Select,
  Checkbox,
  SimpleGrid,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useTranslation } from "react-i18next";
import {
  UpdateLocationDto,
  GenderType,
  StudentYearLock,
} from "@domas/ts-types";

interface BulkEditLocationModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (values: UpdateLocationDto) => Promise<void>;
  count: number;
}

export function BulkEditLocationModal({
  opened,
  onClose,
  onSubmit,
  count,
}: BulkEditLocationModalProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  // States to track which fields to update
  const [updateIsRectorate, setUpdateIsRectorate] = useState(false);
  const [updateTrOnly, setUpdateTrOnly] = useState(false);
  const [updateForeignerOnly, setUpdateForeignerOnly] = useState(false);
  const [updateGuestZone, setUpdateGuestZone] = useState(false);
  const [updateGenderLock, setUpdateGenderLock] = useState(false);
  const [updateStudentYearLock, setUpdateStudentYearLock] = useState(false);

  const form = useForm<UpdateLocationDto>({
    initialValues: {
      isRectorate: false,
      isTrOnly: false,
      isForeignerOnly: false,
      isGuestZone: false,
      genderLock: undefined,
      studentYearLock: undefined,
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      const payload: UpdateLocationDto = {};
      if (updateIsRectorate) payload.isRectorate = values.isRectorate;
      if (updateTrOnly) payload.isTrOnly = values.isTrOnly;
      if (updateForeignerOnly) payload.isForeignerOnly = values.isForeignerOnly;
      if (updateGuestZone) payload.isGuestZone = values.isGuestZone;
      if (updateGenderLock) payload.genderLock = values.genderLock;
      if (updateStudentYearLock)
        payload.studentYearLock = values.studentYearLock ?? null;

      if (Object.keys(payload).length > 0) {
        await onSubmit(payload);
      }

      form.reset();
      setUpdateIsRectorate(false);
      setUpdateTrOnly(false);
      setUpdateForeignerOnly(false);
      setUpdateGuestZone(false);
      setUpdateGenderLock(false);
      setUpdateStudentYearLock(false);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const genderOptions = Object.values(GenderType).map((g) => ({
    value: g,
    label: t(g),
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

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={`${t("bulk_edit", { defaultValue: "Bulk Edit" })} (${count})`}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <SimpleGrid cols={1} spacing="md">
          <Group align="center">
            <Checkbox
              checked={updateIsRectorate}
              onChange={(e) => {
                setUpdateIsRectorate(e.currentTarget.checked);
                if (e.currentTarget.checked)
                  form.setFieldValue("isRectorate", true);
              }}
              label={t("is_rectorate", "Rectorate")}
              style={{ width: 150 }}
            />
            <Switch
              disabled={!updateIsRectorate}
              {...form.getInputProps("isRectorate", { type: "checkbox" })}
            />
          </Group>

          <Group align="center">
            <Checkbox
              checked={updateTrOnly}
              onChange={(e) => {
                setUpdateTrOnly(e.currentTarget.checked);
                if (e.currentTarget.checked)
                  form.setFieldValue("isTrOnly", true);
              }}
              label={t("is_tr_only")}
              style={{ width: 150 }}
            />
            <Switch
              disabled={!updateTrOnly}
              {...form.getInputProps("isTrOnly", { type: "checkbox" })}
            />
          </Group>

          <Group align="center">
            <Checkbox
              checked={updateForeignerOnly}
              onChange={(e) => {
                setUpdateForeignerOnly(e.currentTarget.checked);
                if (e.currentTarget.checked)
                  form.setFieldValue("isForeignerOnly", true);
              }}
              label={t("is_foreigner_only")}
              style={{ width: 150 }}
            />
            <Switch
              disabled={!updateForeignerOnly}
              {...form.getInputProps("isForeignerOnly", { type: "checkbox" })}
            />
          </Group>

          <Group align="center">
            <Checkbox
              checked={updateGuestZone}
              onChange={(e) => {
                setUpdateGuestZone(e.currentTarget.checked);
                if (e.currentTarget.checked)
                  form.setFieldValue("isGuestZone", true);
              }}
              label={t("is_guest_zone_label")}
              style={{ width: 150 }}
            />
            <Switch
              disabled={!updateGuestZone}
              {...form.getInputProps("isGuestZone", { type: "checkbox" })}
            />
          </Group>

          <Group align="flex-end">
            <Checkbox
              checked={updateGenderLock}
              onChange={(e) => setUpdateGenderLock(e.currentTarget.checked)}
              label={t("gender_lock_label")}
              style={{ width: 150 }}
            />
            <Select
              placeholder={t("none")}
              data={genderOptions}
              disabled={!updateGenderLock}
              clearable
              style={{ flex: 1 }}
              {...form.getInputProps("genderLock")}
            />
          </Group>

          <Group align="flex-end">
            <Checkbox
              checked={updateStudentYearLock}
              onChange={(e) =>
                setUpdateStudentYearLock(e.currentTarget.checked)
              }
              label={t("student_year_lock_label", "Student year")}
              style={{ width: 150 }}
            />
            <Select
              placeholder={t("none")}
              data={studentYearLockOptions}
              disabled={!updateStudentYearLock}
              clearable
              style={{ flex: 1 }}
              {...form.getInputProps("studentYearLock")}
            />
          </Group>
        </SimpleGrid>

        <Group justify="flex-end" mt="xl">
          <Button variant="default" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button
            type="submit"
            loading={loading}
            disabled={
              !updateIsRectorate &&
              !updateTrOnly &&
              !updateForeignerOnly &&
              !updateGuestZone &&
              !updateGenderLock &&
              !updateStudentYearLock
            }
          >
            {t("save")}
          </Button>
        </Group>
      </form>
    </Modal>
  );
}

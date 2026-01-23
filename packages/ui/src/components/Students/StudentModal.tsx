import { useState, useEffect, useMemo } from "react";
import {
  Modal,
  TextInput,
  Button,
  Group,
  Select,
  SimpleGrid,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { useTranslation } from "react-i18next";
import {
  CreateStudentDto,
  Student,
  GenderType,
  COUNTRIES,
  DEPARTMENTS,
} from "@domas/ts-types";
import { IconPhone } from "@tabler/icons-react";

interface StudentModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (values: CreateStudentDto) => Promise<void>;
  initialValues?: Student | null;
}

export function StudentModal({
  opened,
  onClose,
  onSubmit,
  initialValues,
}: StudentModalProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const countryOptions = useMemo(
    () => COUNTRIES.map(([code, name]) => ({ value: code, label: name })),
    [],
  );

  const departmentOptions = useMemo(
    () => DEPARTMENTS.map((dept) => ({ value: dept, label: dept })),
    [],
  );

  const form = useForm<any>({
    initialValues: {
      studentNumber: "",
      firstName: "",
      lastName: "",
      gender: GenderType.MALE,
      nationalityCode: "",
      nationalId: "",
      birthDate: null,
      birthPlace: "",
      department: "",
      email: "",
      phoneNumber: "",
    },
    validate: {
      studentNumber: (val) => {
        if (!val) return t("field_required");
        if (!/^\d+$/.test(val)) return t("invalid_number");
        return null;
      },
      nationalId: (val) => (val ? null : t("field_required")),
      nationalityCode: (val) => (val ? null : t("field_required")),
      firstName: (val) => (val ? null : t("field_required")),
      lastName: (val) => (val ? null : t("field_required")),
      birthDate: (val) => (val ? null : t("field_required")),
      birthPlace: (val) => (val ? null : t("field_required")),
      department: (val) => (val ? null : t("field_required")),
      email: (val) =>
        !val || /^\S+@\S+$/.test(val) ? null : t("invalid_email"),
      phoneNumber: (val) =>
        val && !/^\+?[\d\s]{7,20}$/.test(val) ? t("invalid_phone") : null,
    },
  });

  useEffect(() => {
    if (opened) {
      if (initialValues) {
        form.setValues({
          studentNumber: initialValues.studentNumber,
          firstName: initialValues.firstName,
          lastName: initialValues.lastName,
          gender: initialValues.gender,
          nationalityCode: initialValues.nationalityCode,
          nationalId: initialValues.nationalId || "",
          birthDate: initialValues.birthDate
            ? new Date(initialValues.birthDate)
            : null,
          birthPlace: initialValues.birthPlace || "",
          department: initialValues.department || "",
          email: initialValues.email || "",
          phoneNumber: initialValues.phoneNumber || "",
        });
      } else {
        form.reset();
      }
    }
  }, [opened, initialValues]);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const payload: CreateStudentDto = {
        studentNumber: values.studentNumber,
        firstName: values.firstName,
        lastName: values.lastName,
        gender: values.gender,
        nationalityCode: values.nationalityCode,
        nationalId: values.nationalId,
        birthDate:
          values.birthDate instanceof Date
            ? values.birthDate.toISOString()
            : values.birthDate,
        birthPlace: values.birthPlace,
        department: values.department,
        email: values.email || undefined,
        phoneNumber: values.phoneNumber
          ? values.phoneNumber.replace(/\s/g, "")
          : undefined,
      };

      await onSubmit(payload);
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
      title={
        initialValues
          ? t("edit_student", { defaultValue: "Edit Student" })
          : t("create_student", { defaultValue: "Create Student" })
      }
      size="lg"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <SimpleGrid cols={2}>
          <TextInput
            label={t("student_number", { defaultValue: "Student Number" })}
            required
            inputMode="numeric"
            {...form.getInputProps("studentNumber")}
          />
          <TextInput
            label={t("national_id", { defaultValue: "National ID" })}
            required
            {...form.getInputProps("nationalId")}
          />
        </SimpleGrid>

        <SimpleGrid cols={2} mt="md">
          <TextInput
            label={t("first_name", { defaultValue: "First Name" })}
            required
            {...form.getInputProps("firstName")}
          />
          <TextInput
            label={t("last_name", { defaultValue: "Last Name" })}
            required
            {...form.getInputProps("lastName")}
          />
        </SimpleGrid>

        <SimpleGrid cols={2} mt="md">
          <Select
            label={t("gender", { defaultValue: "Gender" })}
            data={[
              { value: GenderType.MALE, label: t("male") },
              { value: GenderType.FEMALE, label: t("female") },
            ]}
            required
            {...form.getInputProps("gender")}
          />
          <DatePickerInput
            label={t("birth_date", { defaultValue: "Birth Date" })}
            required
            {...form.getInputProps("birthDate")}
          />
        </SimpleGrid>

        <SimpleGrid cols={2} mt="md">
          <TextInput
            label={t("birth_place", { defaultValue: "Birth Place" })}
            required
            {...form.getInputProps("birthPlace")}
          />
          <Select
            label={t("department", { defaultValue: "Department" })}
            data={departmentOptions}
            searchable
            required
            {...form.getInputProps("department")}
          />
        </SimpleGrid>

        <SimpleGrid cols={2} mt="md">
          <Select
            label={t("nationality_code", { defaultValue: "Nationality" })}
            placeholder={t("select_country", {
              defaultValue: "Select country",
            })}
            data={countryOptions}
            searchable
            required
            {...form.getInputProps("nationalityCode")}
          />
          <TextInput
            label={t("phone_number", { defaultValue: "Phone Number" })}
            placeholder="+90 5xx xxx xxxx"
            leftSection={<IconPhone size={16} />}
            type="tel"
            {...form.getInputProps("phoneNumber")}
          />
        </SimpleGrid>

        <TextInput
          label={t("email")}
          mt="md"
          {...form.getInputProps("email")}
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

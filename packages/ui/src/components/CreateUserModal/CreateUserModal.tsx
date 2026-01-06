import { useState } from "react";
import {
  TextInput,
  PasswordInput,
  Button,
  Modal,
  Select,
  ActionIcon,
  Tooltip,
  rem,
  Group,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { useTranslation } from "react-i18next";
import { UserRole, CreateUser } from "@domas/ts-types";
import { IconRefresh, IconEye, IconEyeOff } from "@tabler/icons-react";

interface CreateUserModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (values: CreateUser) => Promise<void>;
  roles?: UserRole[];
}

export function CreateUserModal({
  opened,
  onClose,
  onSubmit,
  roles,
}: CreateUserModalProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [visible, { toggle }] = useDisclosure(false);

  const availableRoles = roles || [
    UserRole.ADMIN,
    UserRole.DORM_MANAGER,
    UserRole.DORM_STAFF,
    UserRole.ACCOUNTING_STAFF,
    UserRole.STUDENT,
  ];

  const form = useForm({
    initialValues: {
      email: "",
      password: "",
      role: availableRoles[0],
    },
    validate: {
      email: (val) => (/^\S+@\S+$/.test(val) ? null : t("invalid_email")),
      password: (val) => (val.length < 6 ? t("password_too_short") : null),
    },
  });

  const generatePassword = () => {
    const chars =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    const length = 12;
    let password = "";
    const array = new Uint32Array(length);
    window.crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
      password += chars[array[i] % chars.length];
    }
    form.setFieldValue("password", password);
  };

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      await onSubmit({
        email: values.email,
        password: values.password,
        role: values.role as UserRole,
      });
      form.reset();
      onClose();
    } catch (error) {
      // Error handling is up to parent, but we stop loading
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title={t("create_new_user")}>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <TextInput
          label={t("email")}
          placeholder="user@example.com"
          required
          {...form.getInputProps("email")}
        />
        <PasswordInput
          label={t("password")}
          placeholder={t("your_password")}
          required
          mt="md"
          visible={visible}
          onVisibilityChange={toggle}
          rightSectionWidth={70}
          rightSection={
            <Group gap={0}>
              <Tooltip
                label={visible ? t("hide_password") : t("show_password")}
              >
                <ActionIcon variant="subtle" color="gray" onClick={toggle}>
                  {visible ? (
                    <IconEyeOff style={{ width: rem(16), height: rem(16) }} />
                  ) : (
                    <IconEye style={{ width: rem(16), height: rem(16) }} />
                  )}
                </ActionIcon>
              </Tooltip>
              <Tooltip label={t("generate_password")}>
                <ActionIcon
                  variant="light"
                  color="blue"
                  onClick={generatePassword}
                >
                  <IconRefresh style={{ width: rem(16), height: rem(16) }} />
                </ActionIcon>
              </Tooltip>
            </Group>
          }
          {...form.getInputProps("password")}
        />
        <Select
          label={t("role")}
          placeholder={t("pick_one")}
          mt="md"
          disabled={availableRoles.length <= 1}
          data={availableRoles.map((role) => ({
            value: role,
            label: t(`roles.${role}`, {
              defaultValue:
                role.charAt(0).toUpperCase() + role.slice(1).replace("_", " "),
            }),
          }))}
          {...form.getInputProps("role")}
        />
        <Button fullWidth mt="xl" type="submit" loading={loading}>
          {t("create_user")}
        </Button>
      </form>
    </Modal>
  );
}

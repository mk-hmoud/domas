import { useState, useEffect } from "react";
import {
  TextInput,
  PasswordInput,
  Button,
  Modal,
  ActionIcon,
  Tooltip,
  rem,
  Group,
  Switch,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { useTranslation } from "react-i18next";
import { CreateUserDto, UpdateUserDto, User } from "@domas/ts-types";
import { IconRefresh, IconEye, IconEyeOff } from "@tabler/icons-react";

interface CreateUserModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (values: CreateUserDto | UpdateUserDto) => Promise<void>;
  userToEdit?: User | null;
}

export function CreateUserModal({
  opened,
  onClose,
  onSubmit,
  userToEdit,
}: CreateUserModalProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [visible, { toggle }] = useDisclosure(false);

  const form = useForm({
    initialValues: {
      email: "",
      password: "",
      isActive: true,
    },
    validate: {
      email: (val) => (/^\S+@\S+$/.test(val) ? null : t("invalid_email")),
      password: (val) => {
        if (userToEdit && !val) return null; // Password optional on edit
        return val.length < 6 ? t("password_too_short") : null;
      },
    },
  });

  useEffect(() => {
    if (opened) {
      if (userToEdit) {
        form.setValues({
          email: userToEdit.email,
          password: "",
          isActive: userToEdit.isActive,
        });
      } else {
        form.reset();
      }
    }
  }, [opened, userToEdit]);

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
      const payload = { ...values };
      // Remove empty password on edit so it doesn't overwrite with empty string
      if (userToEdit && !payload.password) {
        delete (payload as any).password;
      }
      await onSubmit(payload);
      form.reset();
      onClose();
    } catch (error) {
      // Error handling is up to parent, but we stop loading
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={userToEdit ? t("edit_user") : t("create_new_user")}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <TextInput
          label={t("email")}
          placeholder="user@example.com"
          required
          {...form.getInputProps("email")}
        />
        <PasswordInput
          label={t("password")}
          description={userToEdit ? t("leave_blank_keep_password") : undefined}
          placeholder={t("your_password")}
          required={!userToEdit}
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

        {userToEdit && (
          <Switch
            label={t("active")}
            mt="md"
            checked={form.values.isActive}
            {...form.getInputProps("isActive", { type: "checkbox" })}
          />
        )}

        <Button fullWidth mt="xl" type="submit" loading={loading}>
          {userToEdit ? t("save_changes") : t("create_user")}
        </Button>
      </form>
    </Modal>
  );
}

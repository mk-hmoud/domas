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
  Checkbox,
  Stack,
  Text,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { useTranslation } from "react-i18next";
import { CreateUserDto, UpdateUserDto, User, Role } from "@domas/ts-types";
import { IconRefresh, IconEye, IconEyeOff } from "@tabler/icons-react";

interface CreateUserModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (
    values: CreateUserDto | (UpdateUserDto & { roleIds?: number[] }),
  ) => Promise<void>;
  userToEdit?: User | null;
  availableRoles?: Role[];
}

export function CreateUserModal({
  opened,
  onClose,
  onSubmit,
  userToEdit,
  availableRoles = [],
}: CreateUserModalProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [visible, { toggle }] = useDisclosure(false);

  const form = useForm({
    initialValues: {
      email: "",
      firstName: "",
      lastName: "",
      phoneNumber: "",
      password: "",
      isActive: true,
      roleIds: [] as string[],
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
          firstName: userToEdit.firstName || "",
          lastName: userToEdit.lastName || "",
          phoneNumber: userToEdit.phoneNumber || "",
          password: "",
          isActive: userToEdit.isActive,
          roleIds: userToEdit.roles?.map((r) => r.id.toString()) || [],
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
      if (userToEdit) {
        // Update user
        const payload: UpdateUserDto & { roleIds: number[] } = {
          email: values.email,
          firstName: values.firstName,
          lastName: values.lastName,
          phoneNumber: values.phoneNumber,
          isActive: values.isActive,
          roleIds: values.roleIds.map((id) => parseInt(id)),
        };
        if (values.password) {
          payload.password = values.password;
        }
        await onSubmit(payload);
      } else {
        // Create user
        const payload: CreateUserDto = {
          email: values.email,
          firstName: values.firstName,
          lastName: values.lastName,
          phoneNumber: values.phoneNumber,
          roleIds: values.roleIds.map((id) => parseInt(id)),
        };
        if (values.password) {
          payload.password = values.password;
        }
        await onSubmit(payload);
      }
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
        <Group grow mb="md">
          <TextInput
            label={t("first_name", { defaultValue: "First Name" })}
            placeholder="John"
            {...form.getInputProps("firstName")}
          />
          <TextInput
            label={t("last_name", { defaultValue: "Last Name" })}
            placeholder="Doe"
            {...form.getInputProps("lastName")}
          />
        </Group>

        <TextInput
          label={t("phone_number", { defaultValue: "Phone Number" })}
          placeholder="+90 123 456 7890"
          mb="md"
          {...form.getInputProps("phoneNumber")}
        />

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

        <Checkbox.Group
          label={t("user_roles")}
          mt="md"
          {...form.getInputProps("roleIds")}
        >
          <Stack gap="xs" mt="xs">
            {availableRoles.map((role) => (
              <Checkbox
                key={role.id}
                value={role.id.toString()}
                label={
                  <div>
                    <Text size="sm" fw={500}>
                      {role.name}
                    </Text>
                    {role.description && (
                      <Text size="xs" c="dimmed">
                        {role.description}
                      </Text>
                    )}
                  </div>
                }
                styles={{
                  body: { alignItems: "flex-start" },
                }}
              />
            ))}
          </Stack>
        </Checkbox.Group>

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

import { useState } from "react";
import { TextInput, PasswordInput, Button, Modal, Select } from "@mantine/core";
import { useForm } from "@mantine/form";
import { UserRole, CreateUser } from "@domas/ts-types";

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
  const [loading, setLoading] = useState(false);

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
      email: (val) => (/^\S+@\S+$/.test(val) ? null : "Invalid email"),
      password: (val) => (val.length <= 6 ? "Password too short" : null),
    },
  });

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
    <Modal opened={opened} onClose={onClose} title="Create New User">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <TextInput
          label="Email"
          placeholder="user@example.com"
          required
          {...form.getInputProps("email")}
        />
        <PasswordInput
          label="Password"
          placeholder="Secure password"
          required
          mt="md"
          {...form.getInputProps("password")}
        />
        <Select
          label="Role"
          placeholder="Pick one"
          mt="md"
          disabled={availableRoles.length <= 1}
          data={availableRoles.map((role) => ({
            value: role,
            label:
              role.charAt(0).toUpperCase() + role.slice(1).replace("_", " "),
          }))}
          {...form.getInputProps("role")}
        />
        <Button fullWidth mt="xl" type="submit" loading={loading}>
          Create User
        </Button>
      </form>
    </Modal>
  );
}

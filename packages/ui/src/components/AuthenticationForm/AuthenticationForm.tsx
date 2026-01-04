import {
  TextInput,
  PasswordInput,
  Checkbox,
  Paper,
  Group,
  Button,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useTranslation } from "react-i18next";
import { LoginCredentials } from "@domas/ts-types";

interface AuthenticationFormProps {
  onSubmit: (values: LoginCredentials) => void;
  isLoading?: boolean;
}

export function AuthenticationForm({
  onSubmit,
  isLoading,
}: AuthenticationFormProps) {
  const { t } = useTranslation();
  const form = useForm({
    initialValues: {
      email: "",
      password: "",
    },
    validate: {
      email: (val) => {
        if (!val) return t("field_required");
        return /^\S+@\S+$/.test(val) ? null : t("invalid_email");
      },
      password: (val) => {
        if (!val) return t("field_required");
        return val.length <= 6 ? t("password_too_short") : null;
      },
    },
  });

  return (
    <Paper withBorder shadow="md" p={30} radius="md" w={450}>
      <form onSubmit={form.onSubmit(onSubmit)}>
        <TextInput
          label={t("email")}
          placeholder="you@example.com"
          withAsterisk
          {...form.getInputProps("email")}
        />
        <PasswordInput
          label={t("password")}
          placeholder={t("password")}
          withAsterisk
          mt="md"
          {...form.getInputProps("password")}
        />
        <Group justify="space-between" mt="lg">
          <Checkbox label={t("remember_me")} />
        </Group>
        <Button fullWidth mt="xl" type="submit" loading={isLoading}>
          {t("sign_in")}
        </Button>
      </form>
    </Paper>
  );
}

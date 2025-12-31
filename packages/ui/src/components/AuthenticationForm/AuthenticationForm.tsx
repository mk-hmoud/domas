import {
  TextInput,
  PasswordInput,
  Checkbox,
  Anchor,
  Paper,
  Group,
  Button,
} from "@mantine/core";
import { useTranslation } from "react-i18next";

export function AuthenticationForm() {
  const { t } = useTranslation();

  return (
    <Paper withBorder shadow="md" p={30} mt={30} radius="md">
      <TextInput label={t("email")} placeholder="you@example.com" required />
      <PasswordInput
        label={t("password")}
        placeholder={t("your_password")}
        required
        mt="md"
      />
      <Group justify="space-between" mt="lg">
        <Checkbox label={t("remember_me")} />
        <Anchor component="button" size="sm">
          {t("forgot_password")}
        </Anchor>
      </Group>
      <Button fullWidth mt="xl">
        {t("sign_in")}
      </Button>
    </Paper>
  );
}

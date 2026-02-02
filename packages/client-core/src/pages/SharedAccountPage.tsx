import { useState, useEffect } from "react";
import {
  Container,
  Title,
  Paper,
  TextInput,
  Button,
  Group,
  Stack,
  PasswordInput,
  Grid,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useTranslation } from "react-i18next";
import { notifications } from "@mantine/notifications";
import { account } from "@domas/api-client";
import { UpdateProfileDto, ChangePasswordDto } from "@domas/ts-types";

export function SharedAccountPage() {
  const { t } = useTranslation();
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);

  const profileForm = useForm({
    initialValues: {
      firstName: "",
      lastName: "",
      phoneNumber: "",
      email: "", // Read-only
    },
  });

  const passwordForm = useForm({
    initialValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
    validate: {
      newPassword: (val) => (val.length < 6 ? t("password_too_short") : null),
      confirmNewPassword: (val, values) =>
        val !== values.newPassword ? t("passwords_do_not_match") : null,
    },
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const user = await account.getProfile();
        profileForm.setValues({
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          phoneNumber: user.phoneNumber || "",
          email: user.email,
        });
      } catch (error) {
        // Handle load error
      }
    };
    loadProfile();
  }, []);

  const handleUpdateProfile = async (values: typeof profileForm.values) => {
    setLoadingProfile(true);
    try {
      const payload: UpdateProfileDto = {
        firstName: values.firstName,
        lastName: values.lastName,
        phoneNumber: values.phoneNumber,
      };
      await account.updateProfile(payload);
      notifications.show({
        title: t("success"),
        message: t("profile_updated"),
        color: "green",
      });
    } catch (error) {
      notifications.show({
        title: t("error"),
        message: t("failed_to_update_profile"),
        color: "red",
      });
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleChangePassword = async (values: typeof passwordForm.values) => {
    setLoadingPassword(true);
    try {
      const payload: ChangePasswordDto = {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      };
      await account.changePassword(payload);
      notifications.show({
        title: t("success"),
        message: t("password_updated"),
        color: "green",
      });
      passwordForm.reset();
    } catch (error) {
      notifications.show({
        title: t("error"),
        message: t("failed_to_change_password"),
        color: "red",
      });
    } finally {
      setLoadingPassword(false);
    }
  };

  return (
    <Container size="md" py="xl">
      <Title order={2} mb="lg">
        {t("account_settings")}
      </Title>

      <Grid>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper withBorder p="md" radius="md">
            <Title order={4} mb="md">
              {t("profile")}
            </Title>
            <form onSubmit={profileForm.onSubmit(handleUpdateProfile)}>
              <Stack>
                <TextInput
                  label={t("email")}
                  disabled
                  {...profileForm.getInputProps("email")}
                />
                <Group grow>
                  <TextInput
                    label={t("first_name")}
                    {...profileForm.getInputProps("firstName")}
                  />
                  <TextInput
                    label={t("last_name")}
                    {...profileForm.getInputProps("lastName")}
                  />
                </Group>
                <TextInput
                  label={t("phone_number")}
                  {...profileForm.getInputProps("phoneNumber")}
                />
                <Group justify="flex-end">
                  <Button type="submit" loading={loadingProfile}>
                    {t("save_changes")}
                  </Button>
                </Group>
              </Stack>
            </form>
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper withBorder p="md" radius="md">
            <Title order={4} mb="md">
              {t("change_password")}
            </Title>
            <form onSubmit={passwordForm.onSubmit(handleChangePassword)}>
              <Stack>
                <PasswordInput
                  label={t("current_password")}
                  required
                  {...passwordForm.getInputProps("currentPassword")}
                />
                <PasswordInput
                  label={t("new_password")}
                  required
                  {...passwordForm.getInputProps("newPassword")}
                />
                <PasswordInput
                  label={t("confirm_new_password")}
                  required
                  {...passwordForm.getInputProps("confirmNewPassword")}
                />
                <Group justify="flex-end">
                  <Button type="submit" loading={loadingPassword}>
                    {t("change_password")}
                  </Button>
                </Group>
              </Stack>
            </form>
          </Paper>
        </Grid.Col>
      </Grid>
    </Container>
  );
}

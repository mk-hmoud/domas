import { useState, ReactNode } from "react";
import { Center, Group, Box, Container, Title, Stack } from "@mantine/core";
import { AuthenticationForm, ThemeToggle, LanguageSwitcher } from "@domas/ui";
import { LoginCredentials } from "@domas/ts-types";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { notifications } from "@mantine/notifications";

interface SharedLoginPageProps {
  title: string;
  redirectPath?: string;
  logo?: ReactNode;
}

export function SharedLoginPage({
  title,
  redirectPath = "/dashboard",
  logo,
}: SharedLoginPageProps) {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = async (values: LoginCredentials) => {
    setLoading(true);
    try {
      await login(values);
      navigate(redirectPath);
    } catch (error) {
      console.error(error);
      notifications.show({
        title: t("error"),
        message: t("login_failed"),
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Box pos="absolute" top={20} right={20}>
        <Group>
          <LanguageSwitcher />
          <ThemeToggle />
        </Group>
      </Box>
      <Center h="100vh">
        <Container size={450}>
          <Stack align="center" gap="lg">
            {logo && <Box mb="md">{logo}</Box>}
            <Title ta="center">{title}</Title>
            <AuthenticationForm onSubmit={handleSubmit} isLoading={loading} />
          </Stack>
        </Container>
      </Center>
    </>
  );
}

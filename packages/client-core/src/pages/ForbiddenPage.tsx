import { Container, Title, Text, Button, Group, Center } from "@mantine/core";
import { IconLock } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function ForbiddenPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <Container className="h-screen flex items-center justify-center">
      <Center h="100vh">
        <div style={{ textAlign: "center" }}>
          <IconLock
            size={80}
            stroke={1.5}
            color="var(--mantine-color-dimmed)"
          />
          <Title order={1} mt="xl">
            403
          </Title>
          <Text c="dimmed" size="lg" ta="center" mt="sm">
            {t("forbidden_title")}
          </Text>
          <Text c="dimmed" size="md" ta="center" mt="xs" mb="xl">
            {t("forbidden_message")}
          </Text>
          <Group justify="center">
            <Button
              variant="subtle"
              size="md"
              onClick={() => navigate("/dashboard")}
            >
              {t("go_to_dashboard")}
            </Button>
          </Group>
        </div>
      </Center>
    </Container>
  );
}

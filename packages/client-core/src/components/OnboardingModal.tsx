import { useState } from "react";
import {
  Modal,
  Stepper,
  Button,
  Group,
  Text,
  Title,
  Stack,
  ThemeIcon,
  SimpleGrid,
  Box,
  useMantineTheme,
} from "@mantine/core";
import {
  IconBuildingSkyscraper,
  IconDoorEnter,
  IconAddressBook,
  IconArchive,
  IconSettings,
  IconCheck,
  IconRocket,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";

const STEPS = ["welcome", "features", "done"] as const;

function WelcomeStep() {
  const { t } = useTranslation();
  return (
    <Stack align="center" gap="md" py="xl">
      <ThemeIcon size={64} radius="xl" variant="light" color="indigo">
        <IconBuildingSkyscraper size={36} stroke={1.5} />
      </ThemeIcon>
      <Title order={2} ta="center">
        {t("onboarding.welcome.title")}
      </Title>
      <Text c="dimmed" ta="center" maw={420}>
        {t("onboarding.welcome.description")}
      </Text>
    </Stack>
  );
}

interface Feature {
  icon: React.FC<{ size?: number; stroke?: number }>;
  labelKey: string;
  descKey: string;
}

const FEATURES: Feature[] = [
  {
    icon: IconDoorEnter,
    labelKey: "onboarding.features.operations.label",
    descKey: "onboarding.features.operations.desc",
  },
  {
    icon: IconAddressBook,
    labelKey: "onboarding.features.registry.label",
    descKey: "onboarding.features.registry.desc",
  },
  {
    icon: IconArchive,
    labelKey: "onboarding.features.inventory.label",
    descKey: "onboarding.features.inventory.desc",
  },
  {
    icon: IconSettings,
    labelKey: "onboarding.features.management.label",
    descKey: "onboarding.features.management.desc",
  },
];

function FeaturesStep() {
  const { t } = useTranslation();
  const theme = useMantineTheme();
  return (
    <Stack gap="md" py="sm">
      <Text c="dimmed" ta="center">
        {t("onboarding.features.intro")}
      </Text>
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        {FEATURES.map(({ icon: Icon, labelKey, descKey }) => (
          <Box
            key={labelKey}
            p="md"
            style={{
              borderRadius: theme.radius.md,
              border: `1px solid var(--mantine-color-default-border)`,
            }}
          >
            <Group gap="sm" mb={4}>
              <ThemeIcon size={32} radius="md" variant="light" color="indigo">
                <Icon size={18} stroke={1.5} />
              </ThemeIcon>
              <Text fw={600} size="sm">
                {t(labelKey)}
              </Text>
            </Group>
            <Text size="sm" c="dimmed">
              {t(descKey)}
            </Text>
          </Box>
        ))}
      </SimpleGrid>
    </Stack>
  );
}

function DoneStep() {
  const { t } = useTranslation();
  return (
    <Stack align="center" gap="md" py="xl">
      <ThemeIcon size={64} radius="xl" variant="light" color="green">
        <IconRocket size={36} stroke={1.5} />
      </ThemeIcon>
      <Title order={2} ta="center">
        {t("onboarding.done.title")}
      </Title>
      <Text c="dimmed" ta="center" maw={420}>
        {t("onboarding.done.description")}
      </Text>
    </Stack>
  );
}

const STEP_COMPONENTS = [WelcomeStep, FeaturesStep, DoneStep];

export function OnboardingModal() {
  const { t } = useTranslation();
  const { onboardingNeeded, completeOnboarding } = useAuth();
  const [active, setActive] = useState(0);
  const [completing, setCompleting] = useState(false);

  const isLast = active === STEPS.length - 1;

  const handleNext = async () => {
    if (isLast) {
      setCompleting(true);
      try {
        await completeOnboarding();
      } finally {
        setCompleting(false);
      }
      return;
    }
    setActive((s) => s + 1);
  };

  const handleSkip = async () => {
    setCompleting(true);
    try {
      await completeOnboarding();
    } finally {
      setCompleting(false);
    }
  };

  const StepContent = STEP_COMPONENTS[active];

  return (
    <Modal
      opened={onboardingNeeded}
      onClose={() => {}}
      withCloseButton={false}
      closeOnClickOutside={false}
      closeOnEscape={false}
      size="lg"
      centered
      title={
        <Group justify="space-between" w="100%">
          <Text fw={600}>{t("onboarding.modal_title")}</Text>
          <Button
            variant="subtle"
            size="xs"
            color="gray"
            onClick={handleSkip}
            loading={completing}
          >
            {t("onboarding.skip")}
          </Button>
        </Group>
      }
      styles={{ title: { width: "100%" } }}
    >
      <Stack gap="lg">
        <Stepper active={active} size="sm" allowNextStepsSelect={false}>
          {STEPS.map((step) => (
            <Stepper.Step
              key={step}
              label={t(`onboarding.steps.${step}`)}
              completedIcon={<IconCheck size={14} />}
            />
          ))}
        </Stepper>

        <StepContent />

        <Group justify="flex-end">
          {active > 0 && (
            <Button
              variant="subtle"
              onClick={() => setActive((s) => s - 1)}
              disabled={completing}
            >
              {t("onboarding.back")}
            </Button>
          )}
          <Button
            onClick={handleNext}
            loading={completing}
            color={isLast ? "green" : "indigo"}
          >
            {isLast ? t("onboarding.finish") : t("onboarding.next")}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

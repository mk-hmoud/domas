import {
  Affix,
  Transition,
  Paper,
  Group,
  Text,
  Button,
  ActionIcon,
  Divider,
  Badge,
  rem,
} from "@mantine/core";
import { IconCheck, IconX } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

interface BulkActionsBarProps {
  selectedCount: number;
  onAccept: () => void;
  onReject: () => void;
  onClear: () => void;
}

export function BulkActionsBar({
  selectedCount,
  onAccept,
  onReject,
  onClear,
}: BulkActionsBarProps) {
  const { t } = useTranslation();

  return (
    <Affix position={{ bottom: 40, left: "50%" }} zIndex={100}>
      <Transition transition="slide-up" mounted={selectedCount > 0}>
        {(styles) => (
          <Paper
            style={{
              ...styles,
              transform: `${styles.transform} translateX(-50%)`,
              backgroundColor: "#1A1B1E",
              color: "white",
              border: "1px solid #373A40",
            }}
            shadow="xl"
            radius="xl"
            p="xs"
            px="md"
          >
            <Group gap="md">
              <Group gap="xs">
                <Badge
                  size="lg"
                  circle
                  variant="filled"
                  color="blue"
                  style={{
                    width: 24,
                    height: 24,
                    padding: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {selectedCount}
                </Badge>
                <Text size="sm" fw={500}>
                  {t("selected", { defaultValue: "Selected" })}
                </Text>
              </Group>

              <Divider orientation="vertical" color="gray.7" />

              <Group gap={2}>
                <Button
                  variant="subtle"
                  color="green"
                  size="xs"
                  onClick={onAccept}
                  c="green.4"
                >
                  <IconCheck
                    style={{ width: rem(14), height: rem(14), marginRight: 6 }}
                  />
                  {t("accept")}
                </Button>
                <Button
                  variant="subtle"
                  color="red"
                  size="xs"
                  onClick={onReject}
                  c="red.4"
                >
                  <IconX
                    style={{ width: rem(14), height: rem(14), marginRight: 6 }}
                  />
                  {t("reject")}
                </Button>
              </Group>

              <Divider orientation="vertical" color="gray.7" />

              <ActionIcon
                variant="transparent"
                color="gray"
                onClick={onClear}
                c="white"
              >
                <IconX style={{ width: rem(18), height: rem(18) }} />
              </ActionIcon>
            </Group>
          </Paper>
        )}
      </Transition>
    </Affix>
  );
}

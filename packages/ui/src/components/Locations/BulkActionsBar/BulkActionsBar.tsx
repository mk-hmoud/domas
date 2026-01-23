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
import { IconTrash, IconEdit, IconCopy, IconX } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

interface BulkActionsBarProps {
  selectedCount: number;
  onDelete: () => void;
  onDuplicate?: () => void;
  onEdit?: () => void;
  onClear: () => void;
}

export function BulkActionsBar({
  selectedCount,
  onDelete,
  onDuplicate,
  onEdit,
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
              backgroundColor: "#1A1B1E", // Dark background hardcoded for contrast or use variable if reliable
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
                {onEdit && (
                  <Button
                    variant="subtle"
                    color="gray"
                    size="xs"
                    onClick={onEdit}
                    c="white"
                  >
                    <IconEdit
                      style={{
                        width: rem(14),
                        height: rem(14),
                        marginRight: 6,
                      }}
                    />
                    {t("edit")}
                  </Button>
                )}
                {onDuplicate && (
                  <Button
                    variant="subtle"
                    color="gray"
                    size="xs"
                    onClick={onDuplicate}
                    c="white"
                  >
                    <IconCopy
                      style={{
                        width: rem(14),
                        height: rem(14),
                        marginRight: 6,
                      }}
                    />
                    {t("duplicate", { defaultValue: "Duplicate" })}
                  </Button>
                )}
                <Button
                  variant="subtle"
                  color="red"
                  size="xs"
                  onClick={onDelete}
                  c="red.4"
                >
                  <IconTrash
                    style={{ width: rem(14), height: rem(14), marginRight: 6 }}
                  />
                  {t("delete")}
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

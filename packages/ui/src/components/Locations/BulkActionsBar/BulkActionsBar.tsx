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
  Tooltip,
} from "@mantine/core";
import {
  IconTrash,
  IconEdit,
  IconCopy,
  IconX,
  IconCheck,
  IconUserOff,
  IconEye,
  IconFiles,
  IconMail,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

interface BulkActionsBarProps {
  selectedCount: number;
  onDelete: () => void;
  onDuplicate?: () => void;
  onEdit?: () => void;
  onActivate?: () => void;
  onDeactivate?: () => void;
  onApplyTemplate?: () => void;
  onSendEmail?: () => void;
  onClear: () => void;
  onShowSelection?: () => void;
}

export function BulkActionsBar({
  selectedCount,
  onDelete,
  onDuplicate,
  onEdit,
  onActivate,
  onDeactivate,
  onApplyTemplate,
  onSendEmail,
  onClear,
  onShowSelection,
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
                {onShowSelection && (
                  <Tooltip
                    label={t("view_selection", {
                      defaultValue: "View Selection",
                    })}
                  >
                    <ActionIcon
                      variant="transparent"
                      color="gray"
                      size="sm"
                      onClick={onShowSelection}
                      c="gray.5"
                    >
                      <IconEye style={{ width: rem(16), height: rem(16) }} />
                    </ActionIcon>
                  </Tooltip>
                )}
              </Group>

              <Divider orientation="vertical" color="gray.7" />

              <Group gap={2}>
                {onActivate && (
                  <Button
                    variant="subtle"
                    color="green"
                    size="xs"
                    onClick={onActivate}
                    c="green.4"
                  >
                    <IconCheck
                      style={{
                        width: rem(14),
                        height: rem(14),
                        marginRight: 6,
                      }}
                    />
                    {t("active")}
                  </Button>
                )}
                {onDeactivate && (
                  <Button
                    variant="subtle"
                    color="orange"
                    size="xs"
                    onClick={onDeactivate}
                    c="orange.4"
                  >
                    <IconUserOff
                      style={{
                        width: rem(14),
                        height: rem(14),
                        marginRight: 6,
                      }}
                    />
                    {t("inactive")}
                  </Button>
                )}
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
                {onApplyTemplate && (
                  <Button
                    variant="subtle"
                    color="blue"
                    size="xs"
                    onClick={onApplyTemplate}
                    c="blue.3"
                  >
                    <IconFiles
                      style={{
                        width: rem(14),
                        height: rem(14),
                        marginRight: 6,
                      }}
                    />
                    {t("apply_blueprint", { defaultValue: "Apply Blueprint" })}
                  </Button>
                )}
                {onSendEmail && (
                  <Button
                    variant="subtle"
                    color="blue"
                    size="xs"
                    onClick={onSendEmail}
                    c="blue.3"
                  >
                    <IconMail
                      style={{
                        width: rem(14),
                        height: rem(14),
                        marginRight: 6,
                      }}
                    />
                    {t("send_email", { defaultValue: "Send Email" })}
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

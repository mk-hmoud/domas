import {
  Modal,
  Button,
  Group,
  Text,
  Stack,
  Badge,
  Alert,
  ScrollArea,
  ThemeIcon,
} from "@mantine/core";
import { IconArrowDown, IconMapPin } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { LocationIcon } from "../LocationIcon";
import { LocationType } from "@domas/ts-types";

export interface FlagChange {
  label: string;
  from: any;
  to: any;
}

interface FlagCascadeConfirmModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirmCascade: () => void;
  onConfirmSingleOnly: () => void;
  locationName: string;
  flagChanges: FlagChange[];
  descendantCount: { locations: number; beds: number };
  descendantPreview?: {
    id: number;
    name: string;
    nameTr?: string;
    type: string;
  }[];
  loading?: boolean;
  isTr?: boolean;
}

export function FlagCascadeConfirmModal({
  opened,
  onClose,
  onConfirmCascade,
  onConfirmSingleOnly,
  locationName,
  flagChanges,
  descendantCount,
  descendantPreview = [],
  loading,
  isTr,
}: FlagCascadeConfirmModalProps) {
  const { t } = useTranslation();
  const totalDescendants = descendantCount.locations + descendantCount.beds;
  const hiddenLocations = Math.max(
    0,
    descendantCount.locations - descendantPreview.length,
  );

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={t("flag_cascade_title", "Apply changes to sub-locations?")}
      size="md"
    >
      <Stack gap="md">
        <Text size="sm">
          {t("flag_cascade_intro", {
            defaultValue: 'You changed flags on "{{name}}".',
            name: locationName,
          })}
        </Text>

        {/* Flag change summary */}
        <Stack gap="xs">
          {flagChanges.map((change) => (
            <Group key={change.label} gap="xs">
              <Text size="sm" fw={600} style={{ minWidth: 150 }}>
                {change.label}:
              </Text>
              <Badge color="gray" variant="light" size="sm">
                {String(change.from ?? "—")}
              </Badge>
              <Text size="xs" c="dimmed">
                →
              </Text>
              <Badge color="blue" variant="light" size="sm">
                {String(change.to ?? "—")}
              </Badge>
            </Group>
          ))}
        </Stack>

        {/* Affected nodes */}
        {totalDescendants > 0 ? (
          <Alert
            color="orange"
            variant="light"
            icon={<IconArrowDown size={14} />}
            p="sm"
          >
            <Text size="xs" fw={600} mb="xs">
              {t("flag_cascade_affected", "Affected locations:")}
            </Text>
            <ScrollArea.Autosize mah={160}>
              <Stack gap={4}>
                {descendantPreview.map((d) => (
                  <Group key={d.id} gap="xs" wrap="nowrap">
                    <ThemeIcon size="xs" variant="transparent" color="orange">
                      <LocationIcon type={d.type as LocationType} size={12} />
                    </ThemeIcon>
                    <Text size="xs" lineClamp={1} style={{ flex: 1 }}>
                      {isTr && d.nameTr ? d.nameTr : d.name}
                    </Text>
                    <Badge size="xs" variant="outline" color="orange">
                      {d.type}
                    </Badge>
                  </Group>
                ))}
                {hiddenLocations > 0 && (
                  <Text size="xs" c="dimmed" fs="italic">
                    {t("flag_cascade_more_locations", {
                      defaultValue: "...and {{count}} more locations",
                      count: hiddenLocations,
                    })}
                  </Text>
                )}
                {descendantCount.beds > 0 && (
                  <Text size="xs" c="dimmed">
                    {t("flag_cascade_more_beds", {
                      defaultValue: "+ {{count}} beds",
                      count: descendantCount.beds,
                    })}
                  </Text>
                )}
              </Stack>
            </ScrollArea.Autosize>
          </Alert>
        ) : (
          <Alert
            color="blue"
            variant="light"
            icon={<IconMapPin size={14} />}
            p="sm"
          >
            <Text size="xs">
              {t(
                "flag_cascade_no_descendants",
                "No sub-locations will be affected.",
              )}
            </Text>
          </Alert>
        )}

        <Group justify="flex-end" gap="xs">
          <Button variant="default" onClick={onClose} disabled={loading}>
            {t("cancel")}
          </Button>
          {totalDescendants > 0 && (
            <Button
              variant="light"
              onClick={onConfirmSingleOnly}
              loading={loading}
            >
              {t("flag_cascade_this_only", "This location only")}
            </Button>
          )}
          <Button
            onClick={onConfirmCascade}
            loading={loading}
            color={totalDescendants > 0 ? "orange" : "blue"}
          >
            {totalDescendants > 0
              ? t("flag_cascade_apply_all", {
                  defaultValue: "Apply to all ({{total}})",
                  total: totalDescendants + 1,
                })
              : t("confirm")}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

import { Alert, Group, Badge, Text, Tooltip } from "@mantine/core";
import { IconArrowDown } from "@tabler/icons-react";
import { AncestorFlagsResult } from "@domas/ts-types";
import { useTranslation } from "react-i18next";

interface OwnFlags {
  isTrOnly?: boolean;
  isForeignerOnly?: boolean;
  isGuestZone?: boolean;
  isRectorate?: boolean;
  genderLock?: string | null;
  studentYearLock?: string | null;
}

interface FlagInheritancePanelProps {
  ancestorFlags: AncestorFlagsResult;
  ownFlags?: OwnFlags;
}

export function FlagInheritancePanel({
  ancestorFlags,
  ownFlags,
}: FlagInheritancePanelProps) {
  const { t } = useTranslation();

  const items: { label: string; source: string; isOverride: boolean }[] = [];

  if (ancestorFlags.isTrOnly) {
    const isOverride = ownFlags?.isTrOnly === false;
    items.push({
      label: t("is_tr_only", "TR Only"),
      source: ancestorFlags.isTrOnly.sourceName,
      isOverride,
    });
  }
  if (ancestorFlags.isForeignerOnly) {
    const isOverride = ownFlags?.isForeignerOnly === false;
    items.push({
      label: t("is_foreigner_only", "INT Only"),
      source: ancestorFlags.isForeignerOnly.sourceName,
      isOverride,
    });
  }
  if (ancestorFlags.isGuestZone) {
    const isOverride = ownFlags?.isGuestZone === false;
    items.push({
      label: t("is_guest_zone_label", "Guest Zone"),
      source: ancestorFlags.isGuestZone.sourceName,
      isOverride,
    });
  }
  if (ancestorFlags.isRectorate) {
    const isOverride = ownFlags?.isRectorate === false;
    items.push({
      label: t("rectorate", "Rectorate"),
      source: ancestorFlags.isRectorate.sourceName,
      isOverride,
    });
  }
  if (ancestorFlags.genderLock) {
    items.push({
      label: `${t("gender_lock_label", "Gender")}: ${ancestorFlags.genderLock.value}`,
      source: ancestorFlags.genderLock.sourceName,
      isOverride: false,
    });
  }
  if (ancestorFlags.studentYearLock) {
    items.push({
      label: `${t("student_year_lock_label", "Year")}: ${ancestorFlags.studentYearLock.value}`,
      source: ancestorFlags.studentYearLock.sourceName,
      isOverride: false,
    });
  }

  if (items.length === 0) return null;

  const hasOverrides = items.some((i) => i.isOverride);

  return (
    <Alert
      mt="sm"
      color={hasOverrides ? "orange" : "blue"}
      variant="light"
      icon={<IconArrowDown size={14} />}
      p="xs"
    >
      <Text size="xs" fw={600} mb={4}>
        {hasOverrides
          ? t(
              "flag_override_warning",
              "Some ancestor flags are overridden on this node",
            )
          : t("flags_from_ancestors", "Flags inherited from ancestors:")}
      </Text>
      <Group gap="xs" wrap="wrap">
        {items.map((item) => (
          <Tooltip key={item.label} label={`From: ${item.source}`}>
            <Badge
              size="xs"
              variant={item.isOverride ? "filled" : "outline"}
              color={item.isOverride ? "orange" : "blue"}
            >
              {item.isOverride ? `⚠ ${item.label} (overridden)` : item.label}
            </Badge>
          </Tooltip>
        ))}
      </Group>
    </Alert>
  );
}

import {
  Group,
  TextInput,
  Select,
  Checkbox,
  Stack,
  Button,
  Collapse,
  Paper,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconSearch,
  IconX,
  IconAdjustmentsHorizontal,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import {
  LocationType,
  GenderType,
  LocationOwnership,
  BedStatus,
} from "@domas/ts-types";

interface LocationRegistryFiltersProps {
  filters: any;
  onFilterChange: (key: string, value: any) => void;
  onClearFilters: () => void;
}

export function LocationRegistryFilters({
  filters,
  onFilterChange,
  onClearFilters,
}: LocationRegistryFiltersProps) {
  const { t } = useTranslation();
  const [opened, { toggle }] = useDisclosure(false);

  return (
    <Stack gap="sm">
      <Group justify="space-between">
        <TextInput
          placeholder={t("search_by_name", "Search by name...")}
          leftSection={<IconSearch size={16} />}
          value={filters.q || ""}
          onChange={(e) => onFilterChange("q", e.currentTarget.value)}
          style={{ flex: 1 }}
        />
        <Group gap="xs">
          <Button
            variant={opened ? "filled" : "light"}
            leftSection={<IconAdjustmentsHorizontal size={16} />}
            onClick={toggle}
          >
            {t("filters", "Filters")}
          </Button>
          {(filters.type ||
            filters.genderLock ||
            filters.isTrOnly ||
            filters.isForeignerOnly ||
            filters.isGuestZone ||
            filters.ownership ||
            filters.onlyVacant ||
            filters.status) && (
            <Button
              variant="subtle"
              color="gray"
              leftSection={<IconX size={16} />}
              onClick={onClearFilters}
            >
              {t("clear", "Clear")}
            </Button>
          )}
        </Group>
      </Group>

      <Collapse in={opened}>
        <Paper withBorder p="md" radius="md">
          <Group align="flex-end">
            <Select
              label={t("type", "Type")}
              placeholder={t("all", "All")}
              data={Object.values(LocationType).map((type) => ({
                value: type,
                label: t(`location_type.${type}`, type),
              }))}
              value={filters.type || null}
              onChange={(val) => onFilterChange("type", val)}
              clearable
              style={{ width: 150 }}
            />

            <Select
              label={t("bed_status_filter", "Bed Status")}
              placeholder={t("all", "All")}
              data={Object.values(BedStatus).map((s) => ({
                value: s,
                label: t(`bed_status.${s}`, s),
              }))}
              value={filters.status || null}
              onChange={(val) => onFilterChange("status", val)}
              clearable
              style={{ width: 150 }}
            />

            <Select
              label={t("gender_lock", "Gender Lock")}
              placeholder={t("all", "All")}
              data={Object.values(GenderType).map((type) => ({
                value: type,
                label: t(`gender.${type}`, type),
              }))}
              value={filters.genderLock || null}
              onChange={(val) => onFilterChange("genderLock", val)}
              clearable
              style={{ width: 150 }}
            />

            <Select
              label={t("ownership", "Ownership")}
              placeholder={t("all", "All")}
              data={Object.values(LocationOwnership).map((type) => ({
                value: type,
                label: t(`ownerships.${type}`, type),
              }))}
              value={filters.ownership || null}
              onChange={(val) => onFilterChange("ownership", val)}
              clearable
              style={{ width: 150 }}
            />

            <Stack gap={0}>
              <Checkbox
                label={t("tr_only", "TR Only")}
                checked={filters.isTrOnly === true}
                onChange={(e) =>
                  onFilterChange("isTrOnly", e.currentTarget.checked)
                }
                mb="xs"
              />
              <Checkbox
                label={t("foreigner_only", "INT Only")}
                checked={filters.isForeignerOnly === true}
                onChange={(e) =>
                  onFilterChange("isForeignerOnly", e.currentTarget.checked)
                }
                mb="xs"
              />
              <Checkbox
                label={t("guest_zone", "Guest Zone")}
                checked={filters.isGuestZone === true}
                onChange={(e) =>
                  onFilterChange("isGuestZone", e.currentTarget.checked)
                }
              />
            </Stack>

            <Checkbox
              label={t("only_vacant", "Only Vacant")}
              checked={filters.onlyVacant === true}
              onChange={(e) =>
                onFilterChange("onlyVacant", e.currentTarget.checked)
              }
              ml="md"
            />
          </Group>
        </Paper>
      </Collapse>
    </Stack>
  );
}

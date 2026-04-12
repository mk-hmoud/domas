import {
  Table,
  Badge,
  Group,
  Text,
  Tooltip,
  Progress,
  Stack,
  Checkbox,
  Button,
} from "@mantine/core";
import { IconHierarchy, IconMail } from "@tabler/icons-react";
import { Location, GenderType, Bed } from "@domas/ts-types";
import { useTranslation } from "react-i18next";
import { LocationIcon } from "../LocationIcon";

interface LocationRegistryTableProps {
  data: (Location | Bed)[];
  onView: (item: any) => void;
  onEmailResidents?: (locationId: number) => void;
  selectedIds: (number | string)[];
  onToggleSelection: (id: number | string) => void;
  onToggleSelectAll: () => void;
}

export function LocationRegistryTable({
  data,
  onView,
  onEmailResidents,
  selectedIds,
  onToggleSelection,
  onToggleSelectAll,
}: LocationRegistryTableProps) {
  const { t } = useTranslation();

  const getGenderColor = (gender?: GenderType) => {
    switch (gender) {
      case GenderType.MALE:
        return "blue";
      case GenderType.FEMALE:
        return "pink";
      default:
        return "gray";
    }
  };

  const getBedStatusColor = (status?: string) => {
    switch (status) {
      case "available":
        return "green";
      case "occupied":
        return "blue";
      case "maintenance":
        return "orange";
      default:
        return "gray";
    }
  };

  const allSelected =
    data.length > 0 &&
    data.every((item) => {
      const globalId =
        item.type === "bed" ? `bed-${item.id}` : `loc-${item.id}`;
      return (selectedIds as any[]).includes(globalId);
    });
  const someSelected =
    data.some((item) => {
      const globalId =
        item.type === "bed" ? `bed-${item.id}` : `loc-${item.id}`;
      return (selectedIds as any[]).includes(globalId);
    }) && !allSelected;

  const rows = data.map((item: any) => {
    const total = item.totalBeds || 0;
    const occupied = item.occupiedBeds || 0;
    const occupancyRate = total > 0 ? (occupied / total) * 100 : 0;
    const isBed = item.type === "bed";
    const globalId = isBed ? `bed-${item.id}` : `loc-${item.id}`;

    return (
      <Table.Tr
        key={globalId}
        style={{ cursor: "pointer" }}
        onClick={() => onView(item)}
      >
        <Table.Td onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={selectedIds.includes(globalId)}
            onChange={() => onToggleSelection(globalId)}
          />
        </Table.Td>
        <Table.Td>
          <Group gap="sm">
            <LocationIcon type={item.type as any} />
            <Stack gap={0}>
              <Text size="sm" fw={500}>
                {isBed ? `${item.locationName} - ${item.label}` : item.name}
              </Text>
              {item.locationPath && (
                <Text size="xs" c="dimmed">
                  {item.locationPath}
                </Text>
              )}
            </Stack>
          </Group>
        </Table.Td>
        <Table.Td>
          <Text size="sm" fw={500}>
            {item.residentName ||
              (isBed && item.status === "available" ? "-" : "")}
          </Text>
        </Table.Td>
        <Table.Td>
          <Group gap={4}>
            {item.genderLock && (
              <Badge color={getGenderColor(item.genderLock)} variant="dot">
                {t(`gender.${item.genderLock}`)}
              </Badge>
            )}
            {item.isTrOnly && (
              <Badge color="red" variant="outline" size="xs">
                TR
              </Badge>
            )}
            {item.isForeignerOnly && (
              <Badge color="grape" variant="outline" size="xs">
                INT
              </Badge>
            )}
            {item.isGuestZone && (
              <Badge color="orange" variant="outline" size="xs">
                Guest
              </Badge>
            )}
          </Group>
        </Table.Td>
        <Table.Td>
          {isBed ? (
            <Badge color={getBedStatusColor(item.status)} variant="light">
              {item.status
                ? t(`bed_status.${item.status}`, { defaultValue: item.status })
                : "-"}
            </Badge>
          ) : total > 0 ? (
            <Stack gap={4} style={{ width: 120 }}>
              <Group justify="space-between">
                <Text size="xs" c="dimmed">
                  {occupied}/{total}
                </Text>
                <Text
                  size="xs"
                  fw={700}
                  c={occupancyRate === 100 ? "red" : "blue"}
                >
                  {Math.round(occupancyRate)}%
                </Text>
              </Group>
              <Progress
                value={occupancyRate}
                size="xs"
                color={occupancyRate === 100 ? "red" : "blue"}
                radius="xl"
              />
            </Stack>
          ) : (
            <Text size="xs" c="dimmed">
              -
            </Text>
          )}
        </Table.Td>
        <Table.Td onClick={(e) => e.stopPropagation()}>
          <Group gap={4} justify="flex-end">
            {!isBed && onEmailResidents && (
              <Tooltip
                label={t("email_residents", {
                  defaultValue: "Email Residents",
                })}
              >
                <Button
                  variant="subtle"
                  size="compact-xs"
                  color="blue"
                  leftSection={<IconMail size={14} />}
                  onClick={() => onEmailResidents(item.id as number)}
                >
                  {t("email_verb", { defaultValue: "Email" })}
                </Button>
              </Tooltip>
            )}
            <Tooltip
              label={t("locate_in_structure", {
                defaultValue: "Locate in Structure",
              })}
            >
              <Button
                variant="subtle"
                size="compact-xs"
                leftSection={<IconHierarchy size={14} />}
                onClick={() => onView(item)}
              >
                {t("view")}
              </Button>
            </Tooltip>
          </Group>
        </Table.Td>
      </Table.Tr>
    );
  });

  return (
    <Table striped highlightOnHover>
      <Table.Thead>
        <Table.Tr>
          <Table.Th style={{ width: 40 }}>
            <Checkbox
              checked={allSelected}
              indeterminate={someSelected}
              onChange={onToggleSelectAll}
            />
          </Table.Th>
          <Table.Th>{t("name")}</Table.Th>
          <Table.Th>{t("resident", "Resident")}</Table.Th>
          <Table.Th>{t("policies")}</Table.Th>
          <Table.Th>{t("status_occupancy", "Status / Occupancy")}</Table.Th>
          <Table.Th />
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {rows}
        {data.length === 0 && (
          <Table.Tr>
            <Table.Td colSpan={6}>
              <Text ta="center" c="dimmed" py="xl">
                {t("no_records_found", "No records found")}
              </Text>
            </Table.Td>
          </Table.Tr>
        )}
      </Table.Tbody>
    </Table>
  );
}

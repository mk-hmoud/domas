import { Group, Select, TextInput } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

export type RoomPlanStatusFilter = "all" | "vacant" | "full" | "maintenance";
export type RoomPlanGenderFilter = "all" | "male" | "female";

export interface RoomPlanFiltersValue {
  gender: RoomPlanGenderFilter;
  status: RoomPlanStatusFilter;
  search: string;
}

interface RoomPlanFiltersProps {
  value: RoomPlanFiltersValue;
  onChange: (value: RoomPlanFiltersValue) => void;
}

export function RoomPlanFilters({ value, onChange }: RoomPlanFiltersProps) {
  const { t } = useTranslation();

  return (
    <Group gap="sm" wrap="wrap">
      <TextInput
        placeholder={t("search_room_or_student", {
          defaultValue: "Search room or student...",
        })}
        leftSection={<IconSearch size={14} />}
        value={value.search}
        onChange={(e) => onChange({ ...value, search: e.currentTarget.value })}
        w={240}
      />
      <Select
        placeholder={t("gender", { defaultValue: "Gender" })}
        data={[
          { value: "all", label: t("all", { defaultValue: "All" }) },
          { value: "male", label: t("male", { defaultValue: "Male" }) },
          { value: "female", label: t("female", { defaultValue: "Female" }) },
        ]}
        value={value.gender}
        onChange={(val) =>
          onChange({ ...value, gender: (val as RoomPlanGenderFilter) || "all" })
        }
        allowDeselect={false}
        w={140}
      />
      <Select
        placeholder={t("status", { defaultValue: "Status" })}
        data={[
          { value: "all", label: t("all", { defaultValue: "All" }) },
          { value: "vacant", label: t("vacant", { defaultValue: "Vacant" }) },
          { value: "full", label: t("full", { defaultValue: "Full" }) },
          {
            value: "maintenance",
            label: t("bed_status.maintenance", { defaultValue: "Maintenance" }),
          },
        ]}
        value={value.status}
        onChange={(val) =>
          onChange({ ...value, status: (val as RoomPlanStatusFilter) || "all" })
        }
        allowDeselect={false}
        w={150}
      />
    </Group>
  );
}

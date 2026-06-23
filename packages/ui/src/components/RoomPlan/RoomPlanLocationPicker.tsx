import { useEffect, useState } from "react";
import { Group, Select, Loader } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { locations } from "@domas/api-client";
import { LocationType } from "@domas/ts-types";

interface SelectionLevel {
  label: string;
  type: LocationType;
  parentId: number | null;
  options: { value: string; label: string }[];
}

interface RoomPlanLocationPickerProps {
  onChange: (locationId: number | null) => void;
}

const VIEWABLE_TYPES = new Set<LocationType>([
  LocationType.BUILDING,
  LocationType.BLOCK,
  LocationType.FLOOR,
]);

// There is only ever a single University root node, so it isn't shown as a
// selection step - the picker starts drilling from its direct children.
// Campus is still a navigation step to drill through - the room plan itself
// can only be viewed scoped to a Building, Block, or Floor.
export function RoomPlanLocationPicker({
  onChange,
}: RoomPlanLocationPickerProps) {
  const { t, i18n } = useTranslation();
  const isTr = i18n.language === "tr";
  const localizedLocationName = (loc: { name: string; nameTr?: string }) =>
    isTr && loc.nameTr ? loc.nameTr : loc.name;
  const [levels, setLevels] = useState<SelectionLevel[]>([]);
  const [selectedIds, setSelectedIds] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const result = await locations.findAll({ limit: 100 });
        const root = result.data.find(
          (l) => l.type === LocationType.UNIVERSITY,
        );
        if (!root) {
          setLevels([]);
          return;
        }

        const children = await locations.findChildren(root.id);
        const drillable = children.filter(
          (c) => c.type !== LocationType.ROOM && c.type !== LocationType.BED,
        );
        if (drillable.length > 0) {
          const nextType = drillable[0].type;
          setLevels([
            {
              label: t(`location_type.${nextType}`, {
                defaultValue: nextType,
              }),
              type: nextType,
              parentId: root.id,
              options: drillable.map((c) => ({
                value: c.id.toString(),
                label: localizedLocationName(c),
              })),
            },
          ]);
        } else {
          setLevels([]);
        }
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [t]);

  const handleChange = async (val: string | null, levelIdx: number) => {
    const newSelectedIds = { ...selectedIds };
    Object.keys(newSelectedIds).forEach((k) => {
      if (parseInt(k, 10) >= levelIdx) delete newSelectedIds[parseInt(k, 10)];
    });

    if (!val) {
      setSelectedIds(newSelectedIds);
      setLevels((prev) => prev.slice(0, levelIdx + 1));
      onChange(null);
      return;
    }

    newSelectedIds[levelIdx] = val;
    setSelectedIds(newSelectedIds);

    const locId = parseInt(val, 10);
    const currentLevel = levels[levelIdx];
    onChange(VIEWABLE_TYPES.has(currentLevel.type) ? locId : null);

    setLoading(true);
    try {
      const children = await locations.findChildren(locId);
      const drillable = children.filter(
        (c) => c.type !== LocationType.ROOM && c.type !== LocationType.BED,
      );
      if (drillable.length > 0) {
        const nextType = drillable[0].type;
        setLevels((prev) => [
          ...prev.slice(0, levelIdx + 1),
          {
            label: t(`location_type.${nextType}`, { defaultValue: nextType }),
            type: nextType,
            parentId: locId,
            options: drillable.map((c) => ({
              value: c.id.toString(),
              label: localizedLocationName(c),
            })),
          },
        ]);
      } else {
        setLevels((prev) => prev.slice(0, levelIdx + 1));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Group align="flex-end" gap="sm" wrap="wrap">
      {levels.map((level, idx) => (
        <Select
          key={`${idx}-${level.parentId}`}
          label={level.label}
          placeholder={t("select_location", { defaultValue: "Select" })}
          data={level.options}
          value={selectedIds[idx] || null}
          onChange={(val) => handleChange(val, idx)}
          disabled={loading}
          searchable
          clearable={idx > 0}
          w={190}
        />
      ))}
      {loading && <Loader size="xs" />}
    </Group>
  );
}

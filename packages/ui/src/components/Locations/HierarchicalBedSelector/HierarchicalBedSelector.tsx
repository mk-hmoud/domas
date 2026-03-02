import { useState, useEffect } from "react";
import { Stack, Select, Loader, Text } from "@mantine/core";
import { locations, beds as bedsApi } from "@domas/api-client";
import { Bed, LocationType } from "@domas/ts-types";
import { useTranslation } from "react-i18next";

interface HierarchicalBedSelectorProps {
  studentId?: string;
  value?: number;
  onChange: (bedId: number) => void;
  error?: any;
}

interface SelectionLevel {
  label: string;
  type: LocationType;
  parentId: number | null;
  options: { value: string; label: string }[];
}

export function HierarchicalBedSelector({
  studentId,
  value,
  onChange,
  error,
}: HierarchicalBedSelectorProps) {
  const { t } = useTranslation();
  const [levels, setLevels] = useState<SelectionLevel[]>([]);
  const [selectedIds, setSelectedIds] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [eligibleBeds, setEligibleBeds] = useState<Bed[]>([]);
  const [loadingBeds, setLoadingBeds] = useState(false);

  // 1. Initial Load: Start by showing the University level
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const result = await locations.findAll({ limit: 100 });
        const roots = result.data.filter(
          (l) => l.type === LocationType.UNIVERSITY,
        );

        setLevels([
          {
            label: t("location_type.university", "University"),
            type: LocationType.UNIVERSITY,
            parentId: null,
            options: roots.map((r) => ({
              value: r.id.toString(),
              label: r.name,
            })),
          },
        ]);
      } catch (e) {
        // Silently handle error or show notification
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [t]);

  const handleLocationChange = async (val: string | null, levelIdx: number) => {
    // A. Clean up state for everything below the current level
    const newSelectedIds = { ...selectedIds };
    Object.keys(newSelectedIds).forEach((k) => {
      if (parseInt(k) >= levelIdx) delete newSelectedIds[parseInt(k)];
    });

    if (!val) {
      setSelectedIds(newSelectedIds);
      setLevels((prev) => prev.slice(0, levelIdx + 1));
      setEligibleBeds([]);
      return;
    }

    // B. Record current selection
    newSelectedIds[levelIdx] = val;
    setSelectedIds(newSelectedIds);
    setEligibleBeds([]);

    const locId = parseInt(val);
    setLoading(true);
    try {
      // 1. Fetch details of selected location and its children
      const [loc, children] = await Promise.all([
        locations.findById(locId),
        locations.findChildren(locId),
      ]);

      // 2. Fetch all eligible beds for this student globally (to filter by room later)
      let allEligible: Bed[] = [];
      if (studentId) {
        setLoadingBeds(true);
        allEligible = await bedsApi.findEligible(studentId);
        setLoadingBeds(false);
      }

      // 3. DECISION LOGIC:
      // Does this location have direct beds?
      const bedsInThisLoc = allEligible.filter((b) => b.locationId === locId);

      if (bedsInThisLoc.length > 0) {
        // Option 1: This location (likely a ROOM) has beds. Show bed selector.
        setEligibleBeds(bedsInThisLoc);
        setLevels((prev) => prev.slice(0, levelIdx + 1));
      } else if (children.length > 0) {
        // Option 2: This location has sub-locations. Add the next level.
        // We look at the first child to determine the label for the next dropdown.
        const nextType = children[0].type;
        const nextLevel: SelectionLevel = {
          label: t(`location_type.${nextType}`, { defaultValue: nextType }),
          type: nextType,
          parentId: locId,
          options: children.map((c) => ({
            value: c.id.toString(),
            label: c.name,
          })),
        };
        setLevels((prev) => [...prev.slice(0, levelIdx + 1), nextLevel]);
      } else {
        // Option 3: Terminal location with no beds and no children.
        setLevels((prev) => prev.slice(0, levelIdx + 1));
      }

      // Use loc to avoid unused variable error (can be used for more specific logic if needed)
      if (loc.isGuestZone) {
        // ... special guest zone logic could go here
      }
    } catch (e) {
      // Hierarchy drill-down error
    } finally {
      setLoading(false);
    }
  };

  const currentBedId = value ? value.toString() : null;

  return (
    <Stack gap="sm">
      {levels.map((level, idx) => (
        <Select
          key={`${idx}-${level.parentId}`}
          label={level.label}
          placeholder={t("select_location")}
          data={level.options}
          value={selectedIds[idx] || null}
          onChange={(val) => handleLocationChange(val, idx)}
          disabled={loading}
          required
          searchable
          clearable={idx > 0} // Only root is mandatory to stay
        />
      ))}

      {(eligibleBeds.length > 0 || loadingBeds) && (
        <Select
          label={t("bed")}
          placeholder={t("select_bed")}
          data={eligibleBeds.map((b) => ({
            value: b.id.toString(),
            label: b.label,
          }))}
          value={currentBedId}
          onChange={(val) => val && onChange(parseInt(val))}
          rightSection={loadingBeds ? <Loader size="xs" /> : null}
          error={error}
          required
        />
      )}

      {/* Edge case: User reached a ROOM but no beds match the student's eligibility (Gender/Nationality) */}
      {levels.length > 0 &&
        eligibleBeds.length === 0 &&
        !loadingBeds &&
        !loading &&
        selectedIds[levels.length - 1] && (
          <Text size="xs" c="dimmed" ta="center" py="xs">
            {t("no_eligible_beds_available")}
          </Text>
        )}
    </Stack>
  );
}

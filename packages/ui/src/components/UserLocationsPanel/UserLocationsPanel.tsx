import { useEffect, useState } from "react";
import {
  Badge,
  Box,
  CloseButton,
  Group,
  Loader,
  Select,
  Stack,
  Text,
  ComboboxItem,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { IconMapPin } from "@tabler/icons-react";
import { access, locations as locationsApi } from "@domas/api-client";
import { Location } from "@domas/ts-types";
import { useTranslation } from "react-i18next";
import { notifications } from "@mantine/notifications";

interface UserLocationsPanelProps {
  userId: string;
  /** Disables add/remove controls - e.g. when the viewer lacks staff_locations.manage */
  readOnly?: boolean;
}

export function UserLocationsPanel({
  userId,
  readOnly,
}: UserLocationsPanelProps) {
  const { t } = useTranslation();
  const [assigned, setAssigned] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [mutatingId, setMutatingId] = useState<number | null>(null);

  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearch] = useDebouncedValue(searchValue, 300);
  const [options, setOptions] = useState<(ComboboxItem & { path?: string })[]>(
    [],
  );
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);

  const fetchAssigned = async () => {
    setLoading(true);
    try {
      const result = await access.getLocationsForUser(userId);
      setAssigned(result);
    } catch (error) {
      notifications.show({
        title: t("error"),
        message: t(
          "failed_to_fetch_staff_locations",
          "Failed to fetch assigned locations",
        ),
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssigned();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    if (!debouncedSearch.trim()) {
      setOptions([]);
      return;
    }
    const assignedIds = new Set(assigned.map((l) => l.id));

    const run = async () => {
      setSearching(true);
      try {
        const results = await locationsApi.search(debouncedSearch, true);
        setOptions(
          results
            .filter((loc) => !assignedIds.has(loc.id))
            .map((loc) => ({
              value: loc.id.toString(),
              label: loc.name,
              path: loc.locationPath,
            })),
        );
      } catch (error) {
        // ignore search errors, just show no results
      } finally {
        setSearching(false);
      }
    };
    run();
  }, [debouncedSearch, assigned]);

  const handleAdd = async (value: string | null) => {
    if (!value) return;
    const locationId = parseInt(value, 10);
    setAdding(true);
    try {
      await access.assignLocation(userId, locationId);
      setSearchValue("");
      setOptions([]);
      await fetchAssigned();
    } catch (error) {
      notifications.show({
        title: t("error"),
        message: t("failed_to_assign_location", "Failed to assign location"),
        color: "red",
      });
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (locationId: number) => {
    setMutatingId(locationId);
    try {
      await access.revokeLocation(userId, locationId);
      setAssigned((prev) => prev.filter((l) => l.id !== locationId));
    } catch (error) {
      notifications.show({
        title: t("error"),
        message: t("failed_to_revoke_location", "Failed to remove location"),
        color: "red",
      });
    } finally {
      setMutatingId(null);
    }
  };

  const renderOption = ({
    option,
  }: {
    option: ComboboxItem & { path?: string };
  }) => (
    <Group gap="sm" wrap="nowrap">
      <IconMapPin size={16} opacity={0.5} />
      <Box>
        <Text size="sm">{option.label}</Text>
        {option.path && (
          <Text size="xs" c="dimmed">
            {option.path}
          </Text>
        )}
      </Box>
    </Group>
  );

  return (
    <Stack gap="xs">
      {loading ? (
        <Loader size="sm" />
      ) : (
        <>
          {assigned.length === 0 ? (
            <Text size="sm" c="orange">
              {t(
                "staff_locations_unassigned",
                "No locations assigned — this user cannot see or manage any students, beds, or other location-bound data until at least one location is assigned.",
              )}
            </Text>
          ) : (
            <>
              <Text size="xs" c="dimmed">
                {t(
                  "staff_locations_restricted_hint",
                  "Access is limited to these locations and everything under them.",
                )}
              </Text>
              <Group gap="xs">
                {assigned.map((loc) => (
                  <Badge
                    key={loc.id}
                    variant="outline"
                    pr={readOnly ? undefined : 4}
                    rightSection={
                      !readOnly &&
                      (mutatingId === loc.id ? (
                        <Loader size={10} />
                      ) : (
                        <CloseButton
                          size="xs"
                          radius="xl"
                          variant="transparent"
                          onClick={() => handleRemove(loc.id)}
                        />
                      ))
                    }
                  >
                    {loc.name}
                  </Badge>
                ))}
              </Group>
            </>
          )}

          {!readOnly && (
            <Select
              placeholder={t(
                "add_location_placeholder",
                "Search to assign a location...",
              )}
              data={options}
              value={null}
              onChange={handleAdd}
              searchable
              searchValue={searchValue}
              onSearchChange={setSearchValue}
              nothingFoundMessage={
                searching
                  ? t("searching", "Searching...")
                  : t("no_locations_found", "No locations found")
              }
              rightSection={searching || adding ? <Loader size={16} /> : null}
              filter={({ options }) => options}
              renderOption={renderOption}
              disabled={adding}
            />
          )}
        </>
      )}
    </Stack>
  );
}

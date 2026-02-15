import { useState, useEffect } from "react";
import { Select, ComboboxItem, Loader, Group, Text, Box } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { locations } from "@domas/api-client";
import { IconMapPin } from "@tabler/icons-react";

interface SmartLocationSelectorProps {
  value?: string | null;
  onChange?: (value: string | null) => void;
  label?: string;
  placeholder?: string;
  error?: any;
  required?: boolean;
}

export function SmartLocationSelector({
  value,
  onChange,
  label,
  placeholder,
  error,
  required,
}: SmartLocationSelectorProps) {
  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearch] = useDebouncedValue(searchValue, 300);
  const [options, setOptions] = useState<ComboboxItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Initial load for selected value if not in options
  useEffect(() => {
    if (value && !options.some((o) => o.value === value)) {
      const fetchInitial = async () => {
        try {
          const loc = await locations.findById(parseInt(value));
          setOptions([{ value: loc.id.toString(), label: loc.name }]);
        } catch (e) {
          // Ignore if not found
        }
      };
      fetchInitial();
    }
  }, [value]);

  useEffect(() => {
    if (!debouncedSearch || debouncedSearch.trim().length === 0) {
      setOptions([]);
      return;
    }

    const fetchLocations = async () => {
      setLoading(true);
      try {
        const results = await locations.search(debouncedSearch, true);

        const newOptions = results.map((loc: any) => ({
          value: loc.id.toString(),
          label: loc.name,
          // Store extra data for custom rendering
          description: loc.parentPath || "Root Location",
        }));

        setOptions(newOptions);
      } catch (error) {
        console.error("Failed to search locations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, [debouncedSearch]);

  const renderOption = ({ option }: { option: ComboboxItem }) => (
    <Group gap="sm" wrap="nowrap">
      <IconMapPin size={16} opacity={0.5} />
      <Box>
        <Text size="sm">{option.label}</Text>
        <Text size="xs" c="dimmed">
          {(option as any).description}
        </Text>
      </Box>
    </Group>
  );

  return (
    <Select
      label={label}
      placeholder={placeholder}
      data={options}
      value={value}
      onChange={onChange}
      searchable
      clearable
      onSearchChange={setSearchValue}
      searchValue={searchValue}
      nothingFoundMessage={loading ? "Searching..." : "No locations found"}
      rightSection={loading ? <Loader size={16} /> : null}
      error={error}
      required={required}
      filter={({ options }) => options} // Disable client-side filtering
      renderOption={renderOption}
    />
  );
}

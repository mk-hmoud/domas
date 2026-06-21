import { useEffect, useRef, useState } from "react";
import { Loader, MultiSelect } from "@mantine/core";
import { students as studentsApi } from "@domas/api-client";

export interface StudentOption {
  value: string;
  label: string;
}

interface StudentMultiSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  initialOptions?: StudentOption[];
  label?: string;
  placeholder?: string;
}

export function StudentMultiSelect({
  value,
  onChange,
  initialOptions = [],
  label,
  placeholder,
}: StudentMultiSelectProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [options, setOptions] = useState<StudentOption[]>(initialOptions);
  const [loading, setLoading] = useState(false);
  const initializedFor = useRef<string | null>(null);

  // Merge in the caller-provided options once per modal open (e.g. when
  // pre-populating an edit form) so existing selections render a label
  // instead of a raw id before any search has run.
  useEffect(() => {
    const key = initialOptions.map((o) => o.value).join(",");
    if (initializedFor.current === key) return;
    initializedFor.current = key;
    if (initialOptions.length === 0) return;
    setOptions((prev) => {
      const merged = new Map(prev.map((o) => [o.value, o]));
      initialOptions.forEach((o) => merged.set(o.value, o));
      return Array.from(merged.values());
    });
  }, [initialOptions]);

  useEffect(() => {
    if (!searchQuery.trim()) return;
    const handler = setTimeout(async () => {
      setLoading(true);
      try {
        const result = await studentsApi.findAll({
          search: searchQuery,
          page: 1,
          limit: 20,
        });
        const fetched = result.data.map((s) => ({
          value: s.id,
          label: `${s.firstName} ${s.lastName} (${s.studentNumber})`,
        }));
        setOptions((prev) => {
          const merged = new Map(prev.map((o) => [o.value, o]));
          fetched.forEach((o) => merged.set(o.value, o));
          return Array.from(merged.values());
        });
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  return (
    <MultiSelect
      label={label}
      placeholder={placeholder}
      searchable
      value={value}
      onChange={onChange}
      data={options}
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      rightSection={loading ? <Loader size={14} /> : undefined}
      nothingFoundMessage={
        searchQuery.trim() ? "No students found" : "Type to search"
      }
      hidePickedOptions
    />
  );
}

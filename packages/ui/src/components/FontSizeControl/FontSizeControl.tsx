import {
  ActionIcon,
  Popover,
  Stack,
  Text,
  UnstyledButton,
  Tooltip,
} from "@mantine/core";
import { IconTextSize } from "@tabler/icons-react";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

const STORAGE_KEY = "domas-font-size";

const SIZES = [
  { key: "normal", label: "A", fontSize: "100%", title: "Normal" },
  { key: "large", label: "A", fontSize: "112%", title: "Large" },
  { key: "xl", label: "A", fontSize: "125%", title: "X-Large" },
] as const;

type SizeKey = (typeof SIZES)[number]["key"];

function applyFontSize(fontSize: string) {
  document.documentElement.style.fontSize = fontSize;
}

export function FontSizeControl() {
  const { t } = useTranslation();
  const [active, setActive] = useState<SizeKey>("normal");
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as SizeKey | null;
    const key = saved && SIZES.find((s) => s.key === saved) ? saved : "normal";
    setActive(key);
    applyFontSize(SIZES.find((s) => s.key === key)!.fontSize);
  }, []);

  const handleSelect = (key: SizeKey) => {
    const size = SIZES.find((s) => s.key === key)!;
    setActive(key);
    applyFontSize(size.fontSize);
    localStorage.setItem(STORAGE_KEY, key);
    setOpened(false);
  };

  return (
    <Popover
      opened={opened}
      onChange={setOpened}
      position="bottom"
      withArrow
      shadow="md"
      width={160}
    >
      <Popover.Target>
        <Tooltip
          label={t("font_size", { defaultValue: "Font Size" })}
          position="bottom"
        >
          <ActionIcon
            variant="subtle"
            color="gray"
            size="md"
            radius="xl"
            onClick={() => setOpened((o) => !o)}
            aria-label="Change font size"
          >
            <IconTextSize size={16} stroke={1.5} />
          </ActionIcon>
        </Tooltip>
      </Popover.Target>

      <Popover.Dropdown p="xs">
        <Text size="xs" c="dimmed" fw={600} tt="uppercase" mb={6} px={4}>
          {t("font_size", { defaultValue: "Font Size" })}
        </Text>
        <Stack gap={4}>
          {SIZES.map((size) => {
            const isActive = active === size.key;
            return (
              <UnstyledButton
                key={size.key}
                onClick={() => handleSelect(size.key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "6px 8px",
                  borderRadius: "var(--mantine-radius-sm)",
                  background: isActive
                    ? "var(--mantine-color-blue-light)"
                    : undefined,
                  color: isActive
                    ? "var(--mantine-color-blue-light-color)"
                    : "inherit",
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                <Text
                  style={{
                    fontSize: size.fontSize,
                    lineHeight: 1,
                    minWidth: 20,
                    textAlign: "center",
                  }}
                  fw={700}
                  span
                >
                  {size.label}
                </Text>
                <Text size="sm">{size.title}</Text>
                {isActive && (
                  <Text size="xs" c="blue" ml="auto">
                    ✓
                  </Text>
                )}
              </UnstyledButton>
            );
          })}
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}

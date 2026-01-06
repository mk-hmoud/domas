import { Menu, UnstyledButton, Group, Text, rem } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { IconChevronDown } from "@tabler/icons-react";
import { useState } from "react";

const languages = [
  { value: "en", label: "English", flag: "🇺🇸" },
  { value: "tr", label: "Türkçe", flag: "🇹🇷" },
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [opened, setOpened] = useState(false);

  const currentLang =
    languages.find((l) => l.value === i18n.language) || languages[0];

  return (
    <Menu
      onOpen={() => setOpened(true)}
      onClose={() => setOpened(false)}
      radius="md"
      width="target"
      withinPortal
    >
      <Menu.Target>
        <UnstyledButton
          style={{
            padding: `${rem(4)} ${rem(12)}`,
            borderRadius: "var(--mantine-radius-md)",
            backgroundColor:
              "light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6))",
            border: `1px solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))`,
          }}
        >
          <Group gap={7}>
            <Text size="sm" fw={500}>
              {currentLang.flag}
            </Text>
            <Text size="sm" fw={500} visibleFrom="xs">
              {currentLang.label}
            </Text>
            <IconChevronDown
              style={{
                width: rem(12),
                height: rem(12),
                transform: opened ? "rotate(180deg)" : "none",
                transition: "transform 200ms ease",
              }}
              stroke={1.5}
            />
          </Group>
        </UnstyledButton>
      </Menu.Target>

      <Menu.Dropdown>
        {languages.map((lang) => (
          <Menu.Item
            key={lang.value}
            leftSection={<Text size="sm">{lang.flag}</Text>}
            onClick={() => i18n.changeLanguage(lang.value)}
            bg={
              i18n.language === lang.value
                ? "var(--mantine-color-blue-light)"
                : undefined
            }
          >
            {lang.label}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
}

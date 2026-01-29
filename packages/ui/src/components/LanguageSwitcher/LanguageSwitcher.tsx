import { Menu, ActionIcon } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { IconLanguage } from "@tabler/icons-react";

const languages = [
  { value: "en", label: "English" },
  { value: "tr", label: "Türkçe" },
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <Menu shadow="md" width={200} position="bottom-end">
      <Menu.Target>
        <ActionIcon variant="default" size="xl" aria-label="Change language">
          <IconLanguage stroke={1.5} />
        </ActionIcon>
      </Menu.Target>

      <Menu.Dropdown>
        {languages.map((lang) => (
          <Menu.Item
            key={lang.value}
            onClick={() => i18n.changeLanguage(lang.value)}
            bg={
              i18n.language === lang.value
                ? "var(--mantine-color-blue-light)"
                : undefined
            }
            fw={i18n.language === lang.value ? 600 : 400}
          >
            {lang.label}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
}

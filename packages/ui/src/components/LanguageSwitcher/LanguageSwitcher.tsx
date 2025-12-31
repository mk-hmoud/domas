import { SegmentedControl, Center, Box } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { IconLetterT, IconLetterE } from "@tabler/icons-react";

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <SegmentedControl
      value={i18n.language}
      onChange={(value) => i18n.changeLanguage(value)}
      data={[
        {
          value: "en",
          label: (
            <Center style={{ gap: 10 }}>
              <IconLetterE style={{ width: 16, height: 16 }} />
              <Box>EN</Box>
            </Center>
          ),
        },
        {
          value: "tr",
          label: (
            <Center style={{ gap: 10 }}>
              <IconLetterT style={{ width: 16, height: 16 }} />
              <Box>TR</Box>
            </Center>
          ),
        },
      ]}
    />
  );
}

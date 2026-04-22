import {
  Group,
  Avatar,
  Text,
  UnstyledButton,
  rem,
  Menu,
  Box,
  ActionIcon,
  Tooltip,
  Divider,
} from "@mantine/core";
import {
  IconLogout,
  IconSettings,
  IconChevronDown,
  IconHistory,
} from "@tabler/icons-react";
import { ThemeToggle } from "../ThemeToggle/ThemeToggle";
import { LanguageSwitcher } from "../LanguageSwitcher/LanguageSwitcher";
import { ReactNode, forwardRef } from "react";
import { User } from "@domas/ts-types";
import { useTranslation } from "react-i18next";
import classes from "./HeaderBar.module.css";

export interface HeaderBarProps {
  logo?: ReactNode;
  user?: User;
  onLogout?: () => void;
  onNavigate?: (link: string) => void;
  onShowHistory?: () => void;
}

interface UserButtonProps extends React.ComponentPropsWithoutRef<"button"> {
  name: string;
  email: string;
}

const UserButton = forwardRef<HTMLButtonElement, UserButtonProps>(
  ({ name, email, ...others }, ref) => (
    <UnstyledButton
      ref={ref}
      style={{
        padding: "4px 8px",
        color:
          "light-dark(var(--mantine-color-black), var(--mantine-color-dark-0))",
        borderRadius: "var(--mantine-radius-xl)",
      }}
      {...others}
    >
      <Group gap={7}>
        <Avatar src={null} alt={name} radius="xl" size={22} />
        <Box style={{ flex: 1 }}>
          <Text size="sm" fw={500} style={{ lineHeight: 1 }}>
            {name}
          </Text>
        </Box>
        <IconChevronDown
          style={{ width: rem(12), height: rem(12) }}
          stroke={1.5}
        />
      </Group>
    </UnstyledButton>
  ),
);

export function HeaderBar({
  logo,
  user,
  onLogout,
  onNavigate,
  onShowHistory,
}: HeaderBarProps) {
  const { t } = useTranslation();

  return (
    <header className={classes.header}>
      <Group>{logo}</Group>

      <Group gap="sm">
        <Group gap={4}>
          {onShowHistory && (
            <Tooltip label={t("history")} position="bottom">
              <ActionIcon
                variant="subtle"
                color="gray"
                size="md"
                radius="xl"
                onClick={onShowHistory}
              >
                <IconHistory size={16} stroke={1.5} />
              </ActionIcon>
            </Tooltip>
          )}
          <LanguageSwitcher />
          <ThemeToggle />
        </Group>

        {user && (
          <Divider
            orientation="vertical"
            h={20}
            style={{ alignSelf: "center" }}
          />
        )}

        {user && (
          <Menu
            withArrow
            position="bottom-end"
            transitionProps={{ transition: "pop-top-right" }}
          >
            <Menu.Target>
              <UserButton name={user.email.split("@")[0]} email={user.email} />
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>{t("application")}</Menu.Label>
              <Menu.Item
                leftSection={
                  <IconSettings style={{ width: rem(14), height: rem(14) }} />
                }
                onClick={() => onNavigate?.("/dashboard/account")}
              >
                {t("account_settings")}
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item
                color="red"
                leftSection={
                  <IconLogout style={{ width: rem(14), height: rem(14) }} />
                }
                onClick={onLogout}
              >
                {t("logout")}
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        )}
      </Group>
    </header>
  );
}

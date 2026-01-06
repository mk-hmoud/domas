import {
  Group,
  Avatar,
  Text,
  UnstyledButton,
  rem,
  Menu,
  Box,
} from "@mantine/core";
import { IconLogout, IconSettings, IconChevronDown } from "@tabler/icons-react";
import { ThemeToggle } from "../ThemeToggle/ThemeToggle";
import { LanguageSwitcher } from "../LanguageSwitcher/LanguageSwitcher";
import { ReactNode, forwardRef } from "react";
import { User } from "@domas/ts-types";
import classes from "./HeaderBar.module.css";

export interface HeaderBarProps {
  logo?: ReactNode;
  user?: User;
  onLogout?: () => void;
  onNavigate?: (link: string) => void;
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
        padding: "var(--mantine-spacing-xs)",
        color:
          "light-dark(var(--mantine-color-black), var(--mantine-color-dark-0))",
        borderRadius: "var(--mantine-radius-sm)",
      }}
      {...others}
    >
      <Group gap={7}>
        <Avatar src={null} alt={name} radius="xl" size={24} />
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
}: HeaderBarProps) {
  return (
    <header className={classes.header}>
      <Group>{logo}</Group>

      <Group>
        <Group gap="xs">
          <LanguageSwitcher />
          <ThemeToggle />
        </Group>

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
              <Menu.Label>Application</Menu.Label>
              <Menu.Item
                leftSection={
                  <IconSettings style={{ width: rem(14), height: rem(14) }} />
                }
                onClick={() => onNavigate?.("/dashboard/settings")}
              >
                Account settings
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item
                color="red"
                leftSection={
                  <IconLogout style={{ width: rem(14), height: rem(14) }} />
                }
                onClick={onLogout}
              >
                Logout
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        )}
      </Group>
    </header>
  );
}

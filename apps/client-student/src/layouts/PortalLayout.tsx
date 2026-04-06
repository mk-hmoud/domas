import { Outlet, NavLink as RouterNavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  ActionIcon,
  AppShell,
  Avatar,
  Box,
  Group,
  Indicator,
  Menu,
  NavLink,
  Stack,
  Text,
  ThemeIcon,
  Title,
  UnstyledButton,
  useMantineColorScheme,
} from '@domas/ui';
import { ThemeToggle, LanguageSwitcher } from '@domas/ui';
import {
  IconBell,
  IconBed,
  IconCalendarPlus,
  IconCreditCard,
  IconHome2,
  IconLogout,
  IconUser,
} from '@tabler/icons-react';
import { useStudentAuth } from '../contexts/StudentAuthContext';
import { useNotifications } from '../contexts/NotificationsContext';

// ─── Navigation items ─────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Home', icon: IconHome2 },
  { path: '/booking', label: 'My Room', icon: IconBed },
  { path: '/apply', label: 'Apply', icon: IconCalendarPlus },
  { path: '/notifications', label: 'Notifications', icon: IconBell },
  { path: '/financial', label: 'Financial', icon: IconCreditCard },
];

// ─── Desktop sidebar nav ──────────────────────────────────────────────────────

function SidebarNav() {
  const location = useLocation();
  const { student, logout } = useStudentAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <Stack h="100%" justify="space-between" p="sm">
      <Stack gap={4}>
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
          const isNotif = path === '/notifications';
          const active = location.pathname === path;
          return (
            <NavLink
              key={path}
              component={RouterNavLink}
              to={path}
              label={label}
              active={active}
              leftSection={
                isNotif && unreadCount > 0 ? (
                  <Indicator
                    inline
                    label={unreadCount > 9 ? '9+' : String(unreadCount)}
                    size={16}
                    color="red"
                    offset={4}
                  >
                    <ThemeIcon variant="transparent" size="sm">
                      <Icon size={18} />
                    </ThemeIcon>
                  </Indicator>
                ) : (
                  <ThemeIcon variant="transparent" size="sm">
                    <Icon size={18} />
                  </ThemeIcon>
                )
              }
              style={{ borderRadius: 8 }}
            />
          );
        })}
        <NavLink
          component={RouterNavLink}
          to="/profile"
          label="Profile"
          active={location.pathname === '/profile'}
          leftSection={
            <ThemeIcon variant="transparent" size="sm">
              <IconUser size={18} />
            </ThemeIcon>
          }
          style={{ borderRadius: 8 }}
        />
      </Stack>

      {/* Bottom user strip */}
      <UnstyledButton onClick={handleLogout} style={{ borderRadius: 8, padding: 8 }}>
        <Group gap="sm">
          <Avatar size={32} radius="xl" color="blue">
            {student?.firstName?.[0] ?? '?'}
          </Avatar>
          <Box style={{ flex: 1, minWidth: 0 }}>
            <Text size="sm" fw={500} truncate>
              {student?.firstName} {student?.lastName}
            </Text>
            <Text size="xs" c="dimmed" truncate>
              {student?.studentNumber}
            </Text>
          </Box>
          <IconLogout size={16} />
        </Group>
      </UnstyledButton>
    </Stack>
  );
}

// ─── Mobile bottom tab bar ────────────────────────────────────────────────────

function BottomTabBar() {
  const location = useLocation();
  const { unreadCount } = useNotifications();

  return (
    <Box
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 64,
        zIndex: 200,
        borderTop: '1px solid var(--mantine-color-default-border)',
        backgroundColor: 'var(--mantine-color-body)',
        display: 'flex',
        alignItems: 'stretch',
      }}
    >
      {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
        const isNotif = path === '/notifications';
        const active = location.pathname === path;
        return (
          <RouterNavLink
            key={path}
            to={path}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              textDecoration: 'none',
              color: active ? 'var(--mantine-color-blue-filled)' : 'var(--mantine-color-dimmed)',
              fontSize: 10,
              fontWeight: active ? 600 : 400,
              transition: 'color 120ms ease',
            }}
          >
            {isNotif && unreadCount > 0 ? (
              <Indicator
                inline
                label={unreadCount > 9 ? '9+' : String(unreadCount)}
                size={16}
                color="red"
                offset={2}
              >
                <Icon size={22} />
              </Indicator>
            ) : (
              <Icon size={22} />
            )}
            <span>{label}</span>
          </RouterNavLink>
        );
      })}
    </Box>
  );
}

// ─── Top header bar ───────────────────────────────────────────────────────────

function TopBar() {
  const { student, logout } = useStudentAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const { colorScheme } = useMantineColorScheme();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <Group h="100%" px="md" justify="space-between">
      {/* Logo */}
      <Title order={4} style={{ cursor: 'default', userSelect: 'none', letterSpacing: -0.5 }}>
        DOMAS
      </Title>

      <Group gap="xs">
        {/* Notification bell — mobile only (bottom tab handles it on desktop) */}
        <ActionIcon
          component={RouterNavLink}
          to="/notifications"
          variant="subtle"
          size="lg"
          hiddenFrom="sm"
          aria-label="Notifications"
        >
          <Indicator
            disabled={unreadCount === 0}
            label={unreadCount > 9 ? '9+' : String(unreadCount)}
            size={16}
            color="red"
            offset={4}
          >
            <IconBell size={20} />
          </Indicator>
        </ActionIcon>

        {/* Desktop extras */}
        <Box visibleFrom="sm">
          <Group gap="xs">
            <LanguageSwitcher />
            <ThemeToggle />
            <Menu shadow="md" width={180}>
              <Menu.Target>
                <UnstyledButton>
                  <Group gap="xs">
                    <Avatar size={28} radius="xl" color="blue">
                      {student?.firstName?.[0] ?? '?'}
                    </Avatar>
                    <Text size="sm" fw={500} visibleFrom="md">
                      {student?.firstName}
                    </Text>
                  </Group>
                </UnstyledButton>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item
                  component={RouterNavLink}
                  to="/profile"
                  leftSection={<IconUser size={14} />}
                >
                  Profile
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  color="red"
                  leftSection={<IconLogout size={14} />}
                  onClick={handleLogout}
                >
                  Sign out
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Box>

        {/* Mobile: just theme toggle */}
        <Box hiddenFrom="sm">
          <ThemeToggle />
        </Box>
      </Group>
    </Group>
  );
}

// ─── Root layout ──────────────────────────────────────────────────────────────

export function PortalLayout() {
  return (
    <>
      <AppShell
        header={{ height: 56 }}
        navbar={{
          width: 240,
          breakpoint: 'sm',
          collapsed: { mobile: true }, // sidebar hidden on mobile; bottom tab handles it
        }}
        padding={0}
      >
        <AppShell.Header>
          <TopBar />
        </AppShell.Header>

        <AppShell.Navbar>
          <SidebarNav />
        </AppShell.Navbar>

        <AppShell.Main
          style={{
            // On mobile: leave room for the fixed bottom tab bar
            paddingBottom: 'var(--app-shell-footer-height, 0)',
          }}
        >
          <Box
            style={{
              minHeight: 'calc(100dvh - 56px)',
              paddingBottom: 80, // clearance above bottom nav on mobile
            }}
            hiddenFrom="sm"
          >
            <Outlet />
          </Box>
          <Box visibleFrom="sm">
            <Outlet />
          </Box>
        </AppShell.Main>
      </AppShell>

      {/* Mobile bottom tab bar */}
      <Box hiddenFrom="sm">
        <BottomTabBar />
      </Box>
    </>
  );
}

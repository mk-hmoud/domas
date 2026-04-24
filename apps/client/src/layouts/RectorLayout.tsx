import { Outlet, NavLink as RouterNavLink, useNavigate } from 'react-router-dom';
import {
  ActionIcon,
  AppShell,
  Avatar,
  Box,
  Divider,
  Group,
  Menu,
  NavLink,
  Stack,
  Text,
  ThemeIcon,
  Title,
  UnstyledButton,
} from '@domas/ui';
import { ThemeToggle, LanguageSwitcher } from '@domas/ui';
import { useTranslation } from 'react-i18next';
import {
  IconLayoutDashboard,
  IconBed,
  IconUsers,
  IconCalendarPlus,
  IconUser,
  IconLogout,
} from '@tabler/icons-react';
import { useAuth } from '@domas/client-core';
import { useLocation } from 'react-router-dom';

// ─── Navigation items ─────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { path: '/rector', labelKey: 'rector.nav_overview', icon: IconLayoutDashboard, exact: true },
  { path: '/rector/beds', labelKey: 'rector.nav_beds', icon: IconBed, exact: false },
  { path: '/rector/residents', labelKey: 'rector.nav_residents', icon: IconUsers, exact: false },
  {
    path: '/rector/new-booking',
    labelKey: 'rector.nav_new_booking',
    icon: IconCalendarPlus,
    exact: false,
  },
];

// ─── Desktop sidebar nav ──────────────────────────────────────────────────────

function SidebarNav() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <Stack h="100%" justify="space-between" py="sm" px="xs">
      <Stack gap={2}>
        {NAV_ITEMS.map(({ path, labelKey, icon: Icon, exact }) => {
          const active = exact ? location.pathname === path : location.pathname.startsWith(path);
          return (
            <NavLink
              key={path}
              component={RouterNavLink}
              to={path}
              label={t(labelKey)}
              active={active}
              leftSection={
                <ThemeIcon variant="transparent" size="sm">
                  <Icon size={18} />
                </ThemeIcon>
              }
              style={{ borderRadius: 8 }}
            />
          );
        })}

        <Divider my="xs" />

        <NavLink
          component={RouterNavLink}
          to="/rector/profile"
          label={t('rector.nav_profile')}
          active={location.pathname === '/rector/profile'}
          leftSection={
            <ThemeIcon variant="transparent" size="sm">
              <IconUser size={18} />
            </ThemeIcon>
          }
          style={{ borderRadius: 8 }}
        />
      </Stack>

      <Box px="xs">
        <Divider mb="sm" />
        <UnstyledButton
          onClick={handleLogout}
          style={{ borderRadius: 8, padding: '8px 6px', width: '100%' }}
        >
          <Group gap="sm">
            <Avatar size={34} radius="xl" color="indigo">
              {user?.firstName?.[0] ?? '?'}
            </Avatar>
            <Box style={{ flex: 1, minWidth: 0 }}>
              <Text size="sm" fw={500} truncate>
                {user?.firstName} {user?.lastName}
              </Text>
              <Text size="xs" c="dimmed" truncate>
                {user?.email}
              </Text>
            </Box>
            <IconLogout size={15} color="var(--mantine-color-dimmed)" />
          </Group>
        </UnstyledButton>
      </Box>
    </Stack>
  );
}

// ─── Mobile bottom tab bar ────────────────────────────────────────────────────

function BottomTabBar() {
  const location = useLocation();
  const { t } = useTranslation();

  const ALL_TABS = [
    ...NAV_ITEMS,
    { path: '/rector/profile', labelKey: 'rector.nav_profile', icon: IconUser, exact: false },
  ];

  return (
    <Box
      hiddenFrom="sm"
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
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {ALL_TABS.map(({ path, labelKey, icon: Icon, exact }) => {
        const active = exact
          ? location.pathname === path
          : location.pathname === path || location.pathname.startsWith(path + '/');
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
              color: active ? 'var(--mantine-color-indigo-filled)' : 'var(--mantine-color-dimmed)',
              fontSize: 10,
              fontWeight: active ? 600 : 400,
              transition: 'color 120ms ease',
            }}
          >
            <Icon size={22} />
            <span>{t(labelKey)}</span>
          </RouterNavLink>
        );
      })}
    </Box>
  );
}

// ─── Top header bar ───────────────────────────────────────────────────────────

function TopBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <Group h="100%" px="md" justify="space-between">
      <Title order={4} style={{ cursor: 'default', userSelect: 'none', letterSpacing: -0.5 }}>
        DOMAS
      </Title>

      <Group gap="xs">
        <Box visibleFrom="sm">
          <Group gap="xs">
            <LanguageSwitcher />
            <ThemeToggle />
            <Menu shadow="md" width={200} position="bottom-end">
              <Menu.Target>
                <UnstyledButton>
                  <Group gap="xs">
                    <Avatar size={30} radius="xl" color="indigo">
                      {user?.firstName?.[0] ?? '?'}
                    </Avatar>
                    <Box visibleFrom="md">
                      <Text size="sm" fw={500} lh={1.2}>
                        {user?.firstName} {user?.lastName}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {user?.email}
                      </Text>
                    </Box>
                  </Group>
                </UnstyledButton>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item
                  component={RouterNavLink}
                  to="/rector/profile"
                  leftSection={<IconUser size={14} />}
                >
                  {t('rector.nav_profile')}
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  color="red"
                  leftSection={<IconLogout size={14} />}
                  onClick={handleLogout}
                >
                  {t('rector.sign_out')}
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Box>

        <ActionIcon
          variant="subtle"
          size="lg"
          visibleFrom="sm"
          style={{ display: 'none' }}
          aria-hidden
        />

        <Box hiddenFrom="sm">
          <ThemeToggle />
        </Box>
      </Group>
    </Group>
  );
}

// ─── Root layout ──────────────────────────────────────────────────────────────

export function RectorLayout() {
  return (
    <>
      <AppShell
        header={{ height: 60 }}
        navbar={{
          width: 240,
          breakpoint: 'sm',
          collapsed: { mobile: true },
        }}
        padding={0}
      >
        <AppShell.Header>
          <TopBar />
        </AppShell.Header>

        <AppShell.Navbar>
          <SidebarNav />
        </AppShell.Navbar>

        <AppShell.Main>
          <Box
            px={{ base: 'md', sm: 'xl', lg: '2xl' }}
            pt={{ base: 'md', sm: 'lg' }}
            pb={{ base: 80, sm: 'xl' }}
            style={{ minHeight: 'calc(100dvh - 60px)' }}
          >
            <Outlet />
          </Box>
        </AppShell.Main>
      </AppShell>

      <BottomTabBar />
    </>
  );
}

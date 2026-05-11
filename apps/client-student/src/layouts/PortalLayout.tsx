import { Outlet, NavLink as RouterNavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  ActionIcon,
  AppShell,
  Avatar,
  Box,
  Divider,
  Group,
  Indicator,
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
  IconBed,
  IconBell,
  IconCalendarPlus,
  IconCreditCard,
  IconHome2,
  IconLogout,
  IconSpeakerphone,
  IconUser,
} from '@tabler/icons-react';
import { useStudentAuth } from '../contexts/StudentAuthContext';
import { useNotifications } from '../contexts/NotificationsContext';
import { useAnnouncements } from '../contexts/AnnouncementsContext';

// ─── Navigation items ─────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { path: '/dashboard', labelKey: 'portal.nav_home', icon: IconHome2 },
  { path: '/booking', labelKey: 'portal.nav_my_room', icon: IconBed },
  { path: '/apply', labelKey: 'portal.nav_apply', icon: IconCalendarPlus },
  { path: '/announcements', labelKey: 'portal.nav_announcements', icon: IconSpeakerphone },
  { path: '/notifications', labelKey: 'portal.nav_notifications', icon: IconBell },
  { path: '/financial', labelKey: 'portal.nav_financial', icon: IconCreditCard },
];

// Mobile bottom bar uses 5 items — Notifications lives in the TopBar bell on mobile
const BOTTOM_NAV_ITEMS = [
  { path: '/dashboard', labelKey: 'portal.nav_home', icon: IconHome2 },
  { path: '/booking', labelKey: 'portal.nav_my_room', icon: IconBed },
  { path: '/announcements', labelKey: 'portal.nav_announcements', icon: IconSpeakerphone },
  { path: '/financial', labelKey: 'portal.nav_financial', icon: IconCreditCard },
  { path: '/profile', labelKey: 'portal.nav_profile', icon: IconUser },
];

const PAGE_TITLE_KEYS: Record<string, string> = {
  '/dashboard': 'portal.nav_home',
  '/booking': 'portal.nav_my_room',
  '/apply': 'portal.nav_apply',
  '/pre-reserve': 'portal.nav_apply',
  '/announcements': 'portal.nav_announcements',
  '/notifications': 'portal.nav_notifications',
  '/financial': 'portal.nav_financial',
  '/profile': 'portal.nav_profile',
};

// ─── Desktop sidebar nav ──────────────────────────────────────────────────────

function SidebarNav() {
  const location = useLocation();
  const { student, logout } = useStudentAuth();
  const { unreadCount } = useNotifications();
  const { unreadCount: announcementCount } = useAnnouncements();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <Stack h="100%" justify="space-between" gap={0}>
      {/* Branded header */}
      <Box
        px="md"
        py="sm"
        style={{ borderBottom: '1px solid var(--mantine-color-default-border)', flexShrink: 0 }}
      >
        <Group gap="xs" align="center">
          <Box
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #1864AB, #0C8599)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <IconBed size={16} color="white" />
          </Box>
          <Box>
            <Text fw={800} size="sm" lh={1} style={{ letterSpacing: -0.3 }}>
              DOMAS
            </Text>
            <Text size="xs" c="dimmed" lh={1} mt={2}>
              {t('portal.student_portal', { defaultValue: 'Student Portal' })}
            </Text>
          </Box>
        </Group>
      </Box>

      {/* Nav links */}
      <Box style={{ flex: 1, overflow: 'auto' }} py="sm" px="xs">
        <Stack gap={0}>
          <Text size="xs" fw={600} c="dimmed" px="xs" mb={4} tt="uppercase">
            {t('portal.nav_menu')}
          </Text>
          {NAV_ITEMS.map(({ path, labelKey, icon: Icon }) => {
            const isNotif = path === '/notifications';
            const isAnn = path === '/announcements';
            const active = location.pathname === path;

            let count = 0;
            if (isNotif) count = unreadCount;
            if (isAnn) count = announcementCount;

            return (
              <NavLink
                key={path}
                component={RouterNavLink}
                to={path}
                label={t(labelKey)}
                active={active}
                leftSection={
                  count > 0 ? (
                    <Indicator
                      inline
                      label={count > 9 ? '9+' : String(count)}
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

          <Divider my="xs" />

          <NavLink
            component={RouterNavLink}
            to="/profile"
            label={t('portal.nav_profile')}
            active={location.pathname === '/profile'}
            leftSection={
              <ThemeIcon variant="transparent" size="sm">
                <IconUser size={18} />
              </ThemeIcon>
            }
            style={{ borderRadius: 8 }}
          />
        </Stack>
      </Box>

      {/* User strip — click navigates to profile; logout is a separate button */}
      <Box px="xs" pb="sm" style={{ flexShrink: 0 }}>
        <Divider mb="sm" />
        <Group gap="xs" wrap="nowrap" px="xs">
          <UnstyledButton
            component={RouterNavLink}
            to="/profile"
            style={{ borderRadius: 8, padding: '6px 4px', flex: 1, minWidth: 0 }}
          >
            <Group gap="sm" wrap="nowrap">
              <Avatar size={34} radius="xl" color="blue">
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
            </Group>
          </UnstyledButton>
          <ActionIcon
            variant="subtle"
            color="red"
            size="lg"
            onClick={handleLogout}
            title={t('portal.sign_out')}
          >
            <IconLogout size={16} />
          </ActionIcon>
        </Group>
      </Box>
    </Stack>
  );
}

// ─── Mobile bottom tab bar (5 items) ─────────────────────────────────────────

function BottomTabBar() {
  const location = useLocation();
  const { unreadCount: announcementCount } = useAnnouncements();
  const { t } = useTranslation();

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
      {BOTTOM_NAV_ITEMS.map(({ path, labelKey, icon: Icon }) => {
        const isAnn = path === '/announcements';
        const active = location.pathname === path;
        const count = isAnn ? announcementCount : 0;

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
            {count > 0 ? (
              <Indicator
                inline
                label={count > 9 ? '9+' : String(count)}
                size={16}
                color="red"
                offset={2}
              >
                <Icon size={22} />
              </Indicator>
            ) : (
              <Icon size={22} />
            )}
            <span>{t(labelKey)}</span>
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
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const pageTitleKey = PAGE_TITLE_KEYS[location.pathname];
  const pageTitle = pageTitleKey ? t(pageTitleKey) : null;

  return (
    <Group h="100%" px="md" justify="space-between">
      {/* Logo + current page name */}
      <Group gap={6} align="center">
        <Title order={4} style={{ cursor: 'default', userSelect: 'none', letterSpacing: -0.5 }}>
          DOMAS
        </Title>
        {pageTitle && (
          <>
            <Text size="sm" c="dimmed" lh={1} style={{ userSelect: 'none' }}>
              ·
            </Text>
            <Text size="sm" c="dimmed" lh={1} style={{ userSelect: 'none' }}>
              {pageTitle}
            </Text>
          </>
        )}
      </Group>

      <Group gap="xs">
        {/* Notification bell — mobile only */}
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

        {/* Desktop: language + theme + user menu */}
        <Box visibleFrom="sm">
          <Group gap="xs">
            <LanguageSwitcher />
            <ThemeToggle />
            <Menu shadow="md" width={200} position="bottom-end">
              <Menu.Target>
                <UnstyledButton>
                  <Group gap="xs">
                    <Avatar size={30} radius="xl" color="blue">
                      {student?.firstName?.[0] ?? '?'}
                    </Avatar>
                    <Box visibleFrom="md">
                      <Text size="sm" fw={500} lh={1.2}>
                        {student?.firstName} {student?.lastName}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {student?.studentNumber}
                      </Text>
                    </Box>
                  </Group>
                </UnstyledButton>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item
                  component={RouterNavLink}
                  to="/profile"
                  leftSection={<IconUser size={14} />}
                >
                  {t('portal.nav_profile')}
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  color="red"
                  leftSection={<IconLogout size={14} />}
                  onClick={handleLogout}
                >
                  {t('portal.sign_out')}
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
        header={{ height: 60 }}
        navbar={{
          width: 260,
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

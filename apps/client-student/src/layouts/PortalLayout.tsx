import { useState } from 'react';
import { Outlet, NavLink as RouterNavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  ActionIcon,
  AppShell,
  Avatar,
  Box,
  Divider,
  Drawer,
  Group,
  Indicator,
  Menu,
  NavLink,
  Stack,
  Text,
  ThemeIcon,
  UnstyledButton,
} from '@domas/ui';
import { ThemeToggle, LanguageSwitcher, FontSizeControl } from '@domas/ui';
import { useTranslation } from 'react-i18next';
import {
  IconBell,
  IconBed,
  IconBuildingSkyscraper,
  IconCalendarPlus,
  IconCertificate,
  IconCreditCard,
  IconDots,
  IconHome2,
  IconLogout,
  IconMessageCircle,
  IconSpeakerphone,
  IconUser,
} from '@tabler/icons-react';
import { useStudentAuth } from '../contexts/StudentAuthContext';
import { useNotifications } from '../contexts/NotificationsContext';
import { useAnnouncements } from '../contexts/AnnouncementsContext';
import { useMessages } from '../contexts/MessagesContext';

// ─── Navigation definitions ───────────────────────────────────────────────────

const SIDEBAR_PRIMARY = [
  { path: '/dashboard', labelKey: 'portal.nav_home', icon: IconHome2 },
  { path: '/booking', labelKey: 'portal.nav_my_room', icon: IconBed },
  { path: '/financial', labelKey: 'portal.nav_financial', icon: IconCreditCard },
  { path: '/notifications', labelKey: 'portal.nav_notifications', icon: IconBell },
  { path: '/messages', labelKey: 'portal.nav_messages', icon: IconMessageCircle },
];

const SIDEBAR_SECONDARY = [
  { path: '/apply', labelKey: 'portal.nav_apply', icon: IconCalendarPlus },
  { path: '/announcements', labelKey: 'portal.nav_announcements', icon: IconSpeakerphone },
  { path: '/dorm-certificate', labelKey: 'portal.nav_dorm_certificate', icon: IconCertificate },
];

// 4 tabs shown directly in the bottom bar
const BOTTOM_MAIN_TABS = [
  { path: '/dashboard', labelKey: 'portal.nav_home', icon: IconHome2 },
  { path: '/booking', labelKey: 'portal.nav_my_room', icon: IconBed },
  { path: '/messages', labelKey: 'portal.nav_messages', icon: IconMessageCircle },
  { path: '/notifications', labelKey: 'portal.nav_notifications', icon: IconBell },
];

// Items reachable via the "More" drawer on mobile
const BOTTOM_MORE_TABS = [
  { path: '/apply', labelKey: 'portal.nav_apply', icon: IconCalendarPlus },
  { path: '/announcements', labelKey: 'portal.nav_announcements', icon: IconSpeakerphone },
  { path: '/dorm-certificate', labelKey: 'portal.nav_dorm_certificate', icon: IconCertificate },
  { path: '/financial', labelKey: 'portal.nav_financial', icon: IconCreditCard },
  { path: '/profile', labelKey: 'portal.nav_profile', icon: IconUser },
];

// ─── Desktop sidebar nav ──────────────────────────────────────────────────────

function SidebarNav() {
  const location = useLocation();
  const { logout } = useStudentAuth();
  const { unreadCount } = useNotifications();
  const { unreadCount: announcementCount } = useAnnouncements();
  const { unreadCount: messagesUnreadCount } = useMessages();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const renderNavItem = ({ path, labelKey, icon: Icon }: (typeof SIDEBAR_PRIMARY)[number]) => {
    const isNotif = path === '/notifications';
    const isAnn = path === '/announcements';
    const isMessages = path === '/messages';
    const active = location.pathname === path;
    const count = isNotif
      ? unreadCount
      : isAnn
        ? announcementCount
        : isMessages
          ? messagesUnreadCount
          : 0;

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
  };

  return (
    <Stack h="100%" justify="space-between" py="sm" px="xs">
      <Stack gap={2}>
        {SIDEBAR_PRIMARY.map(renderNavItem)}

        <Divider my="xs" />

        <Text
          size="xs"
          fw={600}
          c="dimmed"
          px="xs"
          mb={2}
          tt="uppercase"
          style={{ letterSpacing: '0.04em' }}
        >
          {t('portal.nav_more')}
        </Text>
        {SIDEBAR_SECONDARY.map(renderNavItem)}

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

        <NavLink
          label={t('portal.sign_out')}
          color="red"
          leftSection={
            <ThemeIcon variant="transparent" size="sm" color="red">
              <IconLogout size={18} />
            </ThemeIcon>
          }
          style={{ borderRadius: 8 }}
          onClick={handleLogout}
        />
      </Stack>
    </Stack>
  );
}

// ─── Mobile bottom tab bar ────────────────────────────────────────────────────

function BottomTabBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useStudentAuth();
  const { unreadCount } = useNotifications();
  const { unreadCount: announcementCount } = useAnnouncements();
  const { unreadCount: messagesUnreadCount } = useMessages();
  const { t } = useTranslation();
  const [moreOpen, setMoreOpen] = useState(false);

  // "More" button is active if the current route lives in the more-tabs list
  const moreActive = BOTTOM_MORE_TABS.some((tab) => location.pathname === tab.path);
  // Show badge on "More" if there are unread announcements (since that tab moved there)
  const moreBadgeCount = announcementCount;

  const handleLogout = async () => {
    setMoreOpen(false);
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <>
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
        {BOTTOM_MAIN_TABS.map(({ path, labelKey, icon: Icon }) => {
          const isNotif = path === '/notifications';
          const isMessages = path === '/messages';
          const active = location.pathname === path;
          const count = isNotif ? unreadCount : isMessages ? messagesUnreadCount : 0;

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

        {/* More button */}
        <UnstyledButton
          onClick={() => setMoreOpen(true)}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            color: moreActive ? 'var(--mantine-color-blue-filled)' : 'var(--mantine-color-dimmed)',
            fontSize: 10,
            fontWeight: moreActive ? 600 : 400,
          }}
        >
          {moreBadgeCount > 0 ? (
            <Indicator
              inline
              label={moreBadgeCount > 9 ? '9+' : String(moreBadgeCount)}
              size={16}
              color="red"
              offset={2}
            >
              <IconDots size={22} />
            </Indicator>
          ) : (
            <IconDots size={22} />
          )}
          <span>{t('portal.nav_more')}</span>
        </UnstyledButton>
      </Box>

      {/* More drawer — slides up from bottom */}
      <Drawer
        opened={moreOpen}
        onClose={() => setMoreOpen(false)}
        position="bottom"
        size="auto"
        title={t('portal.more_menu_title')}
        hiddenFrom="sm"
        styles={{
          content: { borderRadius: '16px 16px 0 0' },
          header: { paddingBottom: 8 },
          body: { paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' },
        }}
      >
        <Stack gap={2}>
          {BOTTOM_MORE_TABS.map(({ path, labelKey, icon: Icon }) => {
            const isAnn = path === '/announcements';
            const active = location.pathname === path;
            const count = isAnn ? announcementCount : 0;

            return (
              <NavLink
                key={path}
                component={RouterNavLink}
                to={path}
                label={t(labelKey)}
                active={active}
                onClick={() => setMoreOpen(false)}
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
            label={t('portal.sign_out')}
            color="red"
            leftSection={
              <ThemeIcon variant="transparent" size="sm" color="red">
                <IconLogout size={18} />
              </ThemeIcon>
            }
            style={{ borderRadius: 8 }}
            onClick={handleLogout}
          />
        </Stack>
      </Drawer>
    </>
  );
}

// ─── Top header bar ───────────────────────────────────────────────────────────

function TopBar() {
  const { student, logout } = useStudentAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <Group h="100%" px="md" justify="space-between">
      <Group gap={8} style={{ cursor: 'default', userSelect: 'none' }}>
        <IconBuildingSkyscraper size={22} stroke={1.5} color="var(--mantine-color-indigo-6)" />
        <Text fw={700} size="md" style={{ letterSpacing: '-0.01em' }}>
          DOMAS
        </Text>
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
            <FontSizeControl />
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
          width: 220,
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

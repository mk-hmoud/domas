import { Group, Text, Code } from '@mantine/core';
import { DashboardLayout as SharedDashboardLayout } from '@domas/ui';
import {
  IconUsers,
  IconChartBar,
  IconSettings,
  IconBuildingSkyscraper,
  IconLayoutDashboard,
} from '@tabler/icons-react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@domas/client-core';
import { useTranslation } from 'react-i18next';

export function DashboardLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  const navData = [
    { label: t('nav.dashboard'), icon: IconLayoutDashboard, link: '/dashboard' },
    {
      label: t('nav.user_management'),
      icon: IconUsers,
      links: [
        { label: t('nav.all_users'), link: '/dashboard/users' },
        { label: t('nav.students'), link: '/dashboard/students' },
        { label: t('nav.bookings'), link: '/dashboard/bookings' },
        { label: t('nav.roles'), link: '/dashboard/roles' },
        { label: t('nav.permissions'), link: '/dashboard/permissions' },
      ],
    },
    {
      label: t('nav.monitoring'),
      icon: IconChartBar,
      links: [
        { label: t('nav.audit_logs'), link: '/dashboard/logs/audit' },
        { label: t('nav.system_logs'), link: '/dashboard/logs/system' },
        { label: t('nav.access_logs'), link: '/dashboard/logs/access' },
        { label: t('nav.analytics'), link: '/dashboard/analytics' },
      ],
    },
    {
      label: t('nav.system'),
      icon: IconSettings,
      links: [
        { label: t('nav.semesters'), link: '/dashboard/semesters' },
        { label: t('nav.locations'), link: '/dashboard/locations' },
        { label: t('nav.settings'), link: '/dashboard/settings' },
        { label: t('nav.backups'), link: '/dashboard/backups' },
      ],
    },
  ];

  return (
    <SharedDashboardLayout
      navData={navData}
      onNavigate={(link) => navigate(link)}
      user={user || undefined}
      onLogout={logout}
      headerLogo={
        <Group gap={8}>
          <IconBuildingSkyscraper size={28} />
          <Text fw={700} size="lg">
            ADMIN
          </Text>
          <Code fw={700} ml="xs">
            v1.0.0
          </Code>
        </Group>
      }
    >
      <Outlet />
    </SharedDashboardLayout>
  );
}

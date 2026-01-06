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

const navData = [
  { label: 'Dashboard', icon: IconLayoutDashboard, link: '/dashboard' },
  {
    label: 'User Management',
    icon: IconUsers,
    links: [
      { label: 'All Users', link: '/dashboard/users' },
      { label: 'Roles', link: '/dashboard/roles' },
      { label: 'Permissions', link: '/dashboard/permissions' },
    ],
  },
  {
    label: 'Monitoring',
    icon: IconChartBar,
    links: [
      { label: 'Audit Logs', link: '/dashboard/logs/audit' },
      { label: 'System Logs', link: '/dashboard/logs/system' },
      { label: 'Access Logs', link: '/dashboard/logs/access' },
      { label: 'Analytics', link: '/dashboard/analytics' },
    ],
  },
  {
    label: 'System',
    icon: IconSettings,
    links: [
      { label: 'Semesters', link: '/dashboard/semesters' },
      { label: 'Locations', link: '/dashboard/locations' },
      { label: 'Settings', link: '/dashboard/settings' },
      { label: 'Backups', link: '/dashboard/backups' },
    ],
  },
];

export function DashboardLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

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

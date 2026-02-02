import { useMemo } from 'react';
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
  const { user, logout, hasPermission } = useAuth();
  const { t } = useTranslation();

  const navData = useMemo(() => {
    const rawData = [
      {
        label: t('nav.dashboard'),
        icon: IconLayoutDashboard,
        link: '/dashboard',
        // Dashboard is public to authenticated users.
      },
      {
        label: t('nav.user_management'),
        icon: IconUsers,
        links: [
          { label: t('nav.all_users'), link: '/dashboard/users', requiredPermission: 'users.view' },
          {
            label: t('nav.students'),
            link: '/dashboard/students',
            requiredPermission: 'students.view',
          },
          {
            label: t('nav.bookings'),
            link: '/dashboard/bookings',
            requiredPermission: 'bookings.view',
          },
          {
            label: t('nav.accounting'),
            link: '/dashboard/accounting',
            requiredPermission: 'bookings.approve_financial',
          },
          { label: t('nav.roles'), link: '/dashboard/roles', requiredPermission: 'roles.manage' },
          {
            label: t('nav.permissions'),
            link: '/dashboard/permissions',
            requiredPermission: 'permissions.view',
          },
        ],
      },
      {
        label: t('nav.monitoring'),
        icon: IconChartBar,
        links: [
          {
            label: t('nav.audit_logs'),
            link: '/dashboard/logs/audit',
            requiredPermission: 'audit.view',
          },
          {
            label: t('nav.system_logs'),
            link: '/dashboard/logs/system',
            requiredPermission: 'audit.view',
          }, // Assuming audit.view covers logs
          {
            label: t('nav.access_logs'),
            link: '/dashboard/logs/access',
            requiredPermission: 'audit.view',
          },
          {
            label: t('nav.analytics'),
            link: '/dashboard/analytics',
            requiredPermission: 'reports.view',
          },
        ],
      },
      {
        label: t('nav.system'),
        icon: IconSettings,
        links: [
          {
            label: t('nav.semesters'),
            link: '/dashboard/semesters',
            requiredPermission: 'semesters.view',
          },
          {
            label: t('nav.locations'),
            link: '/dashboard/locations',
            requiredPermission: 'locations.view',
          },
          { label: t('nav.settings'), link: '/dashboard/settings' }, // No permission required yet
          { label: t('nav.backups'), link: '/dashboard/backups' }, // No permission required yet
        ],
      },
    ];

    // Filter logic
    return rawData
      .map((item) => {
        // If item has sub-links, filter them
        if (item.links) {
          const filteredLinks = item.links.filter((link) => hasPermission(link.requiredPermission));
          if (filteredLinks.length > 0) {
            return { ...item, links: filteredLinks };
          }
          // If no sub-links remain, check if the group itself has a permission (if we added one)
          // or just hide the empty group.
          return null;
        }

        // If item is a direct link
        // (We didn't add requiredPermission to top-level items yet, but good to check if we did)
        if (hasPermission((item as any).requiredPermission)) {
          return item;
        }
        return null;
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [t, user]);

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
            DOMAS
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

import { Group, Text, Code } from '@mantine/core';
import { DashboardLayout as SharedDashboardLayout } from '@domas/ui';
import { IconGauge, IconBed, IconAlertCircle, IconBuildingSkyscraper } from '@tabler/icons-react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@domas/client-core';
import { useTranslation } from 'react-i18next';

export function DashboardLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  const navData = [
    { label: t('nav.overview'), icon: IconGauge, link: '/dashboard' },
    {
      label: t('nav.management'),
      icon: IconBed,
      links: [
        { label: t('nav.students'), link: '/dashboard/students' },
        { label: t('nav.staff'), link: '/dashboard/staff' },
        { label: t('nav.locations'), link: '/dashboard/locations' },
      ],
    },
    {
      label: t('nav.support'),
      icon: IconAlertCircle,
      links: [{ label: t('nav.complaints'), link: '/dashboard/complaints' }],
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
            DORM
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

import { useMemo, useState, useEffect } from 'react';
import { Group, Text, Code } from '@mantine/core';
import { DashboardLayout as SharedDashboardLayout, UndoHistoryDrawer } from '@domas/ui';
import {
  IconBuildingSkyscraper,
  IconLayoutDashboard,
  IconArchive,
  IconDoorEnter,
  IconAddressBook,
  IconSettings,
  IconDatabase,
} from '@tabler/icons-react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@domas/client-core';
import { useTranslation } from 'react-i18next';
import { audit } from '@domas/api-client';
import { UndoLog } from '@domas/ts-types';
import { notifications } from '@mantine/notifications';

export function DashboardLayout() {
  const navigate = useNavigate();
  const { user, logout, hasPermission } = useAuth();
  const { t } = useTranslation();

  // Undo History State
  const [historyOpened, setHistoryOpened] = useState(false);
  const [historyData, setHistoryData] = useState<UndoLog[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await audit.getRecentUndos();
      setHistoryData(data);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (historyOpened) {
      fetchHistory();
    }
  }, [historyOpened]);

  const handleUndo = async (id: string) => {
    try {
      await audit.undo(id);
      notifications.show({
        title: t('success'),
        message: t('undo_success'),
        color: 'green',
      });
      fetchHistory();
      window.dispatchEvent(new CustomEvent('domas:data-changed'));
    } catch (error) {
      notifications.show({
        title: t('error'),
        message: t('failed_to_undo'),
        color: 'red',
      });
    }
  };

  const navData = useMemo(() => {
    const rawData = [
      {
        label: t('nav.dashboard'),
        icon: IconLayoutDashboard,
        link: '/dashboard',
      },
      {
        label: t('nav.operations'),
        icon: IconDoorEnter,
        links: [
          {
            label: t('nav.bookings'),
            link: '/dashboard/bookings',
            requiredPermission: 'bookings.view',
          },
          {
            label: t('nav.check_in'),
            link: '/dashboard/check-in',
            requiredPermission: 'bookings.check_in',
          },
          {
            label: t('nav.check_out'),
            link: '/dashboard/check-out',
            requiredPermission: 'bookings.check_in',
          },
          {
            label: t('nav.accounting'),
            link: '/dashboard/accounting',
            requiredPermission: 'bookings.approve_financial',
          },
        ],
      },
      {
        label: t('nav.registry'),
        icon: IconAddressBook,
        links: [
          {
            label: t('nav.students'),
            link: '/dashboard/students',
            requiredPermission: 'students.view',
          },
          {
            label: t('nav.access_cards'),
            link: '/dashboard/access-cards',
            requiredPermission: 'access_cards.view',
          },
        ],
      },
      {
        label: t('nav.inventory_assets'),
        icon: IconArchive,
        links: [
          {
            label: t('nav.inventory_catalog'),
            link: '/dashboard/inventory/catalog',
            requiredPermission: 'inventory.manage',
          },
          {
            label: t('nav.inventory_templates'),
            link: '/dashboard/inventory/templates',
            requiredPermission: 'inventory.manage',
          },
          {
            label: t('nav.damages'),
            link: '/dashboard/damages',
            requiredPermission: 'damages.view',
          },
        ],
      },
      {
        label: t('nav.management'),
        icon: IconSettings,
        links: [
          {
            label: t('nav.locations'),
            link: '/dashboard/locations',
            requiredPermission: 'locations.view',
          },
          {
            label: t('nav.semesters'),
            link: '/dashboard/semesters',
            requiredPermission: 'semesters.view',
          },
          {
            label: t('nav.all_users'),
            link: '/dashboard/users',
            requiredPermission: 'users.view',
          },
          {
            label: t('nav.roles'),
            link: '/dashboard/roles',
            requiredPermission: 'roles.manage',
          },
        ],
      },
      {
        label: t('nav.system'),
        icon: IconDatabase,
        links: [
          {
            label: t('nav.audit_logs'),
            link: '/dashboard/logs/audit',
            requiredPermission: 'audit.view',
          },
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
    <>
      <SharedDashboardLayout
        navData={navData}
        onNavigate={(link) => navigate(link)}
        user={user || undefined}
        onLogout={logout}
        onShowHistory={() => setHistoryOpened(true)}
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

      <UndoHistoryDrawer
        opened={historyOpened}
        onClose={() => setHistoryOpened(false)}
        data={historyData}
        loading={historyLoading}
        onUndo={handleUndo}
        currentUserId={user?.id}
        canSeeAll={hasPermission('undo.all')}
      />
    </>
  );
}

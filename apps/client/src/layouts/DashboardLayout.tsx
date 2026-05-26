import { useMemo, useState, useEffect } from 'react';
import { useNavStats } from '../hooks/useNavStats';
import { Group, Text } from '@mantine/core';
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
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@domas/client-core';
import { useTranslation } from 'react-i18next';
import { audit } from '@domas/api-client';
import { UndoLog } from '@domas/ts-types';
import { notifications } from '@mantine/notifications';

export function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, hasPermission } = useAuth();
  const navStats = useNavStats();
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
            label: t('nav.transfers'),
            link: '/dashboard/transfers',
            requiredPermission: 'bookings.view',
          },
          {
            label: t('nav.check_in'),
            link: '/dashboard/check-in',
            requiredPermission: 'bookings.check_in',
            badge: navStats.bookings?.checkInsToday,
          },
          {
            label: t('nav.check_out'),
            link: '/dashboard/check-out',
            requiredPermission: 'bookings.check_in',
            badge: navStats.bookings?.checkOutsToday,
          },
          {
            label: t('nav.accounting'),
            link: '/dashboard/accounting',
            requiredPermission: 'bookings.approve_financial',
            badge: navStats.finances?.pendingAccounting,
          },
          {
            label: t('nav.guest_stays'),
            link: '/dashboard/guest-stays',
            requiredPermission: 'guests.manage',
          },
          {
            label: t('nav.room_changes'),
            link: '/dashboard/room-changes',
            requiredPermission: 'room_changes.view',
            badge: navStats.roomChanges?.pendingCount,
          },
          {
            label: t('nav.pre_reservations', { defaultValue: 'Pre-Reservations' }),
            link: '/dashboard/pre-reservations',
            requiredPermission: 'pre_reservations.view',
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
            badge: navStats.students?.pendingApplications,
          },
          {
            label: t('nav.dorm_certificates', 'Dorm Certificates'),
            link: '/dashboard/dorm-certificates',
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
            badge: navStats.damages?.pendingReports,
          },
        ],
      },
      {
        label: t('nav.management'),
        icon: IconSettings,
        links: [
          {
            label: t('nav.announcements'),
            link: '/dashboard/announcements',
            requiredPermission: 'announcements.manage',
          },
          {
            label: t('nav.locations'),
            link: '/dashboard/locations',
            requiredPermission: 'locations.view',
          },
          {
            label: t('nav.room_types', { defaultValue: 'Room Types' }),
            link: '/dashboard/room-types',
            requiredPermission: 'locations.update',
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

        // If item is a direct link with no permission requirement, always show it
        const requiredPermission = (item as any).requiredPermission;
        if (!requiredPermission || hasPermission(requiredPermission)) {
          return item;
        }
        return null;
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [t, user, navStats]);

  return (
    <>
      <SharedDashboardLayout
        navData={navData}
        onNavigate={(link) => navigate(link)}
        activeLink={location.pathname}
        user={user || undefined}
        onLogout={logout}
        onShowHistory={() => setHistoryOpened(true)}
        headerLogo={
          <Group gap={8}>
            <IconBuildingSkyscraper size={22} stroke={1.5} color="var(--mantine-color-indigo-6)" />
            <Text fw={700} size="md" style={{ letterSpacing: '-0.01em' }}>
              DOMAS
            </Text>
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

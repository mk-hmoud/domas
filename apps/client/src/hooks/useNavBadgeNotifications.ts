import { useEffect, useRef } from 'react';
import { notifications } from '@mantine/notifications';

interface NavLinkLike {
  label: string;
  link: string;
  badge?: number;
}

interface NavGroupLike {
  label: string;
  link?: string;
  links?: NavLinkLike[];
}

// Watches the badge counts on the (already permission-filtered) nav data and
// pops a toast whenever one increases, so staff notice new pending work
// (applications, check-ins, damage reports, etc.) without having to expand
// the sidebar group. Skips the first run so existing counts at login don't
// all fire at once.
export function useNavBadgeNotifications(navData: NavGroupLike[]) {
  const prevRef = useRef<Record<string, number> | null>(null);

  useEffect(() => {
    const current: Record<string, number> = {};
    const labels: Record<string, string> = {};
    for (const group of navData) {
      for (const l of group.links ?? []) {
        if (typeof l.badge === 'number') {
          current[l.link] = l.badge;
          labels[l.link] = l.label;
        }
      }
    }

    const prev = prevRef.current;
    if (prev) {
      for (const [link, value] of Object.entries(current)) {
        const prevValue = prev[link] ?? 0;
        if (value > prevValue) {
          notifications.show({
            title: labels[link],
            message: `${value - prevValue} new`,
            color: 'red',
          });
        }
      }
    }
    prevRef.current = current;
  }, [navData]);
}

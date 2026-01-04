import { Title, Text, Container, Flex, Box, Group, Code } from '@mantine/core';
import { NavbarNested } from '@domas/ui';
import {
  IconGauge,
  IconUserShield,
  IconCalendarEvent,
  IconSettings,
  IconBuildingSkyscraper,
  IconKey,
} from '@tabler/icons-react';

const navData = [
  { label: 'Overview', icon: IconGauge, link: '/dashboard' },
  {
    label: 'User Management',
    icon: IconUserShield,
    links: [
      { label: 'Staff Accounts', link: '/dashboard/staff' },
      { label: 'Permissions', link: '/dashboard/permissions' },
    ],
  },
  {
    label: 'Academic',
    icon: IconCalendarEvent,
    links: [
      { label: 'Semesters', link: '/dashboard/semesters' },
      { label: 'Holidays', link: '/dashboard/holidays' },
    ],
  },
  {
    label: 'Security',
    icon: IconKey,
    links: [
      { label: 'Audit Logs', link: '/dashboard/logs' },
      { label: 'API Keys', link: '/dashboard/api' },
    ],
  },
  { label: 'System Settings', icon: IconSettings, link: '/dashboard/settings' },
];

export function DashboardPage() {
  return (
    <Flex h="100vh">
      <NavbarNested
        data={navData}
        header={
          <Group justify="space-between">
            <Group gap={8}>
              <IconBuildingSkyscraper size={28} />
              <Text fw={700} size="lg">
                DOMAS-ADMIN
              </Text>
            </Group>
            <Code fw={700}>v1.0.0</Code>
          </Group>
        }
      />
      <Box style={{ flex: 1, overflowY: 'auto' }}>
        <Container size="lg" py="xl">
          <Title>Admin Dashboard</Title>
          <Text mt="md">Manage the entire dormitory system from here.</Text>
        </Container>
      </Box>
    </Flex>
  );
}

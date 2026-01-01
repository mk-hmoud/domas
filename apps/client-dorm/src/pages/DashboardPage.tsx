import { Title, Text, Container, Flex, Box, Group, Code } from '@mantine/core';
import { NavbarNested } from '@domas/ui';
import {
  IconGauge,
  IconUsers,
  IconBed,
  IconAlertCircle,
  IconSettings,
  IconBuildingSkyscraper,
} from '@tabler/icons-react';

const navData = [
  { label: 'Dashboard', icon: IconGauge, link: '/dashboard' },
  {
    label: 'Students',
    icon: IconUsers,
    links: [
      { label: 'All Students', link: '/dashboard/students' },
      { label: 'Add Student', link: '/dashboard/students/new' },
    ],
  },
  {
    label: 'Rooms',
    icon: IconBed,
    links: [
      { label: 'Room List', link: '/dashboard/rooms' },
      { label: 'Maintenance', link: '/dashboard/rooms/maintenance' },
    ],
  },
  {
    label: 'Complaints',
    icon: IconAlertCircle,
    links: [
      { label: 'Open Issues', link: '/dashboard/complaints' },
      { label: 'Resolved', link: '/dashboard/complaints/resolved' },
    ],
  },
  { label: 'Settings', icon: IconSettings, link: '/dashboard/settings' },
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
                DOMAS
              </Text>
            </Group>
            <Code fw={700}>v1.0.0</Code>
          </Group>
        }
      />
      <Box style={{ flex: 1, overflowY: 'auto' }}>
        <Container size="lg" py="xl">
          <Title>Dashboard</Title>
          <Text mt="md">Welcome to the dormitory management dashboard.</Text>
        </Container>
      </Box>
    </Flex>
  );
}

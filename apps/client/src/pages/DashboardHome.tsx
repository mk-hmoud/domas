import { Title, Text, Container } from '@mantine/core';

export function DashboardHome() {
  return (
    <Container size="lg" py="xl">
      <Title>Admin Dashboard</Title>
      <Text mt="md">Manage the entire dormitory system from here.</Text>
    </Container>
  );
}

import { Title, Text, Container } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@domas/client-core';

export function DashboardHome() {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <Container size="lg" py="xl">
      <Title>{t('dashboard.welcome_user', { email: user?.email })}</Title>
      <Text mt="md">{t('dashboard.staff_portal_intro')}</Text>
    </Container>
  );
}

import { AuthenticationForm, ThemeToggle, LanguageSwitcher } from '@domas/ui';
import { Center, Group, Box } from '@mantine/core';
import { useNavigate } from 'react-router-dom';

export function LoginPage() {
  const navigate = useNavigate();

  return (
    <>
      <Box pos="absolute" top={20} right={20}>
        <Group>
          <LanguageSwitcher />
          <ThemeToggle />
        </Group>
      </Box>
      <Center h="100vh">
        <AuthenticationForm onSubmit={() => navigate('/dashboard')} />
      </Center>
    </>
  );
}

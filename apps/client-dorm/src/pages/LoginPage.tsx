import { AuthenticationForm, ThemeToggle, LanguageSwitcher } from '@domas/ui';
import { Center, Group, Box } from '@mantine/core';

export function LoginPage() {
  return (
    <>
      <Box pos="absolute" top={20} right={20}>
        <Group>
          <LanguageSwitcher />
          <ThemeToggle />
        </Group>
      </Box>
      <Center h="100vh">
        <AuthenticationForm />
      </Center>
    </>
  );
}

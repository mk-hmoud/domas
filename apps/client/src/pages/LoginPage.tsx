import { SharedLoginPage } from '@domas/client-core';
import logo from '../assets/eul-logo.png';
import { Image } from '@mantine/core';

export function LoginPage() {
  return (
    <SharedLoginPage
      title="DOMAS"
      logo={<Image src={logo} h={150} w="auto" fit="contain" />}
      getRedirectPath={(user) =>
        user.permissions?.includes('rector.view') ? '/rector' : '/dashboard'
      }
    />
  );
}

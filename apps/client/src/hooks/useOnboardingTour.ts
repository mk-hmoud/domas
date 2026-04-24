import { useEffect, useRef } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import i18n from 'i18next';

interface UseOnboardingTourOptions {
  onboardingNeeded: boolean;
  completeOnboarding: () => Promise<void>;
}

export function useOnboardingTour({
  onboardingNeeded,
  completeOnboarding,
}: UseOnboardingTourOptions) {
  const started = useRef(false);

  useEffect(() => {
    if (!onboardingNeeded || started.current) return;

    // Wait one frame so the layout is fully painted before highlighting
    const timer = setTimeout(() => {
      started.current = true;
      const t = (key: string) => i18n.t(key);

      const driverObj = driver({
        showProgress: true,
        allowClose: false,
        nextBtnText: t('onboarding.next'),
        prevBtnText: t('onboarding.prev'),
        doneBtnText: t('onboarding.done'),
        onDestroyStarted: () => {
          driverObj.destroy();
          completeOnboarding();
        },
        steps: [
          {
            popover: {
              title: t('onboarding.steps.welcome.title'),
              description: t('onboarding.steps.welcome.description'),
            },
          },
          {
            element: '#domas-header',
            popover: {
              title: t('onboarding.steps.header.title'),
              description: t('onboarding.steps.header.description'),
              side: 'bottom',
              align: 'start',
            },
          },
          {
            element: '#domas-user-menu',
            popover: {
              title: t('onboarding.steps.user_menu.title'),
              description: t('onboarding.steps.user_menu.description'),
              side: 'bottom',
              align: 'end',
            },
          },
          {
            element: '#domas-navbar',
            popover: {
              title: t('onboarding.steps.navbar.title'),
              description: t('onboarding.steps.navbar.description'),
              side: 'right',
              align: 'start',
            },
          },
          {
            element: '#domas-content',
            popover: {
              title: t('onboarding.steps.content.title'),
              description: t('onboarding.steps.content.description'),
              side: 'left',
              align: 'start',
            },
          },
        ],
      });

      driverObj.drive();
    }, 100);

    return () => clearTimeout(timer);
  }, [onboardingNeeded, completeOnboarding]);
}

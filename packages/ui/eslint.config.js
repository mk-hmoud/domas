import { reactConfig } from '@domas/eslint-config/react';

export default [
  ...reactConfig,
  {
    // Any package-specific overrides go here
    ignores: ['dist'],
  },
];

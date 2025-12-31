import { reactConfig } from '@domas/eslint-config/react';

export default [
  ...reactConfig,
  {
    // Any app-specific overrides go here
    ignores: ['dist'],
  },
];
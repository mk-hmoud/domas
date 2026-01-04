import { reactConfig } from '@domas/eslint-config/react';

export default [
  ...reactConfig,
  {
    ignores: ['dist'],
  },
];

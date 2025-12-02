import { baseConfig } from '@domas/eslint-config/base';

export default [
  ...baseConfig,
  {
    // Any package-specific overrides go here
    ignores: ['dist'],
  },
];

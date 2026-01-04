import { baseConfig } from '@domas/eslint-config/base';

export default [
  ...baseConfig,
  {
    ignores: ['dist'],
  },
];

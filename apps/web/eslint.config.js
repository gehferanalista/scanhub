import { criarConfig } from '@scanhub/eslint-config'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default criarConfig({
  tsconfigRootDir: import.meta.dirname,
  ambiente: 'browser',
  extends: [reactHooks.configs.flat['recommended-latest'], reactRefresh.configs.vite],
  overrides: [
    {
      // shadcn/ui exporta variantes junto dos componentes
      files: ['src/components/ui/**'],
      rules: { 'react-refresh/only-export-components': 'off' },
    },
  ],
})

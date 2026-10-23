import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import globals from 'globals'
import tseslint from 'typescript-eslint'

/**
 * Configuração base do ESLint para os pacotes TypeScript do monorepo.
 *
 * @param {object} opcoes
 * @param {string} opcoes.tsconfigRootDir Diretório do pacote (use `import.meta.dirname`).
 * @param {'browser' | 'node'} opcoes.ambiente Globais disponíveis no código.
 * @param {import('typescript-eslint').ConfigArray} [opcoes.extends] Configs extras aplicadas aos arquivos TS (ex.: plugins de React).
 * @param {import('typescript-eslint').ConfigArray} [opcoes.overrides] Ajustes por pasta, aplicados depois da base.
 */
export function criarConfig({ tsconfigRootDir, ambiente, extends: extras = [], overrides = [] }) {
  return tseslint.config(
    { ignores: ['dist', 'coverage'] },
    {
      files: ['**/*.{ts,tsx}'],
      extends: [js.configs.recommended, tseslint.configs.recommendedTypeChecked, ...extras],
      languageOptions: {
        ecmaVersion: 2023,
        globals: globals[ambiente],
        parserOptions: { projectService: true, tsconfigRootDir },
      },
      rules: {
        '@typescript-eslint/consistent-type-imports': 'error',
        '@typescript-eslint/no-unused-vars': [
          'error',
          { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
        ],
        '@typescript-eslint/no-misused-promises': [
          'error',
          { checksVoidReturn: { attributes: false } },
        ],
      },
    },
    ...overrides,
    prettier,
  )
}

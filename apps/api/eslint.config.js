import { criarConfig } from '@scanhub/eslint-config'

export default criarConfig({ tsconfigRootDir: import.meta.dirname, ambiente: 'node' })

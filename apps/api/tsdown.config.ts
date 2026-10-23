import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: { server: 'src/server.ts', migrar: 'src/db/migrar.ts' },
  format: 'esm',
  platform: 'node',
  target: 'node24',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  // O pacote compartilhado é publicado como TypeScript; entra no bundle em vez de ser importado
  noExternal: [/^@scanhub\//],
})

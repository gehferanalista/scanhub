import { resolve } from 'node:path'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import type { Db } from './banco'

/** Pasta das migrations (relativa ao diretório de execução; no Docker, a raiz da imagem). */
export const PASTA_MIGRATIONS = resolve(process.env.MIGRATIONS_DIR ?? 'drizzle')

export function aplicarMigrations(db: Db) {
  return migrate(db, { migrationsFolder: PASTA_MIGRATIONS })
}

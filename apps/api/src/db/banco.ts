import { sql } from 'drizzle-orm'
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import * as schema from './schema'

export type Db = NodePgDatabase<typeof schema>

export type Banco = {
  db: Db
  /** Confirma que o banco responde (usado na verificação de saúde). */
  verificar(): Promise<void>
  fechar(): Promise<void>
}

type OpcoesBanco = {
  /** Erros de conexões ociosas; sem esse tratamento o processo inteiro cairia. */
  aoErroDeConexao?: (erro: Error) => void
}

export function conectarBanco(url: string, opcoes: OpcoesBanco = {}): Banco {
  const pool = new pg.Pool({
    connectionString: url,
    max: 10,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 30_000,
    application_name: 'scanhub-api',
  })
  pool.on('error', (erro) => opcoes.aoErroDeConexao?.(erro))

  const db = drizzle({ client: pool, schema, casing: 'snake_case' })

  return {
    db,
    verificar: async () => {
      await db.execute(sql`select 1`)
    },
    fechar: () => pool.end(),
  }
}

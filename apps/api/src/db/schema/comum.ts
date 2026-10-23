import { timestamp } from 'drizzle-orm/pg-core'

/** Data/hora sempre com fuso, gravada em UTC. */
export const dataHora = () => timestamp({ withTimezone: true })

/** Colunas de controle presentes nas tabelas que podem ser alteradas. */
export const controle = {
  criadoEm: dataHora().notNull().defaultNow(),
  atualizadoEm: dataHora()
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
}

import { PERFIS } from '@scanhub/shared'
import { sql } from 'drizzle-orm'
import {
  boolean,
  index,
  inet,
  integer,
  pgEnum,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { controle, dataHora } from './comum'

export const perfilUsuario = pgEnum('perfil_usuario', PERFIS)

export const usuarios = pgTable(
  'usuarios',
  {
    id: uuid().primaryKey().defaultRandom(),
    nome: text().notNull(),
    email: text().notNull(),
    senhaHash: text().notNull(),
    perfil: perfilUsuario().notNull(),
    /** Usuários nunca são apagados, só desativados, para preservar o histórico. */
    ativo: boolean().notNull().default(true),
    /** Obriga a troca no próximo login (primeiro acesso ou senha redefinida pelo admin). */
    deveTrocarSenha: boolean().notNull().default(true),
    tentativasFalhas: integer().notNull().default(0),
    bloqueadoAte: dataHora(),
    ultimoAcessoEm: dataHora(),
    ...controle,
  },
  (t) => [uniqueIndex('usuarios_email_unico').on(sql`lower(${t.email})`)],
)

/** Sessões de login. O cookie guarda o token; aqui fica só o hash dele. */
export const sessoes = pgTable(
  'sessoes',
  {
    id: uuid().primaryKey().defaultRandom(),
    usuarioId: uuid()
      .notNull()
      .references(() => usuarios.id),
    tokenHash: text().notNull().unique('sessoes_token_hash_unico'),
    criadaEm: dataHora().notNull().defaultNow(),
    expiraEm: dataHora().notNull(),
    ultimoUsoEm: dataHora().notNull().defaultNow(),
    revogadaEm: dataHora(),
    ip: inet(),
    userAgent: text(),
  },
  (t) => [index('sessoes_usuario').on(t.usuarioId)],
)

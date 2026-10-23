import { bigint, index, inet, jsonb, pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { dataHora } from './comum'
import { usuarios } from './usuarios'

/**
 * Registro de tudo que altera dados ou envolve acesso. Só aceita inclusão: alteração e
 * exclusão são bloqueadas por trigger.
 */
export const auditoria = pgTable(
  'auditoria',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    ocorridoEm: dataHora().notNull().defaultNow(),
    /** Vazio em ações do sistema (ex.: sincronização com o ERP) */
    usuarioId: uuid().references(() => usuarios.id),
    /** Ex.: documento.anexado, documento.excluido, usuario.criado, login.falhou */
    acao: text().notNull(),
    entidade: text().notNull(),
    entidadeId: text(),
    /** Detalhes da ação (ex.: motivo da exclusão, nome do arquivo) */
    dados: jsonb().$type<Record<string, unknown>>(),
    ip: inet(),
    requestId: text(),
  },
  (t) => [
    index('auditoria_entidade').on(t.entidade, t.entidadeId),
    index('auditoria_ocorrido_em').on(t.ocorridoEm),
    index('auditoria_usuario').on(t.usuarioId),
  ],
)

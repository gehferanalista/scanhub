import { sql } from 'drizzle-orm'
import { boolean, check, index, integer, pgEnum, pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { controle, dataHora } from './comum'
import { notasFiscais } from './notas-fiscais'
import { usuarios } from './usuarios'

export const tiposDocumento = pgTable('tipos_documento', {
  id: uuid().primaryKey().defaultRandom(),
  nome: text().notNull().unique('tipos_documento_nome_unico'),
  ativo: boolean().notNull().default(true),
  /** Posição na lista de seleção */
  ordem: integer().notNull().default(0),
  ...controle,
})

export const origemDocumento = pgEnum('origem_documento', ['upload', 'scanner'])

/**
 * Documento comprobatório vinculado a uma nota. O arquivo fica no armazenamento de objetos;
 * aqui ficam os metadados. A exclusão é sempre lógica, com motivo.
 */
export const documentos = pgTable(
  'documentos',
  {
    id: uuid().primaryKey().defaultRandom(),
    notaFiscalId: uuid()
      .notNull()
      .references(() => notasFiscais.id),
    tipoDocumentoId: uuid()
      .notNull()
      .references(() => tiposDocumento.id),
    /** Código curto exibido na tela (ex.: REF-0UV5M364) */
    referencia: text().notNull().unique('documentos_referencia_unica'),
    nomeArquivo: text().notNull(),
    mimeType: text().notNull(),
    tamanhoBytes: integer().notNull(),
    /** Hash do conteúdo, para detectar adulteração ou corrupção do arquivo */
    sha256: text().notNull(),
    /** Caminho do arquivo no armazenamento de objetos */
    chaveArmazenamento: text().notNull().unique('documentos_chave_armazenamento_unica'),
    origem: origemDocumento().notNull(),
    enviadoPorId: uuid()
      .notNull()
      .references(() => usuarios.id),
    enviadoEm: dataHora().notNull().defaultNow(),
    excluidoEm: dataHora(),
    excluidoPorId: uuid().references(() => usuarios.id),
    motivoExclusao: text(),
  },
  (t) => [
    index('documentos_ativos_por_nota')
      .on(t.notaFiscalId)
      .where(sql`${t.excluidoEm} is null`),
    check('documentos_tamanho_positivo', sql`${t.tamanhoBytes} > 0`),
    // Ou o documento está ativo (sem dados de exclusão), ou foi excluído com quem, quando e motivo.
    // Atenção: um CHECK que resulta em NULL é aceito, por isso o coalesce no motivo.
    check(
      'documentos_exclusao_completa',
      sql`(${t.excluidoEm} is null and ${t.excluidoPorId} is null and ${t.motivoExclusao} is null)
        or (${t.excluidoEm} is not null and ${t.excluidoPorId} is not null
            and length(trim(coalesce(${t.motivoExclusao}, ''))) > 0)`,
    ),
  ],
)

/** Observações da nota. Não podem ser editadas nem apagadas (garantido por trigger). */
export const observacoes = pgTable(
  'observacoes',
  {
    id: uuid().primaryKey().defaultRandom(),
    notaFiscalId: uuid()
      .notNull()
      .references(() => notasFiscais.id),
    autorId: uuid()
      .notNull()
      .references(() => usuarios.id),
    texto: text().notNull(),
    criadaEm: dataHora().notNull().defaultNow(),
  },
  (t) => [
    index('observacoes_por_nota').on(t.notaFiscalId),
    check('observacoes_texto_valido', sql`length(trim(${t.texto})) between 1 and 1000`),
  ],
)

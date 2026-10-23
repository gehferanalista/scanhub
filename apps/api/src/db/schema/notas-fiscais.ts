import { CODIGOS_BASE } from '@scanhub/shared'
import {
  bigint,
  boolean,
  date,
  index,
  numeric,
  pgEnum,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { controle, dataHora } from './comum'

export const baseErp = pgEnum('base_erp', CODIGOS_BASE)

/** Empresa/filial do Protheus. Cada base (Produção/Backup) tem as suas. */
export const empresas = pgTable(
  'empresas',
  {
    id: uuid().primaryKey().defaultRandom(),
    base: baseErp().notNull(),
    /** M0_CODIGO no Protheus */
    codigoEmpresa: text().notNull(),
    /** M0_CODFIL no Protheus */
    codigoFilial: text().notNull(),
    nome: text().notNull(),
    ativa: boolean().notNull().default(true),
    ...controle,
  },
  (t) => [uniqueIndex('empresas_codigo_erp').on(t.base, t.codigoEmpresa, t.codigoFilial)],
)

/**
 * Espelho das notas fiscais de saída do Protheus (SF2 + SA1), preenchido pelo sincronizador.
 * O Scanhub nunca escreve no ERP.
 */
export const notasFiscais = pgTable(
  'notas_fiscais',
  {
    id: uuid().primaryKey().defaultRandom(),
    empresaId: uuid()
      .notNull()
      .references(() => empresas.id),
    /** Código curto exibido na tela (ex.: REF-B9X6A0HV) */
    referencia: text().notNull().unique('notas_fiscais_referencia_unica'),
    /** F2_DOC */
    numero: text().notNull(),
    /** F2_SERIE */
    serie: text().notNull(),
    /** F2_CLIENTE / F2_LOJA */
    clienteCodigo: text().notNull(),
    clienteLoja: text().notNull(),
    /** A1_NOME */
    clienteNome: text().notNull(),
    /** A1_CGC: CNPJ ou CPF, só dígitos */
    clienteDocumento: text().notNull(),
    /** F2_EMISSAO */
    dataEmissao: date({ mode: 'string' }).notNull(),
    /** F2_VALBRUT */
    valorTotal: numeric({ precision: 15, scale: 2, mode: 'number' }).notNull(),
    /** F2_CHVNFE. Vazio na Base Backup, que não emite NF-e. */
    chaveAcesso: text(),
    /** R_E_C_N_O_ da SF2, para conferência com o ERP */
    erpRecno: bigint({ mode: 'number' }),
    /** Preenchido quando a nota é cancelada no ERP depois de espelhada */
    canceladaNoErpEm: dataHora(),
    sincronizadaEm: dataHora().notNull().defaultNow(),
    ...controle,
  },
  (t) => [
    uniqueIndex('notas_fiscais_chave_erp').on(
      t.empresaId,
      t.numero,
      t.serie,
      t.clienteCodigo,
      t.clienteLoja,
    ),
    index('notas_fiscais_emissao').on(t.dataEmissao),
    index('notas_fiscais_numero').on(t.numero),
    index('notas_fiscais_cliente_documento').on(t.clienteDocumento),
  ],
)

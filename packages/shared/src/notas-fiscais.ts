import { z } from 'zod'
import { documentoSchema, observacaoSchema } from './documentos'

export const CODIGOS_BASE = ['P', 'B'] as const
export const baseSchema = z.enum(CODIGOS_BASE)
export type Base = z.infer<typeof baseSchema>

export const BASES: Record<Base, { nome: string; descricao: string }> = {
  P: { nome: 'Base Produção', descricao: 'Operações com nota fiscal' },
  B: { nome: 'Base Backup', descricao: 'Operações sem nota fiscal' },
}

export const empresaSchema = z.object({ id: z.string(), nome: z.string() })
export type Empresa = z.infer<typeof empresaSchema>

export const notaFiscalSchema = z.object({
  id: z.string(),
  numero: z.string(),
  serie: z.string(),
  base: baseSchema,
  empresa: empresaSchema,
  dataEmissao: z.iso.date(),
  cliente: z.object({ nome: z.string(), cnpj: z.string() }),
  valorTotal: z.number(),
  quantidadeAnexos: z.number().int().nonnegative(),
})
export type NotaFiscal = z.infer<typeof notaFiscalSchema>

export const paginaNotasSchema = z.object({
  itens: z.array(notaFiscalSchema),
  total: z.number().int().nonnegative(),
  pagina: z.number().int().positive(),
  tamanhoPagina: z.number().int().positive(),
})
export type PaginaNotas = z.infer<typeof paginaNotasSchema>

export const notaFiscalDetalheSchema = notaFiscalSchema.omit({ quantidadeAnexos: true }).extend({
  referencia: z.string(),
  situacao: z.string(),
  documentos: z.array(documentoSchema),
  observacoes: z.array(observacaoSchema),
})
export type NotaFiscalDetalhe = z.infer<typeof notaFiscalDetalheSchema>

// ---------------------------------------------------------------------------
// Filtros da listagem
// ---------------------------------------------------------------------------

export const TAMANHO_PAGINA_PADRAO = 20
export const TAMANHO_PAGINA_MAXIMO = 100

export const campoOrdenacaoSchema = z.enum(['numero', 'empresa', 'emissao', 'cliente', 'valor'])
export type CampoOrdenacao = z.infer<typeof campoOrdenacaoSchema>

export const statusAnexoSchema = z.enum(['com', 'sem'])
export type StatusAnexo = z.infer<typeof statusAnexoSchema>

const textoOpcional = z
  .string()
  .trim()
  .transform((v) => v || undefined)
  .optional()
  .catch(undefined)

/**
 * Filtros da listagem de notas, no formato de query string. Valores inválidos caem no padrão
 * em vez de gerar erro, para que um link antigo ou editado à mão nunca quebre a tela.
 */
export const filtrosNotasSchema = z.object({
  numero: textoOpcional,
  cliente: textoOpcional,
  empresaId: textoOpcional,
  base: baseSchema.optional().catch(undefined),
  anexo: statusAnexoSchema.optional().catch(undefined),
  emissaoDe: z.iso.date().optional().catch(undefined),
  emissaoAte: z.iso.date().optional().catch(undefined),
  ordenarPor: campoOrdenacaoSchema.catch('emissao'),
  ordem: z.enum(['asc', 'desc']).catch('desc'),
  pagina: z.coerce.number().int().min(1).catch(1),
})
export type FiltrosNotas = z.infer<typeof filtrosNotasSchema>

/** Query string aceita por `GET /notas-fiscais`. */
export const listarNotasQuerySchema = filtrosNotasSchema.extend({
  tamanhoPagina: z.coerce
    .number()
    .int()
    .min(1)
    .max(TAMANHO_PAGINA_MAXIMO)
    .catch(TAMANHO_PAGINA_PADRAO),
})
export type ListarNotasQuery = z.infer<typeof listarNotasQuerySchema>

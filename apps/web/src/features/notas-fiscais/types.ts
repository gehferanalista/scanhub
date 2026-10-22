import { z } from 'zod'

export const baseSchema = z.enum(['P', 'B'])
export type Base = z.infer<typeof baseSchema>

export const BASES: Record<Base, { nome: string; descricao: string; className: string }> = {
  P: {
    nome: 'Base Produção',
    descricao: 'Operações com nota fiscal',
    className: 'bg-purple-100 text-purple-700',
  },
  B: {
    nome: 'Base Backup',
    descricao: 'Operações sem nota fiscal',
    className: 'bg-blue-100 text-blue-700',
  },
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

export const tipoDocumentoSchema = z.object({ id: z.string(), nome: z.string() })
export type TipoDocumento = z.infer<typeof tipoDocumentoSchema>

export const documentoSchema = z.object({
  id: z.string(),
  nomeArquivo: z.string(),
  mimeType: z.string(),
  tamanhoBytes: z.number().int().nonnegative(),
  tipo: tipoDocumentoSchema,
  referencia: z.string(),
  enviadoEm: z.iso.datetime(),
  enviadoPor: z.string(),
})
export type Documento = z.infer<typeof documentoSchema>

export const observacaoSchema = z.object({
  id: z.string(),
  texto: z.string(),
  autor: z.string(),
  criadaEm: z.iso.datetime(),
})
export type Observacao = z.infer<typeof observacaoSchema>

export const notaFiscalDetalheSchema = notaFiscalSchema.omit({ quantidadeAnexos: true }).extend({
  referencia: z.string(),
  situacao: z.string(),
  documentos: z.array(documentoSchema),
  observacoes: z.array(observacaoSchema),
})
export type NotaFiscalDetalhe = z.infer<typeof notaFiscalDetalheSchema>

/** Estado de navegação da lista para o detalhe: URL da lista (com filtros) para o "Voltar". */
export type EstadoDetalhe = { voltarPara: string }

/** Tipos de arquivo aceitos como documento comprobatório (formato do `accept` do react-dropzone). */
export const ANEXO_ACCEPT = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
}

export const TAMANHO_MAXIMO_ANEXO = 10 * 1024 * 1024

export const TAMANHO_MAXIMO_OBSERVACAO = 1000

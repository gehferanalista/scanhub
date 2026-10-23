import { z } from 'zod'

/** Tipos MIME aceitos como documento comprobatório e suas extensões. */
export const ANEXO_TIPOS_PERMITIDOS = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
} satisfies Record<string, string[]>

export const TAMANHO_MAXIMO_ANEXO = 10 * 1024 * 1024

export const TAMANHO_MAXIMO_OBSERVACAO = 1000

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

export const novaObservacaoSchema = z.object({
  texto: z
    .string()
    .trim()
    .min(1, 'Escreva a observação')
    .max(TAMANHO_MAXIMO_OBSERVACAO, `Use no máximo ${TAMANHO_MAXIMO_OBSERVACAO} caracteres`),
})
export type NovaObservacaoInput = z.infer<typeof novaObservacaoSchema>

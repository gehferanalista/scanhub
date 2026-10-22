import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { z } from 'zod'
import { baseSchema } from './types'

export const TAMANHO_PAGINA = 20

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

/** Filtros da listagem, lidos da URL. Valores inválidos caem no padrão em vez de quebrar a tela. */
export const filtrosSchema = z.object({
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
export type FiltrosNotas = z.infer<typeof filtrosSchema>

const PADROES: Partial<FiltrosNotas> = { ordenarPor: 'emissao', ordem: 'desc', pagina: 1 }

/** Remove todos os filtros de busca, preservando a ordenação. */
export const SEM_FILTROS: Partial<FiltrosNotas> = {
  numero: undefined,
  cliente: undefined,
  empresaId: undefined,
  base: undefined,
  anexo: undefined,
  emissaoDe: undefined,
  emissaoAte: undefined,
  pagina: 1,
}

export function lerFiltros(params: URLSearchParams): FiltrosNotas {
  return filtrosSchema.parse(Object.fromEntries(params))
}

/** Serializa só o que difere do padrão, para manter a URL limpa. */
export function paraSearchParams(filtros: FiltrosNotas): URLSearchParams {
  const params = new URLSearchParams()
  for (const [chave, valor] of Object.entries(filtros)) {
    if (valor === undefined || valor === '' || PADROES[chave as keyof FiltrosNotas] === valor)
      continue
    params.set(chave, String(valor))
  }
  return params
}

export function useFiltrosNotas() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filtros = useMemo(() => lerFiltros(searchParams), [searchParams])

  const atualizar = useCallback(
    (novos: Partial<FiltrosNotas>) => setSearchParams(paraSearchParams({ ...filtros, ...novos })),
    [filtros, setSearchParams],
  )

  return { filtros, atualizar }
}

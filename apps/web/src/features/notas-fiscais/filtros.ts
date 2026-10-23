import { filtrosNotasSchema, type FiltrosNotas } from '@scanhub/shared'
import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'

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
  return filtrosNotasSchema.parse(Object.fromEntries(params))
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

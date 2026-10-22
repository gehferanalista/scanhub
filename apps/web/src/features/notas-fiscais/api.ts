import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import { z } from 'zod'
import { api } from '@/lib/api'
import { TAMANHO_PAGINA, type FiltrosNotas } from './filtros'
import {
  documentoSchema,
  empresaSchema,
  notaFiscalDetalheSchema,
  observacaoSchema,
  paginaNotasSchema,
  tipoDocumentoSchema,
} from './types'

export const notasFiscaisQueries = {
  all: () => ['notas-fiscais'] as const,
  list: (filtros: FiltrosNotas) =>
    queryOptions({
      queryKey: [...notasFiscaisQueries.all(), 'list', filtros],
      queryFn: async ({ signal }) => {
        const { data } = await api.get<unknown>('/notas-fiscais', {
          params: { ...filtros, tamanhoPagina: TAMANHO_PAGINA },
          signal,
        })
        return paginaNotasSchema.parse(data)
      },
      placeholderData: keepPreviousData,
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: [...notasFiscaisQueries.all(), 'detail', id],
      queryFn: async ({ signal }) => {
        const { data } = await api.get<unknown>(`/notas-fiscais/${id}`, { signal })
        return notaFiscalDetalheSchema.parse(data)
      },
    }),
  arquivoDocumento: (documentoId: string) =>
    queryOptions({
      queryKey: ['documentos', documentoId, 'arquivo'],
      queryFn: async ({ signal }) => {
        const { data } = await api.get<Blob>(`/documentos/${documentoId}/arquivo`, {
          responseType: 'blob',
          signal,
        })
        return data
      },
      staleTime: Infinity,
      gcTime: 60_000,
    }),
  empresas: () =>
    queryOptions({
      queryKey: ['empresas'],
      queryFn: async () => {
        const { data } = await api.get<unknown>('/empresas')
        return z.array(empresaSchema).parse(data)
      },
      staleTime: Infinity,
    }),
  tiposDocumento: () =>
    queryOptions({
      queryKey: ['tipos-documento'],
      queryFn: async () => {
        const { data } = await api.get<unknown>('/tipos-documento')
        return z.array(tipoDocumentoSchema).parse(data)
      },
      staleTime: Infinity,
    }),
}

function baixarArquivo(blob: Blob, nome: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nome
  link.click()
  URL.revokeObjectURL(url)
}

/** Exporta todas as notas que atendem aos filtros (sem paginação) em CSV. */
export async function exportarNotas(filtros: FiltrosNotas) {
  const { pagina: _pagina, ...semPaginacao } = filtros
  const { data } = await api.get<Blob>('/notas-fiscais/exportar', {
    params: semPaginacao,
    responseType: 'blob',
  })
  baixarArquivo(data, `notas-fiscais-${new Date().toISOString().slice(0, 10)}.csv`)
}

type AnexarDocumentoInput = {
  notaId: string
  tipoDocumentoId: string
  arquivo: File
  onProgresso?: (percentual: number) => void
}

export async function anexarDocumento({
  notaId,
  tipoDocumentoId,
  arquivo,
  onProgresso,
}: AnexarDocumentoInput) {
  const form = new FormData()
  form.append('tipoDocumentoId', tipoDocumentoId)
  form.append('arquivo', arquivo)

  const { data } = await api.post<unknown>(`/notas-fiscais/${notaId}/documentos`, form, {
    onUploadProgress: (e) => {
      if (e.total) onProgresso?.(Math.round((e.loaded / e.total) * 100))
    },
  })
  return documentoSchema.parse(data)
}

export async function excluirDocumento(notaId: string, documentoId: string) {
  await api.delete(`/notas-fiscais/${notaId}/documentos/${documentoId}`)
}

export async function adicionarObservacao(notaId: string, texto: string) {
  const { data } = await api.post<unknown>(`/notas-fiscais/${notaId}/observacoes`, { texto })
  return observacaoSchema.parse(data)
}

import { delay, http, HttpResponse } from 'msw'
import type { LoginInput } from '@/features/auth/types'
import { lerFiltros, type FiltrosNotas } from '@/features/notas-fiscais/filtros'
import {
  ANEXO_ACCEPT,
  BASES,
  TAMANHO_MAXIMO_ANEXO,
  TAMANHO_MAXIMO_OBSERVACAO,
  type NotaFiscal,
} from '@/features/notas-fiscais/types'
import {
  empresasMock,
  gerarPdfExemplo,
  novaObservacao,
  novoDocumento,
  tiposDocumentoMock,
  usuarioMock,
} from './data'
import { db, encontrarNota, paraResumo } from './db'

const normalizar = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()

const comparadores: Record<FiltrosNotas['ordenarPor'], (a: NotaFiscal, b: NotaFiscal) => number> = {
  numero: (a, b) => Number(a.numero) - Number(b.numero),
  empresa: (a, b) => a.empresa.nome.localeCompare(b.empresa.nome, 'pt-BR'),
  emissao: (a, b) => a.dataEmissao.localeCompare(b.dataEmissao),
  cliente: (a, b) => a.cliente.nome.localeCompare(b.cliente.nome, 'pt-BR'),
  valor: (a, b) => a.valorTotal - b.valorTotal,
}

/** Reproduz no mock o filtro e a ordenação que o back-end fará. */
function buscarNotas(f: FiltrosNotas) {
  const cliente = f.cliente && normalizar(f.cliente)
  const digitosCliente = f.cliente?.replace(/\D/g, '')

  const filtradas = db.notas
    .map(paraResumo)
    .filter(
      (nf) =>
        (!f.numero || nf.numero.includes(f.numero)) &&
        (!cliente ||
          normalizar(nf.cliente.nome).includes(cliente) ||
          (!!digitosCliente && nf.cliente.cnpj.includes(digitosCliente))) &&
        (!f.empresaId || nf.empresa.id === f.empresaId) &&
        (!f.base || nf.base === f.base) &&
        (!f.anexo || (f.anexo === 'com') === nf.quantidadeAnexos > 0) &&
        (!f.emissaoDe || nf.dataEmissao >= f.emissaoDe) &&
        (!f.emissaoAte || nf.dataEmissao <= f.emissaoAte),
    )

  const sentido = f.ordem === 'asc' ? 1 : -1
  return filtradas.sort((a, b) => sentido * comparadores[f.ordenarPor](a, b))
}

function gerarCsv(notas: NotaFiscal[]) {
  const linhas = notas.map((nf) =>
    [
      nf.numero,
      nf.serie,
      BASES[nf.base].nome,
      nf.empresa.nome,
      nf.dataEmissao,
      nf.cliente.nome,
      nf.cliente.cnpj,
      nf.valorTotal.toFixed(2).replace('.', ','),
      nf.quantidadeAnexos > 0 ? 'Com anexo' : 'Sem anexo',
    ].join(';'),
  )
  const cabecalho = 'Número;Série;Base;Empresa;Emissão;Cliente;CNPJ;Valor;Status anexo'
  // BOM para o Excel reconhecer UTF-8
  return '﻿' + [cabecalho, ...linhas].join('\r\n')
}

const naoEncontrada = () =>
  HttpResponse.json({ message: 'Nota fiscal não encontrada' }, { status: 404 })

export const handlers = [
  http.post('*/api/auth/login', async ({ request }) => {
    await delay()
    const { email, senha } = (await request.json()) as LoginInput
    if (email !== usuarioMock.email || senha !== usuarioMock.senha) {
      return HttpResponse.json({ message: 'Credenciais inválidas' }, { status: 401 })
    }
    return HttpResponse.json({
      token: 'mock-token',
      usuario: { id: usuarioMock.id, nome: usuarioMock.nome, email: usuarioMock.email },
    })
  }),

  http.get('*/api/empresas', () =>
    HttpResponse.json(empresasMock.map(({ id, nome }) => ({ id, nome }))),
  ),

  http.get('*/api/tipos-documento', () => HttpResponse.json(tiposDocumentoMock)),

  http.get('*/api/notas-fiscais/exportar', async ({ request }) => {
    await delay()
    const filtros = lerFiltros(new URL(request.url).searchParams)
    return new HttpResponse(gerarCsv(buscarNotas(filtros)), {
      headers: { 'Content-Type': 'text/csv; charset=utf-8' },
    })
  }),

  http.get('*/api/notas-fiscais', async ({ request }) => {
    await delay()
    const params = new URL(request.url).searchParams
    const filtros = lerFiltros(params)
    const tamanhoPagina = Number(params.get('tamanhoPagina')) || 20
    const notas = buscarNotas(filtros)
    const inicio = (filtros.pagina - 1) * tamanhoPagina

    return HttpResponse.json({
      itens: notas.slice(inicio, inicio + tamanhoPagina),
      total: notas.length,
      pagina: filtros.pagina,
      tamanhoPagina,
    })
  }),

  http.get<{ id: string }>('*/api/notas-fiscais/:id', async ({ params }) => {
    await delay()
    const nota = encontrarNota(params.id)
    return nota ? HttpResponse.json(nota) : naoEncontrada()
  }),

  http.post<{ id: string }>('*/api/notas-fiscais/:id/documentos', async ({ params, request }) => {
    await delay()
    const nota = encontrarNota(params.id)
    if (!nota) return naoEncontrada()

    const form = await request.formData()
    const arquivo = form.get('arquivo')
    const tipo = tiposDocumentoMock.find((t) => t.id === form.get('tipoDocumentoId'))

    if (!(arquivo instanceof Blob) || !tipo) {
      return HttpResponse.json({ message: 'Tipo e arquivo são obrigatórios' }, { status: 400 })
    }
    if (!(arquivo.type in ANEXO_ACCEPT) || arquivo.size > TAMANHO_MAXIMO_ANEXO) {
      return HttpResponse.json({ message: 'Arquivo inválido' }, { status: 422 })
    }

    const documento = novoDocumento({
      nomeArquivo: arquivo instanceof File ? arquivo.name : 'documento',
      mimeType: arquivo.type,
      tamanhoBytes: arquivo.size,
      tipo,
    })
    nota.documentos.push(documento)
    db.arquivos.set(documento.id, arquivo)
    return HttpResponse.json(documento, { status: 201 })
  }),

  http.delete<{ id: string; documentoId: string }>(
    '*/api/notas-fiscais/:id/documentos/:documentoId',
    async ({ params }) => {
      await delay()
      const nota = encontrarNota(params.id)
      if (!nota) return naoEncontrada()
      nota.documentos = nota.documentos.filter((d) => d.id !== params.documentoId)
      db.arquivos.delete(params.documentoId)
      return new HttpResponse(null, { status: 204 })
    },
  ),

  http.post<{ id: string }>('*/api/notas-fiscais/:id/observacoes', async ({ params, request }) => {
    await delay()
    const nota = encontrarNota(params.id)
    if (!nota) return naoEncontrada()

    const { texto } = (await request.json()) as { texto?: string }
    const limpo = texto?.trim() ?? ''
    if (!limpo || limpo.length > TAMANHO_MAXIMO_OBSERVACAO) {
      return HttpResponse.json({ message: 'Observação inválida' }, { status: 422 })
    }

    const observacao = novaObservacao(limpo)
    nota.observacoes.push(observacao)
    return HttpResponse.json(observacao, { status: 201 })
  }),

  http.get<{ documentoId: string }>('*/api/documentos/:documentoId/arquivo', async ({ params }) => {
    await delay()
    const enviado = db.arquivos.get(params.documentoId)
    if (enviado) {
      return new HttpResponse(enviado, { headers: { 'Content-Type': enviado.type } })
    }

    const nota = db.notas.find((n) => n.documentos.some((d) => d.id === params.documentoId))
    if (!nota) return HttpResponse.json({ message: 'Documento não encontrado' }, { status: 404 })
    return new HttpResponse(gerarPdfExemplo(`NF ${nota.numero} - ${nota.cliente.nome}`), {
      headers: { 'Content-Type': 'application/pdf' },
    })
  }),
]

import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router'
import { http, HttpResponse } from 'msw'
import { formatCnpj } from '@/lib/format'
import { novoDocumento, tiposDocumentoMock } from '@/mocks/data'
import { db } from '@/mocks/db'
import { server } from '@/mocks/node'
import { renderWithProviders } from '@/test/render'
import { NotaFiscalPage } from './nota-fiscal-page'

function renderDetalhe(id: string) {
  renderWithProviders(
    <Routes>
      <Route path="/notas/:id" element={<NotaFiscalPage />} />
    </Routes>,
    { rota: `/notas/${id}` },
  )
  // applyAccept: false para conseguir simular a seleção de arquivos de tipo inválido
  return userEvent.setup({ applyAccept: false })
}

const notaComDocumentos = () => db.notas.find((n) => n.documentos.length > 0)!
const notaSemDocumentos = () => db.notas.find((n) => n.documentos.length === 0)!

const secao = (nome: RegExp) => screen.getByRole('region', { name: nome })

describe('NotaFiscalPage', () => {
  it('exibe os dados da nota, observações e documentos vinculados', async () => {
    const nota = notaComDocumentos()
    renderDetalhe(nota.id)

    expect(await screen.findByRole('heading', { name: `NF ${nota.numero}` })).toBeInTheDocument()
    expect(screen.getByText(nota.referencia)).toBeInTheDocument()
    expect(screen.getByText(nota.cliente.nome)).toBeInTheDocument()
    expect(screen.getByText(`CNPJ: ${formatCnpj(nota.cliente.cnpj)}`)).toBeInTheDocument()

    const documentos = within(secao(/Documentos vinculados/)).getAllByRole('listitem')
    expect(documentos).toHaveLength(nota.documentos.length)
    expect(within(documentos[0]!).getByText(nota.documentos[0]!.nomeArquivo)).toBeInTheDocument()
  })

  it('informa quando a nota não existe', async () => {
    renderDetalhe('nao-existe')
    expect(await screen.findByText('Nota fiscal não encontrada')).toBeInTheDocument()
  })

  it('adiciona uma observação', async () => {
    const nota = notaSemDocumentos()
    const user = renderDetalhe(nota.id)
    await screen.findByRole('heading', { name: `NF ${nota.numero}` })

    const botao = screen.getByRole('button', { name: 'Adicionar observação' })
    expect(botao).toBeDisabled()

    await user.type(screen.getByLabelText('Nova observação'), 'Canhoto chegou rasgado.')
    await user.click(botao)

    expect(await screen.findByText('Canhoto chegou rasgado.')).toBeInTheDocument()
    expect(screen.getByLabelText('Nova observação')).toHaveValue('')
  })

  it('anexa um documento escolhendo tipo e arquivo', async () => {
    const nota = notaSemDocumentos()
    // No jsdom, o parser multipart do Node (undici) rejeita o File do jsdom. Por isso este teste
    // não lê o corpo da requisição e só confirma que o upload foi enviado como multipart.
    let contentType: string | null = null
    server.use(
      http.post(`*/api/notas-fiscais/${nota.id}/documentos`, ({ request }) => {
        contentType = request.headers.get('content-type')
        const documento = novoDocumento({
          nomeArquivo: 'canhoto.pdf',
          mimeType: 'application/pdf',
          tamanhoBytes: 8,
          tipo: tiposDocumentoMock[0]!,
        })
        nota.documentos.push(documento)
        return HttpResponse.json(documento, { status: 201 })
      }),
    )
    const user = renderDetalhe(nota.id)
    await screen.findByRole('heading', { name: `NF ${nota.numero}` })
    expect(screen.getByText(/Nenhum documento anexado/)).toBeInTheDocument()

    const anexar = screen.getByRole('button', { name: 'Anexar documento' })
    expect(anexar).toBeDisabled()

    await user.click(screen.getByLabelText(/Tipo de documento/))
    await user.click(await screen.findByRole('option', { name: 'Canhoto assinado' }))
    const arquivo = new File(['%PDF-1.4'], 'canhoto.pdf', { type: 'application/pdf' })
    await user.upload(screen.getByLabelText('Selecionar arquivo'), arquivo)

    expect(screen.getByText('canhoto.pdf')).toBeInTheDocument()
    await user.click(anexar)

    const lista = await within(secao(/Documentos vinculados/)).findByRole('list')
    expect(within(lista).getByText('canhoto.pdf')).toBeInTheDocument()
    expect(within(lista).getByText('Canhoto assinado')).toBeInTheDocument()
    expect(contentType).toMatch(/^multipart\/form-data/)
  })

  it('recusa arquivos com formato não suportado', async () => {
    const nota = notaSemDocumentos()
    const user = renderDetalhe(nota.id)
    await screen.findByRole('heading', { name: `NF ${nota.numero}` })

    const planilha = new File(['a;b'], 'notas.csv', { type: 'text/csv' })
    await user.upload(screen.getByLabelText('Selecionar arquivo'), planilha)

    expect(await screen.findByRole('alert')).toHaveTextContent('Formato não suportado')
    expect(screen.getByRole('button', { name: 'Anexar documento' })).toBeDisabled()
  })

  it('exclui um documento após confirmação', async () => {
    const nota = notaComDocumentos()
    const documento = nota.documentos[0]!
    const user = renderDetalhe(nota.id)
    await screen.findByRole('heading', { name: `NF ${nota.numero}` })

    await user.click(screen.getByRole('button', { name: `Excluir ${documento.nomeArquivo}` }))
    const confirmacao = await screen.findByRole('alertdialog')
    await user.click(within(confirmacao).getByRole('button', { name: 'Excluir' }))

    await waitFor(() =>
      expect(
        within(secao(/Documentos vinculados/)).queryByText(documento.nomeArquivo),
      ).not.toBeInTheDocument(),
    )
  })
})

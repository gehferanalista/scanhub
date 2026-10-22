import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '@/mocks/node'
import { renderWithProviders } from '@/test/render'
import { NotasFiscaisPage } from './notas-fiscais-page'

function renderPagina(rota = '/notas') {
  renderWithProviders(<NotasFiscaisPage />, { rota })
  return userEvent.setup()
}

const linhasDeDados = () => screen.getAllByRole('row').slice(1)

describe('NotasFiscaisPage', () => {
  it('lista a primeira página ordenada pela emissão mais recente', async () => {
    renderPagina()

    expect(await screen.findByText('Mostrando 1–20 de 137')).toBeInTheDocument()
    expect(linhasDeDados()).toHaveLength(20)
    expect(screen.getByRole('columnheader', { name: /Emissão/ })).toHaveAttribute(
      'aria-sort',
      'descending',
    )
    expect(within(linhasDeDados()[0]!).getByText('21/10/2026')).toBeInTheDocument()
  })

  it('filtra pelo número da NF ao clicar em Buscar', async () => {
    const user = renderPagina()
    await screen.findByText('Mostrando 1–20 de 137')
    const numero = within(linhasDeDados()[0]!).getAllByRole('cell')[0]!.textContent

    await user.type(screen.getByLabelText('Número da NF'), numero)
    await user.click(screen.getByRole('button', { name: 'Buscar' }))

    expect(await screen.findByText('Mostrando 1–1 de 1')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: `Ver nota ${numero}` })).toHaveAttribute(
      'href',
      '/notas/1',
    )
  })

  it('busca cliente pelo CNPJ formatado', async () => {
    const user = renderPagina()
    await screen.findByText('Mostrando 1–20 de 137')

    await user.type(screen.getByLabelText('Cliente'), '02.779.444/0001-00')
    await user.click(screen.getByRole('button', { name: 'Buscar' }))

    await waitFor(() => expect(screen.queryByText(/de 137$/)).not.toBeInTheDocument())
    const linhas = linhasDeDados()
    expect(linhas.length).toBeGreaterThan(0)
    for (const linha of linhas) {
      expect(within(linha).getByText('BRAS TELHAS LTDA')).toBeInTheDocument()
    }
  })

  it('alterna a ordenação ao clicar no cabeçalho', async () => {
    const user = renderPagina()
    await screen.findByText('Mostrando 1–20 de 137')
    const valor = () => screen.getByRole('columnheader', { name: /Valor/ })

    await user.click(within(valor()).getByRole('button'))
    expect(valor()).toHaveAttribute('aria-sort', 'descending')

    await user.click(within(valor()).getByRole('button'))
    expect(valor()).toHaveAttribute('aria-sort', 'ascending')
  })

  it('navega entre as páginas', async () => {
    const user = renderPagina()
    await screen.findByText('Mostrando 1–20 de 137')

    await user.click(screen.getByRole('button', { name: /Próxima/ }))

    expect(await screen.findByText('Mostrando 21–40 de 137')).toBeInTheDocument()
    expect(screen.getByText('Página 2 de 7')).toBeInTheDocument()
  })

  it('lê os filtros da URL e permite limpá-los quando não há resultados', async () => {
    const user = renderPagina('/notas?numero=999999')

    expect(await screen.findByText(/Nenhuma nota fiscal encontrada/)).toBeInTheDocument()
    expect(screen.getByLabelText('Número da NF')).toHaveValue('999999')

    await user.click(screen.getByRole('button', { name: 'Limpar filtros' }))

    expect(await screen.findByText('Mostrando 1–20 de 137')).toBeInTheDocument()
    expect(screen.getByLabelText('Número da NF')).toHaveValue('')
  })

  it('valida o período de emissão', async () => {
    const user = renderPagina()
    await screen.findByText('Mostrando 1–20 de 137')

    await user.type(screen.getByLabelText('Emissão de'), '2026-10-20')
    await user.type(screen.getByLabelText('Emissão até'), '2026-10-01')
    await user.click(screen.getByRole('button', { name: 'Buscar' }))

    expect(await screen.findByText('A data inicial deve ser anterior à final')).toBeInTheDocument()
  })

  it('mostra erro e permite tentar novamente', async () => {
    server.use(http.get('*/api/notas-fiscais', () => HttpResponse.error(), { once: true }))
    const user = renderPagina()

    expect(
      await screen.findByText('Não foi possível carregar as notas fiscais.'),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(await screen.findByText('Mostrando 1–20 de 137')).toBeInTheDocument()
  })
})

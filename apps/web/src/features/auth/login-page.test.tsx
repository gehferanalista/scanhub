import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router'
import { usuarioMock } from '@/mocks/data'
import { renderWithProviders } from '@/test/render'
import { LoginPage } from './login-page'

function renderLogin() {
  renderWithProviders(
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/notas" element={<p>Página de notas</p>} />
    </Routes>,
  )
  return userEvent.setup()
}

describe('LoginPage', () => {
  it('exibe nome do sistema, campos, botão e link de recuperação de senha', () => {
    renderLogin()

    expect(screen.getByText('Scanhub')).toBeInTheDocument()
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument()
    expect(screen.getByLabelText('Senha')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Esqueceu a senha?' })).toHaveAttribute(
      'href',
      '/esqueci-senha',
    )
  })

  it('valida os campos antes de enviar', async () => {
    const user = renderLogin()

    await user.type(screen.getByLabelText('E-mail'), 'invalido')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText('Informe um e-mail válido')).toBeInTheDocument()
    expect(screen.getByText('Informe a senha')).toBeInTheDocument()
  })

  it('mostra erro quando as credenciais são inválidas', async () => {
    const user = renderLogin()

    await user.type(screen.getByLabelText('E-mail'), usuarioMock.email)
    await user.type(screen.getByLabelText('Senha'), 'senha-errada')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha inválidos.')
  })

  it('redireciona para as notas após login válido', async () => {
    const user = renderLogin()

    await user.type(screen.getByLabelText('E-mail'), usuarioMock.email)
    await user.type(screen.getByLabelText('Senha'), usuarioMock.senha)
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText('Página de notas')).toBeInTheDocument()
  })

  it('alterna a visibilidade da senha', async () => {
    const user = renderLogin()
    const senha = screen.getByLabelText('Senha')

    expect(senha).toHaveAttribute('type', 'password')
    await user.click(screen.getByRole('button', { name: 'Mostrar senha' }))
    expect(senha).toHaveAttribute('type', 'text')
  })
})

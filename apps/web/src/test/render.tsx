import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, type RenderOptions } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router'

type Options = RenderOptions & { rota?: string }

export function renderWithProviders(ui: ReactElement, { rota = '/', ...options }: Options = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[rota]}>{ui}</MemoryRouter>
    </QueryClientProvider>,
    options,
  )
}

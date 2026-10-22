import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { resetDb } from '@/mocks/db'
import { server } from '@/mocks/node'

function polyfill(alvo: object, nome: string, valor: unknown) {
  if (!(nome in alvo)) Object.defineProperty(alvo, nome, { value: valor, writable: true })
}

// APIs de navegador usadas pelo Radix (Select/Dialog) e pelos downloads que o jsdom não implementa
polyfill(Element.prototype, 'hasPointerCapture', () => false)
polyfill(Element.prototype, 'releasePointerCapture', () => {})
polyfill(Element.prototype, 'scrollIntoView', () => {})
polyfill(URL, 'createObjectURL', () => 'blob:mock')
polyfill(URL, 'revokeObjectURL', () => {})

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  server.resetHandlers()
  resetDb()
  cleanup()
})
afterAll(() => server.close())

import { vi } from 'vitest'
import type { Banco, Db } from '../db/banco'

/**
 * Banco simulado para testes que não acessam dados. Testes que precisam de tabelas usam o
 * Postgres de verdade (ver `banco-de-teste.ts`).
 */
export function criarBancoFalso({ disponivel = true } = {}) {
  return {
    // Nenhuma consulta deve chegar aqui; se chegar, o teste quebra com erro claro
    db: new Proxy({} as Db, {
      get: (_, prop) => {
        throw new Error(`Banco falso não suporta consultas (acesso a "${String(prop)}")`)
      },
    }),
    verificar: vi.fn(() =>
      disponivel ? Promise.resolve() : Promise.reject(new Error('conexão recusada')),
    ),
    fechar: vi.fn(() => Promise.resolve()),
  } satisfies Banco
}

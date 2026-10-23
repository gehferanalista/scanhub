import { describe, expect, it } from 'vitest'
import { filtrosNotasSchema, listarNotasQuerySchema, TAMANHO_PAGINA_MAXIMO } from './notas-fiscais'

describe('filtrosNotasSchema', () => {
  it('aplica os padrões quando a query está vazia', () => {
    expect(filtrosNotasSchema.parse({})).toEqual({
      ordenarPor: 'emissao',
      ordem: 'desc',
      pagina: 1,
    })
  })

  it('ignora valores inválidos em vez de falhar', () => {
    const filtros = filtrosNotasSchema.parse({
      base: 'X',
      anexo: 'talvez',
      emissaoDe: '31/12/2026',
      ordenarPor: 'cor',
      pagina: '-3',
      numero: '   ',
    })
    expect(filtros).toEqual({ ordenarPor: 'emissao', ordem: 'desc', pagina: 1 })
  })

  it('converte e limpa os valores válidos', () => {
    const filtros = filtrosNotasSchema.parse({
      numero: ' 1247 ',
      base: 'P',
      anexo: 'sem',
      emissaoDe: '2026-10-01',
      ordenarPor: 'valor',
      ordem: 'asc',
      pagina: '3',
    })
    expect(filtros).toMatchObject({
      numero: '1247',
      base: 'P',
      anexo: 'sem',
      emissaoDe: '2026-10-01',
      ordenarPor: 'valor',
      ordem: 'asc',
      pagina: 3,
    })
  })
})

describe('listarNotasQuerySchema', () => {
  it('limita o tamanho da página', () => {
    expect(listarNotasQuerySchema.parse({ tamanhoPagina: '5000' }).tamanhoPagina).toBe(20)
    expect(listarNotasQuerySchema.parse({ tamanhoPagina: '50' }).tamanhoPagina).toBe(50)
    expect(
      listarNotasQuerySchema.parse({ tamanhoPagina: String(TAMANHO_PAGINA_MAXIMO) }).tamanhoPagina,
    ).toBe(TAMANHO_PAGINA_MAXIMO)
  })
})

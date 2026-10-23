import { erroApiSchema } from '@scanhub/shared'
import { afterEach, describe, expect, it } from 'vitest'
import { z } from 'zod'
import { buildApp, type App } from './app'
import { carregarEnv } from './config/env'
import { ErroApp } from './erros'
import { criarBancoFalso } from './test/banco-falso'

const ENV_TESTE = {
  NODE_ENV: 'test',
  LOG_LEVEL: 'silent',
  DATABASE_URL: 'postgresql://usuario:senha@localhost:5432/banco',
}

let app: App

function criarApp(banco = criarBancoFalso()) {
  app = buildApp(carregarEnv(ENV_TESTE), { banco })
  return app
}

afterEach(() => app.close())

type RespostaSaude = { status: string; versao: string; banco: string }

describe('GET /api/saude', () => {
  it('responde que a API e o banco estão no ar', async () => {
    const resposta = await criarApp().inject({ method: 'GET', url: '/api/saude' })

    expect(resposta.statusCode).toBe(200)
    const corpo = resposta.json<RespostaSaude>()
    expect(corpo).toMatchObject({ status: 'ok', banco: 'ok' })
    expect(corpo.versao).toMatch(/^\d+\.\d+\.\d+/)
  })

  it('responde 503 quando o banco está fora do ar', async () => {
    const resposta = await criarApp(criarBancoFalso({ disponivel: false })).inject({
      method: 'GET',
      url: '/api/saude',
    })

    expect(resposta.statusCode).toBe(503)
    expect(resposta.json<RespostaSaude>()).toMatchObject({ status: 'erro', banco: 'indisponivel' })
  })

  it('fecha a conexão com o banco ao encerrar a API', async () => {
    const banco = criarBancoFalso()
    await criarApp(banco).close()
    expect(banco.fechar).toHaveBeenCalledOnce()
  })
})

describe('tratamento de erros', () => {
  it('devolve 404 padronizado para rotas inexistentes', async () => {
    const resposta = await criarApp().inject({ method: 'GET', url: '/api/nao-existe' })

    expect(resposta.statusCode).toBe(404)
    expect(erroApiSchema.parse(resposta.json()).codigo).toBe('ROTA_NAO_ENCONTRADA')
  })

  it('devolve 400 com os campos inválidos quando o corpo não passa no schema', async () => {
    criarApp().post(
      '/teste',
      { schema: { body: z.object({ nome: z.string().min(3), idade: z.number() }) } },
      () => ({ ok: true }),
    )

    const resposta = await app.inject({
      method: 'POST',
      url: '/teste',
      payload: { nome: 'A', idade: 'dez' },
    })

    expect(resposta.statusCode).toBe(400)
    const erro = erroApiSchema.parse(resposta.json())
    expect(erro.codigo).toBe('VALIDACAO')
    expect(erro.detalhes?.map((d) => d.campo)).toEqual(['nome', 'idade'])
  })

  it('usa status e código de ErroApp', async () => {
    criarApp().get('/teste', () => {
      throw new ErroApp(409, 'DOCUMENTO_DUPLICADO', 'Documento já anexado')
    })

    const resposta = await app.inject({ method: 'GET', url: '/teste' })

    expect(resposta.statusCode).toBe(409)
    expect(resposta.json()).toEqual({
      codigo: 'DOCUMENTO_DUPLICADO',
      mensagem: 'Documento já anexado',
    })
  })

  it('não expõe detalhes de erros inesperados', async () => {
    criarApp().get('/teste', () => {
      throw new Error('senha do banco: 123')
    })

    const resposta = await app.inject({ method: 'GET', url: '/teste' })

    expect(resposta.statusCode).toBe(500)
    const erro = erroApiSchema.parse(resposta.json())
    expect(erro.codigo).toBe('ERRO_INTERNO')
    expect(erro.mensagem).not.toContain('senha')
  })

  it('trata JSON malformado como erro do cliente', async () => {
    criarApp().post('/teste', () => ({ ok: true }))

    const resposta = await app.inject({
      method: 'POST',
      url: '/teste',
      headers: { 'content-type': 'application/json' },
      payload: '{ invalido',
    })

    expect(resposta.statusCode).toBe(400)
    expect(erroApiSchema.parse(resposta.json()).codigo).toBe('FST_ERR_CTP_INVALID_JSON_BODY')
  })
})

describe('carregarEnv', () => {
  const { DATABASE_URL } = ENV_TESTE

  it('aplica os padrões', () => {
    expect(carregarEnv({ DATABASE_URL })).toMatchObject({ PORT: 3333, NODE_ENV: 'development' })
  })

  it('falha com mensagem clara quando há valor inválido', () => {
    expect(() => carregarEnv({ DATABASE_URL, PORT: 'abc' })).toThrow(
      /Variáveis de ambiente inválidas[\s\S]*PORT/,
    )
  })

  it('exige a URL do Postgres', () => {
    expect(() => carregarEnv({})).toThrow(/DATABASE_URL/)
    expect(() => carregarEnv({ DATABASE_URL: 'mysql://localhost/banco' })).toThrow(
      /URL do Postgres/,
    )
  })
})

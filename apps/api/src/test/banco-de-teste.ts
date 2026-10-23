import { existsSync } from 'node:fs'
import pg from 'pg'
import { conectarBanco } from '../db/banco'
import { aplicarMigrations } from '../db/migrations'

/** URL do banco de testes (TEST_DATABASE_URL do ambiente ou do .env). Sem ela, os testes de banco são pulados. */
export function urlBancoDeTeste() {
  if (!process.env.TEST_DATABASE_URL && existsSync('.env')) process.loadEnvFile('.env')
  return process.env.TEST_DATABASE_URL
}

/** Apaga e recria o banco de testes e aplica todas as migrations. */
export async function prepararBancoDeTeste(url: string) {
  const nome = decodeURIComponent(new URL(url).pathname.slice(1))
  // Trava contra apagar um banco de verdade por engano de configuração
  if (!/^\w+_test$/.test(nome)) {
    throw new Error(`O banco de testes precisa terminar em "_test" (recebido: "${nome}")`)
  }

  const urlAdmin = new URL(url)
  urlAdmin.pathname = '/postgres'
  const admin = new pg.Client({ connectionString: urlAdmin.toString() })
  await admin.connect()
  try {
    await admin.query(`drop database if exists "${nome}" with (force)`)
    await admin.query(`create database "${nome}"`)
  } finally {
    await admin.end()
  }

  const banco = conectarBanco(url)
  await aplicarMigrations(banco.db)
  return banco
}

/** Mensagem do erro do Postgres por trás de uma consulta que falhou. */
export async function erroDoBanco(consulta: PromiseLike<unknown>): Promise<string> {
  try {
    await consulta
  } catch (erro) {
    const causa = erro instanceof Error && erro.cause instanceof Error ? erro.cause : erro
    return causa instanceof Error ? causa.message : String(causa)
  }
  throw new Error('A consulta deveria ter falhado, mas foi executada')
}

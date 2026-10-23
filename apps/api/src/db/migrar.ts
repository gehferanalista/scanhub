// Script: aplica as migrations pendentes no banco de DATABASE_URL.
import { existsSync } from 'node:fs'
import { carregarEnv } from '../config/env'
import { conectarBanco } from './banco'
import { aplicarMigrations, PASTA_MIGRATIONS } from './migrations'

if (existsSync('.env')) process.loadEnvFile('.env')
const banco = conectarBanco(carregarEnv().DATABASE_URL)

try {
  await aplicarMigrations(banco.db)
  console.log(`Migrations aplicadas (${PASTA_MIGRATIONS}).`)
} finally {
  await banco.fechar()
}

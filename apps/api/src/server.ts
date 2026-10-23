import { existsSync } from 'node:fs'
import { buildApp } from './app'
import { carregarEnv } from './config/env'
import { conectarBanco } from './db/banco'

// Em desenvolvimento lê o .env do pacote; em produção as variáveis vêm do ambiente (Docker)
if (existsSync('.env')) process.loadEnvFile('.env')

const env = carregarEnv()
const banco = conectarBanco(env.DATABASE_URL, {
  aoErroDeConexao: (erro) => app.log.error({ err: erro }, 'Erro em conexão ociosa com o banco'),
})
const app = buildApp(env, { banco })

let encerrando = false
for (const sinal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(sinal, () => {
    if (encerrando) return
    encerrando = true
    app.log.info({ sinal }, 'Encerrando a API…')
    app.close().then(
      () => process.exit(0),
      (erro: unknown) => {
        app.log.error({ err: erro }, 'Falha ao encerrar a API')
        process.exit(1)
      },
    )
  })
}

try {
  await app.listen({ host: env.HOST, port: env.PORT })
} catch (erro) {
  app.log.fatal({ err: erro }, 'Não foi possível iniciar a API')
  process.exit(1)
}

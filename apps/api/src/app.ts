import Fastify, { LogController, type FastifyServerOptions } from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod'
import type { Env } from './config/env'
import type { Banco } from './db/banco'
import { registrarTratamentoErros } from './erros'
import { rotasSaude } from './rotas/saude'

function opcoesDeLog(env: Env): FastifyServerOptions['logger'] {
  return {
    level: env.LOG_LEVEL,
    // Nunca registrar credenciais nos logs
    redact: {
      paths: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]'],
      censor: '[oculto]',
    },
    ...(env.NODE_ENV === 'development' && {
      transport: {
        target: 'pino-pretty',
        options: { translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname' },
      },
    }),
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    banco: Banco
  }
}

/** Dependências externas, recebidas prontas para que os testes possam substituí-las. */
export type Dependencias = {
  banco: Banco
}

export function buildApp(env: Env, { banco }: Dependencias) {
  const app = Fastify({
    logger: opcoesDeLog(env),
    // Reaproveita o id vindo do proxy reverso para correlacionar os logs
    requestIdHeader: 'x-request-id',
    logController: new LogController({
      requestIdLogLabel: 'requestId',
      // A verificação de saúde é chamada a cada poucos segundos pelo Docker
      disableRequestLogging: (request) => request.url === '/api/saude',
    }),
  }).withTypeProvider<ZodTypeProvider>()

  app.decorate('banco', banco)
  app.addHook('onClose', () => banco.fechar())

  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)
  registrarTratamentoErros(app)

  void app.register(rotasSaude, { prefix: '/api' })

  return app
}

export type App = ReturnType<typeof buildApp>

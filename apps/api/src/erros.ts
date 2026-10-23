import type { ErroApi } from '@scanhub/shared'
import type { FastifyError, FastifyInstance } from 'fastify'
import {
  hasZodFastifySchemaValidationErrors,
  isResponseSerializationError,
} from 'fastify-type-provider-zod'

/** Erro de regra de negócio, devolvido ao cliente com o status e o código informados. */
export class ErroApp extends Error {
  readonly status: number
  readonly codigo: string

  constructor(status: number, codigo: string, mensagem: string) {
    super(mensagem)
    this.name = 'ErroApp'
    this.status = status
    this.codigo = codigo
  }
}

/** Erros que o próprio Fastify lança por problema na requisição (JSON malformado, corpo grande etc.). */
function ehErroDaRequisicao(erro: unknown): erro is FastifyError {
  return (
    erro instanceof Error &&
    'statusCode' in erro &&
    typeof erro.statusCode === 'number' &&
    erro.statusCode < 500
  )
}

/** Padroniza todas as respostas de erro no formato `ErroApi`. */
export function registrarTratamentoErros(app: FastifyInstance) {
  app.setNotFoundHandler((request, reply) =>
    reply.status(404).send({
      codigo: 'ROTA_NAO_ENCONTRADA',
      mensagem: `Rota ${request.method} ${request.url} não encontrada`,
    } satisfies ErroApi),
  )

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ErroApp) {
      return reply
        .status(error.status)
        .send({ codigo: error.codigo, mensagem: error.message } satisfies ErroApi)
    }

    if (hasZodFastifySchemaValidationErrors(error)) {
      return reply.status(400).send({
        codigo: 'VALIDACAO',
        mensagem: 'Dados inválidos na requisição',
        detalhes: error.validation.map((v) => ({
          campo:
            v.instancePath.replace(/^\//, '').replaceAll('/', '.') ||
            error.validationContext ||
            'requisicao',
          mensagem: v.message ?? 'Valor inválido',
        })),
      } satisfies ErroApi)
    }

    if (isResponseSerializationError(error)) {
      // A resposta não bate com o schema declarado: bug no servidor, nunca do cliente
      request.log.error({ err: error, causa: error.cause.issues }, 'Resposta fora do contrato')
    } else if (ehErroDaRequisicao(error)) {
      return reply.status(error.statusCode ?? 400).send({
        codigo: error.code,
        mensagem: error.message,
      } satisfies ErroApi)
    } else {
      request.log.error({ err: error }, 'Erro não tratado')
    }

    return reply.status(500).send({
      codigo: 'ERRO_INTERNO',
      mensagem: 'Erro interno no servidor. Tente novamente em instantes.',
    } satisfies ErroApi)
  })
}

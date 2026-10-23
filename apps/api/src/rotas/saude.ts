import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import pacote from '../../package.json' with { type: 'json' }

const respostaSaudeSchema = z.object({
  status: z.enum(['ok', 'erro']),
  versao: z.string(),
  uptimeSegundos: z.number(),
  banco: z.enum(['ok', 'indisponivel']),
})

/** Verificação de saúde usada pelo Docker e pelo monitoramento. */
export const rotasSaude: FastifyPluginCallbackZod = (app, _opcoes, pronto) => {
  app.get(
    '/saude',
    { schema: { response: { 200: respostaSaudeSchema, 503: respostaSaudeSchema } } },
    async (request, reply) => {
      const banco = await app.banco.verificar().then(
        () => 'ok' as const,
        (erro: unknown) => {
          request.log.error({ err: erro }, 'Banco de dados indisponível')
          return 'indisponivel' as const
        },
      )
      const ok = banco === 'ok'

      return reply.status(ok ? 200 : 503).send({
        status: ok ? 'ok' : 'erro',
        versao: pacote.version,
        uptimeSegundos: Math.round(process.uptime()),
        banco,
      })
    },
  )
  pronto()
}

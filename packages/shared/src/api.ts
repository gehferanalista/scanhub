import { z } from 'zod'

/** Formato padrão de erro devolvido pela API. */
export const erroApiSchema = z.object({
  codigo: z.string(),
  mensagem: z.string(),
  /** Erros por campo, quando a requisição não passa na validação. */
  detalhes: z.array(z.object({ campo: z.string(), mensagem: z.string() })).optional(),
})
export type ErroApi = z.infer<typeof erroApiSchema>

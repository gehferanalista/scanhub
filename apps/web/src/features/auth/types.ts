import { z } from 'zod'

export const loginSchema = z.object({
  email: z.email('Informe um e-mail válido').trim(),
  senha: z.string().min(1, 'Informe a senha'),
})
export type LoginInput = z.infer<typeof loginSchema>

export const sessaoSchema = z.object({
  token: z.string(),
  usuario: z.object({ id: z.string(), nome: z.string(), email: z.email() }),
})
export type Sessao = z.infer<typeof sessaoSchema>

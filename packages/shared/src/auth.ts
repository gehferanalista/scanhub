import { z } from 'zod'

export const PERFIS = ['admin', 'scanner', 'viewer'] as const
export const perfilSchema = z.enum(PERFIS)
export type Perfil = z.infer<typeof perfilSchema>

export const PERFIS_INFO: Record<Perfil, { nome: string; descricao: string }> = {
  admin: { nome: 'Administrador', descricao: 'Acesso total, inclusive usuários e cadastros' },
  scanner: { nome: 'Scanner', descricao: 'Digitaliza, anexa e exclui documentos' },
  viewer: { nome: 'Conferência', descricao: 'Consulta notas e documentos e registra observações' },
}

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

import { sessaoSchema, type LoginInput } from '@scanhub/shared'
import { api } from '@/lib/api'

export async function login(input: LoginInput) {
  const { data } = await api.post<unknown>('/auth/login', input)
  return sessaoSchema.parse(data)
}

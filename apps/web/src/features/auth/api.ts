import { api } from '@/lib/api'
import { sessaoSchema, type LoginInput } from './types'

export async function login(input: LoginInput) {
  const { data } = await api.post<unknown>('/auth/login', input)
  return sessaoSchema.parse(data)
}

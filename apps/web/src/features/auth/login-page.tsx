import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { Eye, EyeOff, FileCheck2, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { login } from './api'
import { loginSchema, type LoginInput } from './types'

function mensagemDeErro(error: unknown) {
  if (isAxiosError(error) && error.response?.status === 401) return 'E-mail ou senha inválidos.'
  return 'Não foi possível entrar. Tente novamente em instantes.'
}

export function LoginPage() {
  const navigate = useNavigate()
  const [mostrarSenha, setMostrarSenha] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', senha: '' },
  })

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: () => navigate('/notas', { replace: true }),
  })

  const onSubmit = handleSubmit((values) => loginMutation.mutate(values))

  return (
    <Card className="w-full max-w-sm shadow-xl">
      <CardHeader className="items-center text-center">
        <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10">
          <FileCheck2 className="size-6 text-primary" />
        </div>
        <CardTitle className="text-2xl">Scanhub</CardTitle>
        <CardDescription>Sistema de Conferência Documental</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={onSubmit} noValidate className="grid gap-5">
          {loginMutation.isError && (
            <p
              role="alert"
              className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {mensagemDeErro(loginMutation.error)}
            </p>
          )}

          <div className="grid gap-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="seu.nome@empresa.com.br"
              autoFocus
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-erro' : undefined}
              {...register('email')}
            />
            {errors.email && (
              <p id="email-erro" className="text-sm text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="senha">Senha</Label>
              <Link
                to="/esqueci-senha"
                className="text-sm text-primary underline-offset-4 hover:underline"
              >
                Esqueceu a senha?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="senha"
                type={mostrarSenha ? 'text' : 'password'}
                autoComplete="current-password"
                className="pr-10"
                aria-invalid={!!errors.senha}
                aria-describedby={errors.senha ? 'senha-erro' : undefined}
                {...register('senha')}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute inset-y-0 right-0 h-full text-muted-foreground hover:bg-transparent"
                onClick={() => setMostrarSenha((v) => !v)}
                aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {mostrarSenha ? <EyeOff /> : <Eye />}
              </Button>
            </div>
            {errors.senha && (
              <p id="senha-erro" className="text-sm text-destructive">
                {errors.senha.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
            {loginMutation.isPending && <Loader2 className="animate-spin" />}
            Entrar
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

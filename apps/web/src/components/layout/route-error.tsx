import { isRouteErrorResponse, Link, useRouteError } from 'react-router'
import { Button } from '@/components/ui/button'

export function RouteError() {
  const error = useRouteError()
  const notFound = isRouteErrorResponse(error) && error.status === 404

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-2xl font-semibold">
        {notFound ? 'Página não encontrada' : 'Algo deu errado'}
      </h1>
      <p className="text-muted-foreground">
        {notFound
          ? 'O endereço acessado não existe.'
          : 'Ocorreu um erro inesperado. Tente novamente.'}
      </p>
      <Button asChild>
        <Link to="/">Voltar ao início</Link>
      </Button>
    </div>
  )
}

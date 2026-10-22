import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// TODO: implementar o fluxo de recuperação de senha
export function EsqueciSenhaPage() {
  return (
    <Card className="w-full max-w-sm shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Recuperar senha</CardTitle>
        <CardDescription>Em breve você poderá redefinir sua senha por aqui.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild variant="outline" className="w-full">
          <Link to="/login">Voltar para o login</Link>
        </Button>
      </CardContent>
    </Card>
  )
}

import { useQuery } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { ArrowLeft, Printer } from 'lucide-react'
import { Link, useLocation, useParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { notasFiscaisQueries } from '../api'
import type { EstadoDetalhe } from '../types'
import { AnexarDocumentoCard } from './anexar-documento-card'
import { DocumentosCard } from './documentos-card'
import { ObservacoesCard } from './observacoes-card'
import { ResumoNotaCard } from './resumo-nota-card'

export function NotaFiscalPage() {
  const { id = '' } = useParams()
  const estado = useLocation().state as EstadoDetalhe | null
  const voltarPara = estado?.voltarPara ?? '/notas'

  const {
    data: nota,
    isPending,
    isError,
    error,
    refetch,
  } = useQuery(notasFiscaisQueries.detail(id))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <Button asChild variant="ghost" size="sm">
          <Link to={voltarPara}>
            <ArrowLeft />
            Voltar para lista
          </Link>
        </Button>
        <Button variant="outline" size="sm" onClick={() => window.print()} disabled={!nota}>
          <Printer />
          Exportar PDF
        </Button>
      </div>

      {isPending ? (
        <CarregandoDetalhe />
      ) : isError ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            {isAxiosError(error) && error.response?.status === 404 ? (
              <>
                <h1 className="text-lg font-semibold">Nota fiscal não encontrada</h1>
                <p className="text-sm text-muted-foreground">
                  A nota pode ter sido removida ou o endereço está incorreto.
                </p>
              </>
            ) : (
              <>
                <h1 className="text-lg font-semibold">Não foi possível carregar a nota</h1>
                <Button variant="outline" size="sm" onClick={() => void refetch()}>
                  Tentar novamente
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_22rem] print:block">
          <div className="grid gap-5">
            <ResumoNotaCard nota={nota} />
            <ObservacoesCard notaId={nota.id} observacoes={nota.observacoes} />
            <DocumentosCard notaId={nota.id} documentos={nota.documentos} />
          </div>
          <aside className="lg:sticky lg:top-6">
            <AnexarDocumentoCard notaId={nota.id} />
          </aside>
        </div>
      )}
    </div>
  )
}

function CarregandoDetalhe() {
  return (
    <div
      className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]"
      aria-busy
      aria-label="Carregando nota fiscal"
    >
      <div className="grid gap-5">
        <Skeleton className="h-52 rounded-xl" />
        <Skeleton className="h-56 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
      <Skeleton className="h-96 rounded-xl" />
    </div>
  )
}

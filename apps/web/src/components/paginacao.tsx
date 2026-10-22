import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

type PaginacaoProps = {
  pagina: number
  tamanhoPagina: number
  total: number
  onMudarPagina: (pagina: number) => void
}

export function Paginacao({ pagina, tamanhoPagina, total, onMudarPagina }: PaginacaoProps) {
  const totalPaginas = Math.max(1, Math.ceil(total / tamanhoPagina))
  const inicio = total === 0 ? 0 : (pagina - 1) * tamanhoPagina + 1
  const fim = Math.min(pagina * tamanhoPagina, total)
  const numero = new Intl.NumberFormat('pt-BR')

  return (
    <nav
      aria-label="Paginação"
      className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground"
    >
      <p>
        Mostrando {numero.format(inicio)}–{numero.format(fim)} de {numero.format(total)}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onMudarPagina(pagina - 1)}
          disabled={pagina <= 1}
        >
          <ChevronLeft />
          Anterior
        </Button>
        <span className="px-2 tabular-nums">
          Página {pagina} de {totalPaginas}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onMudarPagina(pagina + 1)}
          disabled={pagina >= totalPaginas}
        >
          Próxima
          <ChevronRight />
        </Button>
      </div>
    </nav>
  )
}

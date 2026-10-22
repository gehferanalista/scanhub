import { ArrowDown, ArrowUp, ArrowUpDown, Eye } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCnpj, formatCurrency, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { CampoOrdenacao, FiltrosNotas } from '../filtros'
import type { EstadoDetalhe, NotaFiscal } from '../types'
import { BaseBadge } from './base-badge'

const TOTAL_COLUNAS = 9

type TabelaNotasProps = {
  notas: NotaFiscal[] | undefined
  carregando: boolean
  atualizando: boolean
  erro: boolean
  ordenacao: Pick<FiltrosNotas, 'ordenarPor' | 'ordem'>
  onOrdenar: (campo: CampoOrdenacao) => void
  onTentarNovamente: () => void
  onLimparFiltros: () => void
}

export function TabelaNotas({
  notas,
  carregando,
  atualizando,
  erro,
  ordenacao,
  onOrdenar,
  onTentarNovamente,
  onLimparFiltros,
}: TabelaNotasProps) {
  const { pathname, search } = useLocation()
  const cabecalho = (campo: CampoOrdenacao, titulo: string, className?: string) => (
    <CabecalhoOrdenavel
      campo={campo}
      ordenacao={ordenacao}
      onOrdenar={onOrdenar}
      className={className}
    >
      {titulo}
    </CabecalhoOrdenavel>
  )

  return (
    <Table
      aria-busy={carregando || atualizando}
      className={cn('transition-opacity', atualizando && 'opacity-60')}
    >
      <TableHeader className="bg-muted/40">
        <TableRow className="hover:bg-transparent">
          {cabecalho('numero', 'Número')}
          <TableHead className="text-muted-foreground">Série</TableHead>
          <TableHead className="text-muted-foreground">Base</TableHead>
          {cabecalho('empresa', 'Empresa')}
          {cabecalho('emissao', 'Emissão')}
          {cabecalho('cliente', 'Cliente')}
          {cabecalho('valor', 'Valor', 'text-right')}
          <TableHead className="text-center text-muted-foreground">Status anexo</TableHead>
          <TableHead className="text-center text-muted-foreground">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {carregando ? (
          <LinhasCarregando />
        ) : erro ? (
          <LinhaMensagem>
            Não foi possível carregar as notas fiscais.
            <Button variant="outline" size="sm" onClick={onTentarNovamente}>
              Tentar novamente
            </Button>
          </LinhaMensagem>
        ) : !notas?.length ? (
          <LinhaMensagem>
            Nenhuma nota fiscal encontrada para os filtros informados.
            <Button variant="outline" size="sm" onClick={onLimparFiltros}>
              Limpar filtros
            </Button>
          </LinhaMensagem>
        ) : (
          notas.map((nota) => (
            <LinhaNota key={nota.id} nota={nota} voltarPara={pathname + search} />
          ))
        )}
      </TableBody>
    </Table>
  )
}

function LinhaNota({ nota, voltarPara }: { nota: NotaFiscal; voltarPara: string }) {
  const temAnexo = nota.quantidadeAnexos > 0

  return (
    <TableRow>
      <TableCell className="font-medium tabular-nums">{nota.numero}</TableCell>
      <TableCell className="text-muted-foreground">{nota.serie}</TableCell>
      <TableCell>
        <BaseBadge base={nota.base} />
      </TableCell>
      <TableCell className="max-w-48">{nota.empresa.nome}</TableCell>
      <TableCell className="tabular-nums">{formatDate(nota.dataEmissao)}</TableCell>
      <TableCell className="max-w-96">
        <div className="font-medium">{nota.cliente.nome}</div>
        <div className="text-xs text-muted-foreground tabular-nums">
          {formatCnpj(nota.cliente.cnpj)}
        </div>
      </TableCell>
      <TableCell className="text-right font-medium whitespace-nowrap tabular-nums">
        {formatCurrency(nota.valorTotal)}
      </TableCell>
      <TableCell className="text-center">
        <Badge variant={temAnexo ? 'success' : 'warning'}>
          {temAnexo ? 'Com anexo' : 'Sem anexo'}
        </Badge>
      </TableCell>
      <TableCell className="text-center">
        <Button asChild variant="ghost" size="sm">
          <Link
            to={`/notas/${nota.id}`}
            state={{ voltarPara } satisfies EstadoDetalhe}
            aria-label={`Ver nota ${nota.numero}`}
          >
            <Eye />
            Ver
          </Link>
        </Button>
      </TableCell>
    </TableRow>
  )
}

type CabecalhoOrdenavelProps = {
  campo: CampoOrdenacao
  ordenacao: Pick<FiltrosNotas, 'ordenarPor' | 'ordem'>
  onOrdenar: (campo: CampoOrdenacao) => void
  className?: string
  children: ReactNode
}

function CabecalhoOrdenavel({
  campo,
  ordenacao,
  onOrdenar,
  className,
  children,
}: CabecalhoOrdenavelProps) {
  const ativo = ordenacao.ordenarPor === campo
  const Icone = !ativo ? ArrowUpDown : ordenacao.ordem === 'asc' ? ArrowUp : ArrowDown

  return (
    <TableHead
      className={className}
      aria-sort={ativo ? (ordenacao.ordem === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <button
        type="button"
        onClick={() => onOrdenar(campo)}
        className="inline-flex items-center gap-1.5 rounded-sm outline-none hover:text-primary focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        {children}
        <Icone className={cn('size-4', !ativo && 'text-muted-foreground')} />
      </button>
    </TableHead>
  )
}

function LinhasCarregando() {
  return Array.from({ length: 8 }, (_, i) => (
    <TableRow key={i} className="hover:bg-transparent">
      {Array.from({ length: TOTAL_COLUNAS }, (_, j) => (
        <TableCell key={j}>
          <Skeleton className="h-5 w-full" />
        </TableCell>
      ))}
    </TableRow>
  ))
}

function LinhaMensagem({ children }: { children: ReactNode }) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={TOTAL_COLUNAS} className="h-40 text-center text-muted-foreground">
        <div className="flex flex-col items-center gap-3">{children}</div>
      </TableCell>
    </TableRow>
  )
}

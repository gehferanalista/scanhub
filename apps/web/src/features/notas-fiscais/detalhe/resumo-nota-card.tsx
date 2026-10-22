import { Banknote, Building, CalendarDays, FileText, Store } from 'lucide-react'
import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { formatCnpj, formatCurrency, formatDate } from '@/lib/format'
import { BaseBadge } from '../components/base-badge'
import type { NotaFiscalDetalhe } from '../types'

export function ResumoNotaCard({ nota }: { nota: NotaFiscalDetalhe }) {
  return (
    <Card>
      <CardContent className="grid gap-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-lg bg-muted">
              <FileText className="size-5 text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">NF {nota.numero}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span>
                  Ref: <span className="font-mono text-xs">{nota.referencia}</span>
                </span>
                <span>
                  Série: <span className="font-medium text-foreground">{nota.serie}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  Base: <BaseBadge base={nota.base} className="size-6" />
                </span>
              </div>
            </div>
          </div>
          <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700">
            {nota.situacao}
          </Badge>
        </div>

        <dl className="grid gap-5 sm:grid-cols-2">
          <Dado icone={<Building />} rotulo="Empresa">
            {nota.empresa.nome}
          </Dado>
          <Dado icone={<CalendarDays />} rotulo="Data de emissão">
            {formatDate(nota.dataEmissao)}
          </Dado>
          <Dado icone={<Banknote />} rotulo="Valor total">
            {formatCurrency(nota.valorTotal)}
          </Dado>
          <Dado icone={<Store />} rotulo="Cliente">
            {nota.cliente.nome}
            <span className="block text-sm font-normal text-muted-foreground tabular-nums">
              CNPJ: {formatCnpj(nota.cliente.cnpj)}
            </span>
          </Dado>
        </dl>
      </CardContent>
    </Card>
  )
}

function Dado({
  icone,
  rotulo,
  children,
}: {
  icone: ReactNode
  rotulo: string
  children: ReactNode
}) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 text-muted-foreground [&_svg]:size-4">{icone}</span>
      <div>
        <dt className="text-sm text-muted-foreground">{rotulo}</dt>
        <dd className="font-semibold">{children}</dd>
      </div>
    </div>
  )
}

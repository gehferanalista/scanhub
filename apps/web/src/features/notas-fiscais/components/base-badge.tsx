import { cn } from '@/lib/utils'
import { BASES, type Base } from '../types'

export function BaseBadge({ base, className }: { base: Base; className?: string }) {
  const info = BASES[base]
  return (
    <span
      title={`${info.nome} — ${info.descricao}`}
      className={cn(
        'inline-flex size-7 items-center justify-center rounded-full text-xs font-semibold',
        info.className,
        className,
      )}
    >
      {base}
      <span className="sr-only"> — {info.nome}</span>
    </span>
  )
}

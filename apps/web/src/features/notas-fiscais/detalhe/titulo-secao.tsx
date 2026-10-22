import type { ReactNode } from 'react'

export function TituloSecao({
  id,
  icone,
  children,
  contagem,
}: {
  id: string
  icone: ReactNode
  children: ReactNode
  contagem?: string
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground [&_svg]:size-5">{icone}</span>
      <h2 id={id} className="text-xl font-semibold tracking-tight">
        {children}
      </h2>
      {contagem && <span className="text-sm text-muted-foreground">({contagem})</span>}
    </div>
  )
}

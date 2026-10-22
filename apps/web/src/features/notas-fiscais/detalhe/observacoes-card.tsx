import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, MessageSquare } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { formatDateTime } from '@/lib/format'
import { adicionarObservacao, notasFiscaisQueries } from '../api'
import { TAMANHO_MAXIMO_OBSERVACAO, type Observacao } from '../types'
import { TituloSecao } from './titulo-secao'

type ObservacoesCardProps = {
  notaId: string
  observacoes: Observacao[]
}

export function ObservacoesCard({ notaId, observacoes }: ObservacoesCardProps) {
  const queryClient = useQueryClient()
  const [texto, setTexto] = useState('')

  const adicionar = useMutation({
    mutationFn: () => adicionarObservacao(notaId, texto.trim()),
    onSuccess: async () => {
      setTexto('')
      toast.success('Observação adicionada.')
      await queryClient.invalidateQueries({ queryKey: notasFiscaisQueries.all() })
    },
    onError: () => toast.error('Não foi possível adicionar a observação.'),
  })

  const ordenadas = observacoes.toSorted((a, b) => b.criadaEm.localeCompare(a.criadaEm))

  return (
    <Card role="region" aria-labelledby="titulo-observacoes">
      <CardContent className="grid gap-5">
        <TituloSecao
          id="titulo-observacoes"
          icone={<MessageSquare />}
          contagem={String(observacoes.length)}
        >
          Observações
        </TituloSecao>

        <form
          className="grid gap-2 print:hidden"
          onSubmit={(e) => {
            e.preventDefault()
            adicionar.mutate()
          }}
        >
          <Label htmlFor="nova-observacao">Nova observação</Label>
          <Textarea
            id="nova-observacao"
            placeholder="Escreva uma observação para esta nota…"
            className="min-h-20"
            maxLength={TAMANHO_MAXIMO_OBSERVACAO}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
          />
          <div className="flex items-center justify-between gap-2">
            <Button type="submit" disabled={!texto.trim() || adicionar.isPending}>
              {adicionar.isPending && <Loader2 className="animate-spin" />}
              Adicionar observação
            </Button>
            <span className="text-xs text-muted-foreground tabular-nums">
              {texto.length}/{TAMANHO_MAXIMO_OBSERVACAO}
            </span>
          </div>
        </form>

        {ordenadas.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma observação registrada para esta nota.
          </p>
        ) : (
          <ul className="grid gap-3">
            {ordenadas.map((obs) => (
              <li key={obs.id} className="rounded-lg border bg-muted/30 p-3">
                <div className="mb-1 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{obs.autor}</span>
                  <span aria-hidden>•</span>
                  <time dateTime={obs.criadaEm}>{formatDateTime(obs.criadaEm)}</time>
                </div>
                <p className="text-sm whitespace-pre-wrap">{obs.texto}</p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

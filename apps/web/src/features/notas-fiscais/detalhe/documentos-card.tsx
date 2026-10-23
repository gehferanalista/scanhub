import type { Documento } from '@scanhub/shared'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, Eye, FileImage, FileText, Paperclip, Trash2, User } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatBytes, formatDateTime } from '@/lib/format'
import { excluirDocumento, notasFiscaisQueries } from '../api'
import { TituloSecao } from './titulo-secao'
import { VisualizarDocumentoDialog } from './visualizar-documento-dialog'

type DocumentosCardProps = {
  notaId: string
  documentos: Documento[]
}

export function DocumentosCard({ notaId, documentos }: DocumentosCardProps) {
  const [visualizando, setVisualizando] = useState<Documento | null>(null)
  const total = documentos.length

  return (
    <Card role="region" aria-labelledby="titulo-documentos">
      <CardContent className="grid gap-5">
        <TituloSecao
          id="titulo-documentos"
          icone={<Paperclip />}
          contagem={`${total} ${total === 1 ? 'documento' : 'documentos'}`}
        >
          Documentos vinculados
        </TituloSecao>

        {total === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum documento anexado. Use o painel “Anexar novo documento” para incluir os
            comprovantes desta nota.
          </p>
        ) : (
          <ul className="grid gap-3">
            {documentos.map((doc) => (
              <ItemDocumento
                key={doc.id}
                notaId={notaId}
                documento={doc}
                onVisualizar={() => setVisualizando(doc)}
              />
            ))}
          </ul>
        )}
      </CardContent>

      <VisualizarDocumentoDialog documento={visualizando} onFechar={() => setVisualizando(null)} />
    </Card>
  )
}

type ItemDocumentoProps = {
  notaId: string
  documento: Documento
  onVisualizar: () => void
}

function ItemDocumento({ notaId, documento, onVisualizar }: ItemDocumentoProps) {
  const queryClient = useQueryClient()
  const Icone = documento.mimeType.startsWith('image/') ? FileImage : FileText

  const excluir = useMutation({
    mutationFn: () => excluirDocumento(notaId, documento.id),
    onSuccess: async () => {
      toast.success('Documento excluído.')
      await queryClient.invalidateQueries({ queryKey: notasFiscaisQueries.all() })
    },
    onError: () => toast.error('Não foi possível excluir o documento.'),
  })

  return (
    <li className="flex items-start gap-3 rounded-lg border p-4 shadow-xs">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icone className="size-5 text-muted-foreground" />
      </div>

      <div className="min-w-0 flex-1 space-y-1.5">
        <p className="truncate font-medium" title={documento.nomeArquivo}>
          {documento.nomeArquivo}
        </p>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary">{documento.tipo.nome}</Badge>
          <span>{formatBytes(documento.tamanhoBytes)}</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>
            Ref: <span className="font-mono">{documento.referencia}</span>
          </span>
          <span className="flex items-center gap-1">
            <CalendarDays className="size-3.5" />
            <time dateTime={documento.enviadoEm}>{formatDateTime(documento.enviadoEm)}</time>
          </span>
          <span className="flex items-center gap-1">
            <User className="size-3.5" />
            {documento.enviadoPor}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1 print:hidden">
        <Button
          variant="ghost"
          size="sm"
          onClick={onVisualizar}
          aria-label={`Ver ${documento.nomeArquivo}`}
        >
          <Eye />
          Ver
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              disabled={excluir.isPending}
              aria-label={`Excluir ${documento.nomeArquivo}`}
            >
              <Trash2 />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir documento?</AlertDialogTitle>
              <AlertDialogDescription>
                O arquivo <strong>{documento.nomeArquivo}</strong> será desvinculado desta nota.
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-white hover:bg-destructive/90"
                onClick={() => excluir.mutate()}
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </li>
  )
}

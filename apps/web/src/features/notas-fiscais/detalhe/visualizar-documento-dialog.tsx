import { useQuery } from '@tanstack/react-query'
import { Download, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatBytes } from '@/lib/format'
import { notasFiscaisQueries } from '../api'
import type { Documento } from '../types'

type VisualizarDocumentoDialogProps = {
  documento: Documento | null
  onFechar: () => void
}

export function VisualizarDocumentoDialog({ documento, onFechar }: VisualizarDocumentoDialogProps) {
  return (
    <Dialog open={!!documento} onOpenChange={(aberto) => !aberto && onFechar()}>
      <DialogContent className="flex h-[90svh] flex-col sm:max-w-5xl">
        {documento && (
          <>
            <DialogHeader className="pr-8">
              <DialogTitle>{documento.nomeArquivo}</DialogTitle>
              <DialogDescription>
                {documento.tipo.nome} • {formatBytes(documento.tamanhoBytes)}
              </DialogDescription>
            </DialogHeader>
            <ConteudoDocumento documento={documento} />
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function ConteudoDocumento({ documento }: { documento: Documento }) {
  const { data: arquivo, isError } = useQuery(notasFiscaisQueries.arquivoDocumento(documento.id))
  const url = useObjectUrl(arquivo)

  if (isError) {
    return <p className="m-auto text-sm text-destructive">Não foi possível carregar o documento.</p>
  }

  if (!url) {
    return (
      <div className="m-auto flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Carregando documento…
      </div>
    )
  }

  return (
    <>
      <div className="min-h-0 flex-1 overflow-auto rounded-md border bg-muted/30">
        {documento.mimeType === 'application/pdf' ? (
          <iframe src={url} title={documento.nomeArquivo} className="size-full" />
        ) : (
          <img
            src={url}
            alt={documento.nomeArquivo}
            className="mx-auto max-h-full object-contain"
          />
        )}
      </div>
      <div className="flex justify-end">
        <Button asChild variant="outline">
          <a href={url} download={documento.nomeArquivo}>
            <Download />
            Baixar
          </a>
        </Button>
      </div>
    </>
  )
}

/** Cria uma URL temporária para o blob e a libera quando o blob muda ou o componente sai da tela. */
function useObjectUrl(blob: Blob | undefined) {
  const [url, setUrl] = useState<string>()

  useEffect(() => {
    if (!blob) return
    const novaUrl = URL.createObjectURL(blob)
    // A URL é um recurso externo que precisa ser liberado na limpeza; criá-la no render
    // vazaria URLs (render duplo do StrictMode) e um useMemo seria revogado sem ser recriado.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUrl(novaUrl)
    return () => {
      URL.revokeObjectURL(novaUrl)
      setUrl(undefined)
    }
  }, [blob])

  return url
}

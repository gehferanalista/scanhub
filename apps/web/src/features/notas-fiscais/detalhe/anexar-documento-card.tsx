import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FileText, Loader2, ScanLine, Upload, X } from 'lucide-react'
import { useState } from 'react'
import { ErrorCode, useDropzone, type FileRejection } from 'react-dropzone'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatBytes } from '@/lib/format'
import { cn } from '@/lib/utils'
import { anexarDocumento, notasFiscaisQueries } from '../api'
import { ANEXO_ACCEPT, TAMANHO_MAXIMO_ANEXO } from '../types'

function mensagemRejeicao([rejeicao]: FileRejection[]) {
  const codigo = rejeicao?.errors[0]?.code
  if (codigo === ErrorCode.FileInvalidType) return 'Formato não suportado. Envie PDF, JPG ou PNG.'
  if (codigo === ErrorCode.FileTooLarge)
    return `O arquivo excede o limite de ${formatBytes(TAMANHO_MAXIMO_ANEXO)}.`
  if (codigo === ErrorCode.TooManyFiles) return 'Envie um arquivo por vez.'
  return 'Não foi possível usar este arquivo.'
}

export function AnexarDocumentoCard({ notaId }: { notaId: string }) {
  const queryClient = useQueryClient()
  const { data: tipos = [] } = useQuery(notasFiscaisQueries.tiposDocumento())

  const [tipoDocumentoId, setTipoDocumentoId] = useState('')
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [erroArquivo, setErroArquivo] = useState<string | null>(null)
  const [progresso, setProgresso] = useState(0)

  const anexar = useMutation({
    mutationFn: (dados: { tipoDocumentoId: string; arquivo: File }) =>
      anexarDocumento({ notaId, ...dados, onProgresso: setProgresso }),
    onMutate: () => setProgresso(0),
    onSuccess: async (documento) => {
      toast.success(`${documento.nomeArquivo} anexado.`)
      setArquivo(null)
      setTipoDocumentoId('')
      await queryClient.invalidateQueries({ queryKey: notasFiscaisQueries.all() })
    },
    onError: () => toast.error('Não foi possível anexar o documento. Tente novamente.'),
  })

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: ANEXO_ACCEPT,
    maxSize: TAMANHO_MAXIMO_ANEXO,
    multiple: false,
    disabled: anexar.isPending,
    onDrop: (aceitos, rejeitados) => {
      if (rejeitados.length) {
        setErroArquivo(mensagemRejeicao(rejeitados))
        return
      }
      setErroArquivo(null)
      setArquivo(aceitos[0] ?? null)
    },
  })

  const podeAnexar = !!tipoDocumentoId && !!arquivo && !anexar.isPending

  return (
    <Card role="region" aria-labelledby="titulo-anexar" className="print:hidden">
      <CardContent>
        <form
          className="grid gap-5"
          onSubmit={(e) => {
            e.preventDefault()
            if (arquivo && tipoDocumentoId) anexar.mutate({ tipoDocumentoId, arquivo })
          }}
        >
          <h2 id="titulo-anexar" className="text-lg font-semibold">
            Anexar novo documento
          </h2>

          <div className="grid gap-2">
            <Label htmlFor="tipo-documento">
              Tipo de documento <span className="text-destructive">*</span>
            </Label>
            <Select
              value={tipoDocumentoId}
              onValueChange={setTipoDocumentoId}
              disabled={anexar.isPending}
            >
              <SelectTrigger id="tipo-documento">
                <SelectValue placeholder="Selecione o tipo de documento" />
              </SelectTrigger>
              <SelectContent>
                {tipos.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>
              Arquivo <span className="text-destructive">*</span>
            </Label>
            {arquivo ? (
              <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
                <FileText className="size-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium" title={arquivo.name}>
                    {arquivo.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatBytes(arquivo.size)}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => setArquivo(null)}
                  disabled={anexar.isPending}
                  aria-label="Remover arquivo selecionado"
                >
                  <X />
                </Button>
              </div>
            ) : (
              <div
                {...getRootProps({
                  className: cn(
                    'flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors outline-none hover:border-primary/50 hover:bg-primary/5 focus-visible:ring-[3px] focus-visible:ring-ring/50',
                    isDragActive && 'border-primary bg-primary/5',
                    erroArquivo && 'border-destructive/50',
                  ),
                })}
              >
                <input {...getInputProps({ 'aria-label': 'Selecionar arquivo' })} />
                <Upload className="size-7 text-muted-foreground" />
                <p className="text-sm font-medium">
                  {isDragActive
                    ? 'Solte o arquivo aqui'
                    : 'Arraste o arquivo aqui ou clique para selecionar'}
                </p>
                <p className="text-xs text-muted-foreground">
                  PDF, JPG ou PNG • Máximo {formatBytes(TAMANHO_MAXIMO_ANEXO)}
                </p>
              </div>
            )}
            {erroArquivo && (
              <p role="alert" className="text-sm text-destructive">
                {erroArquivo}
              </p>
            )}
          </div>

          {anexar.isPending && (
            <div
              role="progressbar"
              aria-label="Progresso do envio"
              aria-valuenow={progresso}
              aria-valuemin={0}
              aria-valuemax={100}
              className="h-1.5 overflow-hidden rounded-full bg-muted"
            >
              <div
                className="h-full bg-primary transition-[width]"
                style={{ width: `${progresso}%` }}
              />
            </div>
          )}

          <div className="grid gap-2">
            <Button type="submit" disabled={!podeAnexar}>
              {anexar.isPending ? <Loader2 className="animate-spin" /> : <Upload />}
              Anexar documento
            </Button>
            {/* TODO: integrar com o agente local do scanner (TWAIN/WIA) */}
            <Button
              type="button"
              variant="secondary"
              disabled
              title="Integração com o scanner em desenvolvimento"
            >
              <ScanLine />
              Digitalizar com scanner
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

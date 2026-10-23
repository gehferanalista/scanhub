import type { NotaFiscal, NotaFiscalDetalhe } from '@scanhub/shared'
import { gerarNotas } from './data'

/** Estado em memória do mock. Alterações (anexos, observações) valem até recarregar a página. */
export const db = {
  notas: gerarNotas(),
  /** Conteúdo dos arquivos enviados nesta sessão, por id do documento. */
  arquivos: new Map<string, Blob>(),
}

export function resetDb() {
  db.notas = gerarNotas()
  db.arquivos.clear()
}

export const encontrarNota = (id: string) => db.notas.find((n) => n.id === id)

export function paraResumo({ documentos, ...nota }: NotaFiscalDetalhe): NotaFiscal {
  return {
    id: nota.id,
    numero: nota.numero,
    serie: nota.serie,
    base: nota.base,
    empresa: nota.empresa,
    dataEmissao: nota.dataEmissao,
    cliente: nota.cliente,
    valorTotal: nota.valorTotal,
    quantidadeAnexos: documentos.length,
  }
}

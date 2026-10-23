import type { Base } from '@scanhub/shared'

/** Cores do selo de cada base. */
export const ESTILO_BASE: Record<Base, string> = {
  P: 'bg-purple-100 text-purple-700',
  B: 'bg-blue-100 text-blue-700',
}

/** Estado de navegação da lista para o detalhe: URL da lista (com filtros) para o "Voltar". */
export type EstadoDetalhe = { voltarPara: string }

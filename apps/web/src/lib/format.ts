import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export const formatCurrency = (value: number) => currency.format(value)

export const formatDate = (iso: string, pattern = 'dd/MM/yyyy') =>
  format(parseISO(iso), pattern, { locale: ptBR })

export const formatDateTime = (iso: string) => formatDate(iso, "dd/MM/yyyy', 'HH:mm")

/** Formata 14 dígitos como CNPJ (00.000.000/0000-00); outros valores voltam como vieram. */
export const formatCnpj = (cnpj: string) => {
  const digitos = cnpj.replace(/\D/g, '')
  if (digitos.length !== 14) return cnpj
  return digitos.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
}

const decimal = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })

export const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 ** 2) return `${decimal.format(bytes / 1024)} KB`
  return `${decimal.format(bytes / 1024 ** 2)} MB`
}

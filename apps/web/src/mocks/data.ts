import type {
  Base,
  Documento,
  Empresa,
  NotaFiscalDetalhe,
  Observacao,
  TipoDocumento,
} from '@scanhub/shared'

/** Credenciais aceitas pelo mock de login. */
export const usuarioMock = {
  id: '1',
  nome: 'Operador Scanhub',
  email: 'operador@scanhub.com.br',
  senha: 'scanhub123',
}

export const empresasMock: (Empresa & { base: Base; serie: string })[] = [
  { id: '1', nome: 'GEHFER MATRIZ NOVA', base: 'P', serie: '1' },
  { id: '2', nome: 'GEHFER BKP MATRIZ', base: 'B', serie: '2' },
]

export const tiposDocumentoMock: TipoDocumento[] = [
  { id: '1', nome: 'Canhoto assinado' },
  { id: '2', nome: 'Comprovante de entrega' },
  { id: '3', nome: 'Comprovante de pagamento' },
  { id: '4', nome: 'Boleto' },
  { id: '5', nome: 'Romaneio' },
  { id: '6', nome: 'Outros' },
]

const clientes = [
  { nome: 'BRAS TELHAS LTDA', cnpj: '02779444000100' },
  { nome: 'METAL POCOS FERROS E ACOS LTDA', cnpj: '22617204000109' },
  { nome: 'RBR TELHAS TERMOACUSTICA LTDA', cnpj: '19770426000152' },
  { nome: 'GALVTELHAS CALHAS TORRES INDUSTRIA E COMERCIO LTDA', cnpj: '74458746000180' },
  { nome: 'CORTFER PINTURAS E TELHAS TERMOACUSTICAS LTDA', cnpj: '43132986000166' },
  { nome: 'CLOVIS SOUZA IGNAN', cnpj: '96614540000134' },
  { nome: 'CARBINATTO EMPREENDIMENTOS LTDA', cnpj: '37696399000105' },
  { nome: 'SANTA RITA BENEFICIADORA E COMERCIO DE BATATAS LTDA', cnpj: '64960606000151' },
  { nome: 'AÇOS VALE DO PARAÍBA LTDA', cnpj: '11222333000181' },
  { nome: 'CONSTRUTORA HORIZONTE S.A.', cnpj: '45678901000123' },
]

const usuarios = ['Isabela Sousa', 'Marcos Lima', 'Juliana Prado']

const textosObservacao = [
  'Cliente solicitou reenvio do canhoto por e-mail.',
  'Canhoto recebido com rasura na data; conferido com a transportadora.',
  'Aguardando comprovante de pagamento do financeiro.',
]

/** Gerador pseudoaleatório com semente fixa: os dados são os mesmos a cada carga. */
function aleatorio(semente: number) {
  let estado = semente
  return () => {
    estado = (estado * 1_103_515_245 + 12_345) % 2 ** 31
    return estado / 2 ** 31
  }
}

let rand = aleatorio(42)
const escolher = <T>(lista: T[]) => lista[Math.floor(rand() * lista.length)]!
const inteiro = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1))

export const gerarReferencia = () =>
  'REF-' +
  Array.from({ length: 8 }, () => '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ'[inteiro(0, 33)]).join('')

/** Data/hora alguns dias após a emissão, sem passar do momento atual. */
function emDiasApos(dataIso: string, dias: number, hora: number) {
  const data = new Date(`${dataIso}T00:00:00Z`)
  data.setUTCDate(data.getUTCDate() + dias)
  data.setUTCHours(hora, inteiro(0, 59))
  return new Date(Math.min(data.getTime(), Date.now() - 60 * 60_000)).toISOString()
}

let proximoId = 1
const novoId = () => String(proximoId++)

export function novoDocumento(
  dados: Pick<Documento, 'nomeArquivo' | 'mimeType' | 'tamanhoBytes' | 'tipo'> & Partial<Documento>,
): Documento {
  return {
    id: `doc-${novoId()}`,
    referencia: gerarReferencia(),
    enviadoEm: new Date().toISOString(),
    enviadoPor: usuarioMock.nome,
    ...dados,
  }
}

export function novaObservacao(texto: string, extra?: Partial<Observacao>): Observacao {
  return {
    id: `obs-${novoId()}`,
    texto,
    autor: usuarioMock.nome,
    criadaEm: new Date().toISOString(),
    ...extra,
  }
}

export function gerarNotas(): NotaFiscalDetalhe[] {
  rand = aleatorio(42)
  proximoId = 1

  return Array.from({ length: 137 }, (_, i) => {
    const empresa = escolher(empresasMock)
    const emissao = new Date(Date.UTC(2026, 9, 21))
    emissao.setUTCDate(emissao.getUTCDate() - Math.floor(i / 3))
    const dataEmissao = emissao.toISOString().slice(0, 10)
    const numero = String((empresa.base === 'P' ? 1400 : 21700) - i)

    const quantidadeDocumentos = rand() < 0.7 ? inteiro(1, 3) : 0
    const documentos = Array.from({ length: quantidadeDocumentos }, (_, d) => {
      const tipo = d === 0 ? tiposDocumentoMock[0]! : escolher(tiposDocumentoMock)
      return novoDocumento({
        nomeArquivo: d === 0 ? `${numero}.pdf` : `${numero}-${d + 1}.pdf`,
        mimeType: 'application/pdf',
        tamanhoBytes: inteiro(80_000, 900_000),
        tipo,
        enviadoEm: emDiasApos(dataEmissao, inteiro(1, 4), inteiro(8, 17)),
        enviadoPor: escolher(usuarios),
      })
    })

    const observacoes =
      rand() < 0.25
        ? [
            novaObservacao(escolher(textosObservacao), {
              autor: escolher(usuarios),
              criadaEm: emDiasApos(dataEmissao, 1, inteiro(8, 17)),
            }),
          ]
        : []

    return {
      id: String(i + 1),
      numero,
      serie: empresa.serie,
      base: empresa.base,
      referencia: gerarReferencia(),
      situacao: 'Impressa',
      empresa: { id: empresa.id, nome: empresa.nome },
      dataEmissao,
      cliente: escolher(clientes),
      valorTotal: Math.round(rand() * 25_000_000) / 100,
      documentos,
      observacoes,
    }
  })
}

/** PDF mínimo (uma página com texto ASCII) para simular os arquivos já existentes. */
export function gerarPdfExemplo(texto: string) {
  const ascii = texto
    .normalize('NFD')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/[()\\]/g, '\\$&')
  const conteudo = `BT /F1 20 Tf 72 760 Td (${ascii}) Tj 0 -28 Td /F1 12 Tf (Documento de exemplo gerado pelo mock do Scanhub) Tj ET`
  const objetos = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${conteudo.length} >>\nstream\n${conteudo}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ]

  let pdf = '%PDF-1.4\n'
  const offsets = objetos.map((obj, i) => {
    const offset = pdf.length
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`
    return offset
  })
  const inicioXref = pdf.length
  pdf += `xref\n0 ${objetos.length + 1}\n0000000000 65535 f \n`
  pdf += offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')
  pdf += `trailer\n<< /Size ${objetos.length + 1} /Root 1 0 R >>\nstartxref\n${inicioXref}\n%%EOF`
  return pdf
}

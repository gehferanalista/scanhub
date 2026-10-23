import { eq, sql } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { erroDoBanco, prepararBancoDeTeste, urlBancoDeTeste } from '../test/banco-de-teste'
import type { Banco } from './banco'
import { aplicarMigrations } from './migrations'
import {
  auditoria,
  documentos,
  empresas,
  notasFiscais,
  observacoes,
  tiposDocumento,
  usuarios,
} from './schema'

const url = urlBancoDeTeste()

describe.skipIf(!url)('banco de dados (Postgres real)', () => {
  let banco: Banco
  const db = () => banco.db

  beforeAll(async () => {
    banco = await prepararBancoDeTeste(url!)
  })

  afterAll(() => banco?.fechar())

  async function criarCenario() {
    const [usuario] = await db()
      .insert(usuarios)
      .values({
        nome: 'Operadora',
        email: `operadora.${crypto.randomUUID()}@scanhub.com.br`,
        senhaHash: 'hash',
        perfil: 'scanner',
      })
      .returning()
    const [empresa] = await db()
      .insert(empresas)
      .values({
        base: 'P',
        codigoEmpresa: '01',
        codigoFilial: crypto.randomUUID().slice(0, 8),
        nome: 'GEHFER MATRIZ',
      })
      .returning()
    const [nota] = await db()
      .insert(notasFiscais)
      .values({
        empresaId: empresa!.id,
        referencia: `REF-${crypto.randomUUID().slice(0, 8)}`,
        numero: '1247',
        serie: '1',
        clienteCodigo: '000123',
        clienteLoja: '01',
        clienteNome: 'BRAS TELHAS LTDA',
        clienteDocumento: '02779444000100',
        dataEmissao: '2026-08-28',
        valorTotal: 105000.5,
      })
      .returning()
    const [tipo] = await db()
      .insert(tiposDocumento)
      .values({ nome: `Canhoto ${crypto.randomUUID()}` })
      .returning()
    const [documento] = await db()
      .insert(documentos)
      .values({
        notaFiscalId: nota!.id,
        tipoDocumentoId: tipo!.id,
        referencia: `REF-${crypto.randomUUID().slice(0, 8)}`,
        nomeArquivo: '1247.pdf',
        mimeType: 'application/pdf',
        tamanhoBytes: 1024,
        sha256: 'abc',
        chaveArmazenamento: `notas/${crypto.randomUUID()}.pdf`,
        origem: 'upload',
        enviadoPorId: usuario!.id,
      })
      .returning()
    return { usuario: usuario!, nota: nota!, documento: documento! }
  }

  describe('migrations', () => {
    it('criam todas as tabelas', async () => {
      const { rows } = await db().execute<{ table_name: string }>(
        sql`select table_name from information_schema.tables where table_schema = 'public' order by 1`,
      )
      expect(rows.map((r) => r.table_name)).toEqual([
        'auditoria',
        'documentos',
        'empresas',
        'notas_fiscais',
        'observacoes',
        'sessoes',
        'tipos_documento',
        'usuarios',
      ])
    })

    it('podem ser aplicadas de novo sem efeito', async () => {
      await expect(aplicarMigrations(db())).resolves.toBeUndefined()
    })
  })

  describe('notas fiscais', () => {
    it('devolvem valor como número e data como texto', async () => {
      const { nota } = await criarCenario()
      const [lida] = await db().select().from(notasFiscais).where(eq(notasFiscais.id, nota.id))
      expect(lida!.valorTotal).toBe(105000.5)
      expect(lida!.dataEmissao).toBe('2026-08-28')
    })
  })

  describe('usuários', () => {
    it('não aceitam e-mail repetido, mesmo com maiúsculas diferentes', async () => {
      const valores = { nome: 'Fulano', senhaHash: 'hash', perfil: 'viewer' as const }
      await db()
        .insert(usuarios)
        .values({ ...valores, email: 'fulano@scanhub.com.br' })

      expect(
        await erroDoBanco(
          db()
            .insert(usuarios)
            .values({ ...valores, email: 'FULANO@scanhub.com.br' }),
        ),
      ).toMatch(/usuarios_email_unico/)
    })
  })

  describe('documentos', () => {
    it('não podem ser apagados fisicamente', async () => {
      const { documento } = await criarCenario()
      expect(
        await erroDoBanco(db().delete(documentos).where(eq(documentos.id, documento.id))),
      ).toMatch(/não podem ser apagados/)
    })

    it('exigem quem, quando e motivo na exclusão lógica', async () => {
      const { documento, usuario } = await criarCenario()
      const excluir = (motivo: string | null) =>
        db()
          .update(documentos)
          .set({ excluidoEm: new Date(), excluidoPorId: usuario.id, motivoExclusao: motivo })
          .where(eq(documentos.id, documento.id))

      expect(await erroDoBanco(excluir(null))).toMatch(/documentos_exclusao_completa/)
      expect(await erroDoBanco(excluir('   '))).toMatch(/documentos_exclusao_completa/)

      await excluir('Arquivo da nota errada')
      const [lido] = await db().select().from(documentos).where(eq(documentos.id, documento.id))
      expect(lido!.motivoExclusao).toBe('Arquivo da nota errada')
    })

    it('não podem mais ser alterados depois de excluídos', async () => {
      const { documento, usuario } = await criarCenario()
      const porId = eq(documentos.id, documento.id)
      await db()
        .update(documentos)
        .set({ excluidoEm: new Date(), excluidoPorId: usuario.id, motivoExclusao: 'Duplicado' })
        .where(porId)

      expect(
        await erroDoBanco(
          db()
            .update(documentos)
            .set({ excluidoEm: null, excluidoPorId: null, motivoExclusao: null })
            .where(porId),
        ),
      ).toMatch(/já foi excluído/)
    })

    it('não permitem trocar os dados do arquivo', async () => {
      const { documento } = await criarCenario()
      expect(
        await erroDoBanco(
          db()
            .update(documentos)
            .set({ nomeArquivo: 'outro.pdf' })
            .where(eq(documentos.id, documento.id)),
        ),
      ).toMatch(/Somente a exclusão lógica/)
    })
  })

  describe('observações', () => {
    it('não podem ser alteradas nem apagadas', async () => {
      const { nota, usuario } = await criarCenario()
      const [obs] = await db()
        .insert(observacoes)
        .values({ notaFiscalId: nota.id, autorId: usuario.id, texto: 'Canhoto recebido' })
        .returning()
      const porId = eq(observacoes.id, obs!.id)

      expect(
        await erroDoBanco(db().update(observacoes).set({ texto: 'editado' }).where(porId)),
      ).toMatch(/não podem ser alterados/)
      expect(await erroDoBanco(db().delete(observacoes).where(porId))).toMatch(
        /não podem ser alterados/,
      )
    })

    it('não aceitam texto vazio', async () => {
      const { nota, usuario } = await criarCenario()
      expect(
        await erroDoBanco(
          db()
            .insert(observacoes)
            .values({ notaFiscalId: nota.id, autorId: usuario.id, texto: '  ' }),
        ),
      ).toMatch(/observacoes_texto_valido/)
    })
  })

  describe('auditoria', () => {
    it('só aceita inclusão', async () => {
      const [registro] = await db()
        .insert(auditoria)
        .values({ acao: 'teste.executado', entidade: 'teste', dados: { ok: true } })
        .returning()
      const porId = eq(auditoria.id, registro!.id)

      expect(await erroDoBanco(db().update(auditoria).set({ acao: 'x' }).where(porId))).toMatch(
        /não podem ser alterados/,
      )
      expect(await erroDoBanco(db().delete(auditoria).where(porId))).toMatch(
        /não podem ser alterados/,
      )
      expect(await erroDoBanco(db().execute(sql`truncate auditoria`))).toMatch(
        /não podem ser alterados/,
      )
    })
  })
})

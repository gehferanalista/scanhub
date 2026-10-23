import { TAMANHO_PAGINA_PADRAO, type CampoOrdenacao } from '@scanhub/shared'
import { useQuery } from '@tanstack/react-query'
import { Paginacao } from '@/components/paginacao'
import { notasFiscaisQueries } from './api'
import { FiltrosNotasForm } from './components/filtros-notas'
import { TabelaNotas } from './components/tabela-notas'
import { SEM_FILTROS, useFiltrosNotas } from './filtros'

export function NotasFiscaisPage() {
  const { filtros, atualizar } = useFiltrosNotas()
  const { data, isPending, isError, isPlaceholderData, isFetching, refetch } = useQuery(
    notasFiscaisQueries.list(filtros),
  )

  const ordenar = (campo: CampoOrdenacao) => {
    const inverter = filtros.ordenarPor === campo && filtros.ordem === 'asc'
    // Campos de data e valor começam do maior para o menor; texto, em ordem alfabética
    const ordemInicial = campo === 'emissao' || campo === 'valor' ? 'desc' : 'asc'
    atualizar({
      ordenarPor: campo,
      ordem: filtros.ordenarPor === campo ? (inverter ? 'desc' : 'asc') : ordemInicial,
      pagina: 1,
    })
  }

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Notas fiscais de saída</h1>
        <p className="text-sm text-muted-foreground">
          Notas importadas do ERP para conferência documental.
        </p>
      </header>

      <FiltrosNotasForm filtros={filtros} onAplicar={atualizar} />

      <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
        <TabelaNotas
          notas={data?.itens}
          carregando={isPending}
          atualizando={isPlaceholderData && isFetching}
          erro={isError}
          ordenacao={filtros}
          onOrdenar={ordenar}
          onTentarNovamente={() => void refetch()}
          onLimparFiltros={() => atualizar(SEM_FILTROS)}
        />
      </div>

      {data && data.total > 0 && (
        <Paginacao
          pagina={filtros.pagina}
          tamanhoPagina={TAMANHO_PAGINA_PADRAO}
          total={data.total}
          onMudarPagina={(pagina) => atualizar({ pagina })}
        />
      )}
    </section>
  )
}

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  Building2,
  CalendarDays,
  Database,
  FileDown,
  Hash,
  Loader2,
  Paperclip,
  Search,
  X,
} from 'lucide-react'
import { useMemo, type ReactNode } from 'react'
import { Controller, useForm, type Control } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { exportarNotas, notasFiscaisQueries } from '../api'
import { filtrosSchema, SEM_FILTROS, type FiltrosNotas } from '../filtros'
import { BASES } from '../types'

/** Radix Select não aceita item com valor vazio; este valor representa "sem filtro". */
const TODOS = 'todos'

const formSchema = z
  .object({
    numero: z.string(),
    cliente: z.string(),
    empresaId: z.string(),
    base: z.string(),
    anexo: z.string(),
    emissaoDe: z.string(),
    emissaoAte: z.string(),
  })
  .refine((v) => !v.emissaoDe || !v.emissaoAte || v.emissaoDe <= v.emissaoAte, {
    message: 'A data inicial deve ser anterior à final',
    path: ['emissaoAte'],
  })
type FormValues = z.infer<typeof formSchema>

function paraFormulario(f: FiltrosNotas): FormValues {
  return {
    numero: f.numero ?? '',
    cliente: f.cliente ?? '',
    empresaId: f.empresaId ?? TODOS,
    base: f.base ?? TODOS,
    anexo: f.anexo ?? TODOS,
    emissaoDe: f.emissaoDe ?? '',
    emissaoAte: f.emissaoAte ?? '',
  }
}

function paraFiltros(v: FormValues): Partial<FiltrosNotas> {
  const semTodos = (valor: string) => (valor === TODOS ? undefined : valor)
  const {
    ordenarPor: _o,
    ordem: _d,
    pagina: _p,
    ...filtros
  } = filtrosSchema.parse({
    ...v,
    empresaId: semTodos(v.empresaId),
    base: semTodos(v.base),
    anexo: semTodos(v.anexo),
  })
  return { ...filtros, pagina: 1 }
}

type FiltrosNotasProps = {
  filtros: FiltrosNotas
  onAplicar: (filtros: Partial<FiltrosNotas>) => void
}

export function FiltrosNotasForm({ filtros, onAplicar }: FiltrosNotasProps) {
  const valoresAtuais = useMemo(() => paraFormulario(filtros), [filtros])
  const { data: empresas = [] } = useQuery(notasFiscaisQueries.empresas())

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    // Mantém o formulário em sincronia com a URL (ex.: botão voltar do navegador)
    values: valoresAtuais,
  })

  const exportar = useMutation({
    mutationFn: () => exportarNotas(filtros),
    onError: () => toast.error('Não foi possível exportar as notas.'),
  })

  const temFiltroAtivo = Object.values(valoresAtuais).some((v) => v !== '' && v !== TODOS)

  return (
    <form
      onSubmit={handleSubmit((v) => onAplicar(paraFiltros(v)))}
      className="grid gap-3 rounded-xl border bg-card p-4 shadow-xs"
      role="search"
      aria-label="Filtros de notas fiscais"
    >
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto]">
        <CampoComIcone icone={<Hash />}>
          <Input
            placeholder="Buscar por número da NF…"
            aria-label="Número da NF"
            inputMode="numeric"
            className="pl-9"
            {...register('numero')}
          />
        </CampoComIcone>
        <CampoComIcone icone={<Building2 />}>
          <Input
            placeholder="Buscar por cliente (nome ou CNPJ)…"
            aria-label="Cliente"
            className="pl-9"
            {...register('cliente')}
          />
        </CampoComIcone>
        <div className="grid gap-1">
          <div
            className="flex h-9 items-center gap-2 rounded-md border border-input px-3 shadow-xs data-[invalid=true]:border-destructive"
            data-invalid={!!errors.emissaoAte}
          >
            <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
            <span className="text-sm whitespace-nowrap text-muted-foreground">Emissão</span>
            <input
              type="date"
              aria-label="Emissão de"
              className="bg-transparent text-sm outline-none"
              {...register('emissaoDe')}
            />
            <span className="text-sm text-muted-foreground">até</span>
            <input
              type="date"
              aria-label="Emissão até"
              aria-invalid={!!errors.emissaoAte}
              className="bg-transparent text-sm outline-none"
              {...register('emissaoAte')}
            />
          </div>
          {errors.emissaoAte && (
            <p className="text-xs text-destructive">{errors.emissaoAte.message}</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SelectFiltro
          control={control}
          name="empresaId"
          rotulo="Empresa"
          icone={<Building2 />}
          className="w-60"
          opcoes={[
            { valor: TODOS, rotulo: 'Todas as empresas' },
            ...empresas.map((e) => ({ valor: e.id, rotulo: e.nome })),
          ]}
        />
        <SelectFiltro
          control={control}
          name="base"
          rotulo="Base"
          icone={<Database />}
          className="w-44"
          opcoes={[
            { valor: TODOS, rotulo: 'Todas as bases' },
            ...Object.entries(BASES).map(([valor, b]) => ({ valor, rotulo: b.nome })),
          ]}
        />
        <SelectFiltro
          control={control}
          name="anexo"
          rotulo="Status do anexo"
          icone={<Paperclip />}
          className="w-44"
          opcoes={[
            { valor: TODOS, rotulo: 'Todos os status' },
            { valor: 'com', rotulo: 'Com anexo' },
            { valor: 'sem', rotulo: 'Sem anexo' },
          ]}
        />

        <div className="ml-auto flex gap-2">
          {temFiltroAtivo && (
            <Button type="button" variant="ghost" onClick={() => onAplicar(SEM_FILTROS)}>
              <X />
              Limpar
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => exportar.mutate()}
            disabled={exportar.isPending}
          >
            {exportar.isPending ? <Loader2 className="animate-spin" /> : <FileDown />}
            Exportar
          </Button>
          <Button type="submit" className="px-6">
            <Search />
            Buscar
          </Button>
        </div>
      </div>
    </form>
  )
}

function CampoComIcone({ icone, children }: { icone: ReactNode; children: ReactNode }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground [&_svg]:size-4">
        {icone}
      </span>
      {children}
    </div>
  )
}

type SelectFiltroProps = {
  control: Control<FormValues>
  name: 'empresaId' | 'base' | 'anexo'
  rotulo: string
  icone: ReactNode
  className?: string
  opcoes: { valor: string; rotulo: string }[]
}

function SelectFiltro({ control, name, rotulo, icone, className, opcoes }: SelectFiltroProps) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Select value={field.value} onValueChange={field.onChange}>
          <SelectTrigger aria-label={rotulo} className={className}>
            <span className="flex min-w-0 items-center gap-2">
              {icone}
              <span className="truncate">
                <SelectValue />
              </span>
            </span>
          </SelectTrigger>
          <SelectContent>
            {opcoes.map((o) => (
              <SelectItem key={o.valor} value={o.valor}>
                {o.rotulo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    />
  )
}

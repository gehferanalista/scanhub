# Scanhub

Sistema de conferência documental de notas fiscais de saída. As NFs vêm do ERP e, para cada nota, o usuário anexa documentos comprobatórios (PDF, JPG ou PNG), enviando o arquivo ou digitalizando direto do scanner da estação.

## Estrutura

```
apps/
  web/              Front-end (React + Vite)
  api/              API (Node + Fastify)
packages/
  shared/           Schemas zod e tipos usados pelo front e pela API
  eslint-config/    Configuração base do ESLint
```

As versões de `typescript`, `zod`, `vitest` e `@types/node` ficam no catálogo do
`pnpm-workspace.yaml` (use `"catalog:"` no `package.json`).

## Requisitos

- Node 24+
- pnpm 11+

## Comandos

```sh
pnpm install
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env

pnpm dev            # front em http://localhost:5173 e API em http://localhost:3333
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm format
```

### Banco de dados local

Requer o Docker Desktop aberto. O Postgres (16, mesma versão da VM) fica em `docker-compose.dev.yml`:

```sh
pnpm db:up          # sobe e espera ficar pronto
pnpm db:down        # para (os dados continuam no volume)
pnpm db:reset       # apaga tudo e sobe um banco vazio
pnpm db:psql        # abre o psql no banco
pnpm db:migrate     # aplica as migrations pendentes
pnpm db:generate    # gera uma migration a partir do schema (apps/api/src/db/schema)
```

As migrations ficam em `apps/api/drizzle` (SQL versionado, revise antes de aplicar). Regras que o
schema não expressa, como os triggers de imutabilidade, vão em migrations personalizadas
(`pnpm --filter @scanhub/api exec drizzle-kit generate --custom --name <nome>`).

Os testes de integração da API usam o Postgres de verdade: com `TEST_DATABASE_URL` definido em
`apps/api/.env`, eles **apagam e recriam** o banco `scanhub_test` a cada execução (o nome precisa
terminar em `_test`). Sem a variável, esses testes são pulados.

Conexão (também serve para o pgAdmin): `localhost:5432`, banco `scanhub`, usuário `scanhub`,
senha `scanhub`. Essa credencial vale só para desenvolvimento local.

O projeto Docker se chama `scanhub-v2-dev`, para não conflitar com o sistema antigo, que usa `scanhub`.

### Mocks

Com `VITE_ENABLE_MOCKS=true`, o front usa a API simulada pelo MSW (`apps/web/src/mocks`).
Para usar a API local, defina `VITE_ENABLE_MOCKS=false` e `API_PROXY_TARGET=http://localhost:3333`
em `apps/web/.env.local`.

## API

- `GET /api/saude` — verificação de saúde.
- Erros sempre no formato `{ codigo, mensagem, detalhes? }` (`erroApiSchema` em `@scanhub/shared`).
- Logs estruturados (pino): legíveis em desenvolvimento, JSON em produção. O cabeçalho
  `x-request-id` é usado como id da requisição nos logs.
- Produção: `pnpm --filter @scanhub/api build` e `pnpm --filter @scanhub/api start`.

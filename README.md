# Scanhub

Sistema de conferência documental de notas fiscais de saída. As NFs vêm do ERP e, para cada nota, o usuário anexa documentos comprobatórios (PDF, JPG ou PNG), enviando o arquivo ou digitalizando direto do scanner da estação.

## Estrutura

```
apps/
  web/        Front-end (React + Vite)
packages/     Pacotes compartilhados (futuro)
```

## Requisitos

- Node 24+
- pnpm 11+

## Comandos

```sh
pnpm install
cp apps/web/.env.example apps/web/.env.local

pnpm dev            # sobe o front em http://localhost:5173
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm format
```

Com `VITE_ENABLE_MOCKS=true`, a API do ERP é simulada pelo MSW (`apps/web/src/mocks`).

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { Providers } from '@/app/providers'
import { router } from '@/app/router'
import { env } from '@/lib/env'
import '@/styles/globals.css'

async function enableMocking() {
  if (!import.meta.env.DEV || !env.VITE_ENABLE_MOCKS) return
  const { worker } = await import('@/mocks/browser')
  await worker.start({ onUnhandledFrame: 'bypass' })
}

await enableMocking()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  </StrictMode>,
)

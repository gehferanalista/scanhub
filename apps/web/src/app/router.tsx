import { createBrowserRouter, Navigate } from 'react-router'
import { AppLayout } from '@/components/layout/app-layout'
import { AuthLayout } from '@/components/layout/auth-layout'
import { RouteError } from '@/components/layout/route-error'
import { EsqueciSenhaPage } from '@/features/auth/esqueci-senha-page'
import { LoginPage } from '@/features/auth/login-page'

export const router = createBrowserRouter([
  {
    errorElement: <RouteError />,
    children: [
      { index: true, element: <Navigate to="/login" replace /> },
      {
        element: <AuthLayout />,
        children: [
          { path: 'login', element: <LoginPage /> },
          { path: 'esqueci-senha', element: <EsqueciSenhaPage /> },
        ],
      },
      {
        element: <AppLayout />,
        // Telas internas carregadas sob demanda para manter leve o carregamento do login
        children: [
          {
            path: 'notas',
            lazy: async () => ({
              Component: (await import('@/features/notas-fiscais/notas-fiscais-page'))
                .NotasFiscaisPage,
            }),
          },
          {
            path: 'notas/:id',
            lazy: async () => ({
              Component: (await import('@/features/notas-fiscais/detalhe/nota-fiscal-page'))
                .NotaFiscalPage,
            }),
          },
        ],
      },
    ],
  },
])

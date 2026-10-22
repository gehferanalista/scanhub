import { FileCheck2 } from 'lucide-react'
import { NavLink, Outlet } from 'react-router'
import { cn } from '@/lib/utils'

const navItems = [{ to: '/notas', label: 'Notas fiscais' }]

export function AppLayout() {
  return (
    <div className="flex min-h-svh flex-col bg-muted/40">
      <header className="border-b bg-card print:hidden">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-8 px-6">
          <div className="flex items-center gap-2 font-semibold">
            <FileCheck2 className="size-5 text-primary" />
            Scanhub
          </div>
          <nav className="flex gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground',
                    isActive && 'bg-accent text-foreground',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}

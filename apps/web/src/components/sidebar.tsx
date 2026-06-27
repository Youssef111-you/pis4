'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Activity,
  History,
  GitCompareArrows,
  FlaskConical,
  FileText,
  Zap,
} from 'lucide-react';

const links = [
  { href: '/', label: 'Vue d’ensemble', icon: LayoutDashboard },
  { href: '/realtime', label: 'Temps réel', icon: Activity },
  { href: '/history', label: 'Historique', icon: History },
  { href: '/compare', label: 'Comparaisons', icon: GitCompareArrows },
  { href: '/hypotheses', label: 'Hypothèses', icon: FlaskConical },
  { href: '/report', label: 'Rapport', icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="fixed inset-y-0 left-0 z-20 flex w-64 flex-col border-r border-border bg-card/50">
      <div className="flex items-center gap-2 px-6 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Zap className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-bold leading-tight">EnergieSI</p>
          <p className="text-xs text-muted-foreground">Consommation énergétique</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {links.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                active ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon className="h-4.5 w-4.5" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="px-6 py-4 text-xs text-muted-foreground">
        <p>Projet d’initiation à la recherche</p>
        <p className="mt-1 opacity-70">© {new Date().getFullYear()} — Full-stack TypeScript</p>
      </div>
    </aside>
  );
}

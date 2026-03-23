'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Swords,
  Users,
  Shield,
  TrendingUp,
} from 'lucide-react';

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/matches', label: 'Partidas', icon: Swords },
  { href: '/players', label: 'Jogadores', icon: Users },
  { href: '/teams', label: 'Times', icon: Shield },
  { href: '/predictions', label: 'Previsões', icon: TrendingUp },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-xl font-bold text-green-400">Esporte da Sorte</h1>
        <p className="text-xs text-gray-400 mt-1">Análise Esportiva</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                active
                  ? 'bg-green-500/10 text-green-400'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon size={18} />
              <span className="text-sm font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <p className="text-xs text-gray-500 text-center">
          Powered by BetsAPI + StatsBomb
        </p>
      </div>
    </aside>
  );
}
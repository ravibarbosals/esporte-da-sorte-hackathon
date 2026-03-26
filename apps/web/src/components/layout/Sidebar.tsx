"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrainCircuit, Swords } from "lucide-react";

const links = [
  { href: "/matches", label: "Partidas", icon: Swords },
  { href: "/modelo", label: "Modelo", icon: BrainCircuit },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      <aside className="hidden w-72 border-r border-slate-800 bg-slate-950 md:flex md:flex-col">
        <div className="border-b border-slate-800 p-6">
          <h1 className="text-xl font-bold text-emerald-400">
            Esporte da Sorte
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Copiloto de leitura esportiva
          </p>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-colors ${
                  active
                    ? "bg-emerald-500/12 text-emerald-300"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon size={18} />
                <span className="text-sm font-medium">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-800 p-4">
          <p className="text-xs text-slate-500">
            Dados: BetsAPI live + replay StatsBomb
          </p>
        </div>
      </aside>

      <div className="border-b border-slate-800 bg-slate-950 p-3 md:hidden">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-sm font-bold text-emerald-300">
            Esporte da Sorte
          </h1>
          <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-300">
            PARTIDAS
          </span>
        </div>

        <nav className="flex gap-2 overflow-x-auto pb-1">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs ${
                  active
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                    : "border-slate-700 text-slate-400"
                }`}
              >
                <Icon size={12} />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}

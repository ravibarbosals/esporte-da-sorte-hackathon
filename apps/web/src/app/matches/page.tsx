'use client';

import { useEffect, useState } from 'react';
import { getUpcomingMatches, getLiveMatches } from '@/services/api';
import Link from 'next/link';

export default function MatchesPage() {
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [live, setLive] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'live' | 'upcoming'>('all');

  useEffect(() => {
    Promise.all([
      getUpcomingMatches(),
      getLiveMatches(),
    ]).then(([upcomingData, liveData]) => {
      setUpcoming(upcomingData || []);
      setLive(liveData || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const allMatches = [
    ...live.map(m => ({ ...m, isLive: true })),
    ...upcoming,
  ];

  const filtered = filter === 'live' ? live.map(m => ({ ...m, isLive: true }))
    : filter === 'upcoming' ? upcoming
    : allMatches;

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <p className="text-gray-400 animate-pulse">Carregando partidas...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Partidas</h1>
        <p className="text-gray-400 mt-1">Próximas partidas e ao vivo</p>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        {[
          { key: 'all', label: 'Todas' },
          { key: 'live', label: `Ao vivo (${live.length})` },
          { key: 'upcoming', label: `Próximas (${upcoming.length})` },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === key
                ? 'bg-green-500 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Lista de partidas */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-gray-900 rounded-xl p-8 text-center border border-gray-800">
            <p className="text-gray-400">Nenhuma partida encontrada</p>
          </div>
        ) : (
          filtered.map((match, i) => (
            <Link
              key={match.id || i}
              href={`/matches/${match.id}`}
              className="block bg-gray-900 rounded-xl border border-gray-800 p-4 hover:border-green-500/50 hover:bg-gray-800/50 transition-all"
            >
              <div className="flex items-center justify-between">
                {/* Liga */}
                <div className="flex items-center gap-2 mb-3">
                  {match.isLive && (
                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">
                      AO VIVO
                    </span>
                  )}
                  <span className="text-gray-400 text-xs">{match.league_name || match.league?.name}</span>
                </div>
              </div>

              {/* Times e placar */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-white font-semibold">{match.home_team || match.home?.name}</p>
                  <p className="text-gray-400 text-sm mt-1">{match.away_team || match.away?.name}</p>
                </div>

                {/* Placar ou horário */}
                <div className="text-center px-4">
                  {match.score && match.score !== 'null' ? (
                    <p className="text-white font-bold text-lg">{match.score}</p>
                  ) : (
                    <p className="text-gray-400 text-sm">
                      {match.match_time || match.time
                        ? new Date(
                            parseInt(match.match_time || match.time) * 1000
                          ).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                        : '--:--'}
                    </p>
                  )}
                </div>

                {/* Odds */}
                <div className="flex gap-2">
                  {match.home_odds && (
                    <>
                      <div className="bg-gray-800 rounded-lg px-3 py-2 text-center">
                        <p className="text-gray-400 text-xs">1</p>
                        <p className="text-green-400 font-bold">{match.home_odds}</p>
                      </div>
                      <div className="bg-gray-800 rounded-lg px-3 py-2 text-center">
                        <p className="text-gray-400 text-xs">X</p>
                        <p className="text-green-400 font-bold">{match.draw_odds}</p>
                      </div>
                      <div className="bg-gray-800 rounded-lg px-3 py-2 text-center">
                        <p className="text-gray-400 text-xs">2</p>
                        <p className="text-green-400 font-bold">{match.away_odds}</p>
                      </div>
                    </>
                  )}
                  {!match.home_odds && (
                    <span className="text-gray-500 text-sm self-center">Ver análise →</span>
                  )}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
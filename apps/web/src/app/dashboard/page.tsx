"use client";

import { useEffect, useState } from "react";
import {
  getTopScorers,
  getTopScoringTeams,
  getMostAggressiveTeams,
} from "@/services/api";

export default function DashboardPage() {
  const [topScorers, setTopScorers] = useState<any[]>([]);
  const [topTeams, setTopTeams] = useState<any[]>([]);
  const [aggressiveTeams, setAggressiveTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getTopScorers(5),
      getTopScoringTeams(5),
      getMostAggressiveTeams(5),
    ])
      .then(([scorers, teams, aggressive]) => {
        setTopScorers(scorers || []);
        setTopTeams(teams || []);
        setAggressiveTeams(aggressive || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-400 animate-pulse">Carregando dados...</p>
      </div>
    );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1">Análise esportiva em tempo real</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <p className="text-gray-400 text-sm">Top Artilheiro</p>
          <p className="text-white text-xl font-bold mt-1">
            {topScorers[0]?.nomejogador}
          </p>
          <p className="text-green-400 text-2xl font-bold">
            {topScorers[0]?.gols} gols
          </p>
          <p className="text-gray-500 text-sm mt-1">
            {topScorers[0]?.time} · {topScorers[0]?.liga}
          </p>
        </div>

        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <p className="text-gray-400 text-sm">Time Mais Ofensivo</p>
          <p className="text-white text-xl font-bold mt-1">
            {topTeams[0]?.time}
          </p>
          <p className="text-green-400 text-2xl font-bold">
            {topTeams[0]?.total_gols} gols
          </p>
          <p className="text-gray-500 text-sm mt-1">{topTeams[0]?.comp}</p>
        </div>

        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <p className="text-gray-400 text-sm">Time Mais Agressivo</p>
          <p className="text-white text-xl font-bold mt-1">
            {aggressiveTeams[0]?.time}
          </p>
          <p className="text-yellow-400 text-2xl font-bold">
            {aggressiveTeams[0]?.total_amarelos} 🟨
          </p>
          <p className="text-gray-500 text-sm mt-1">
            {aggressiveTeams[0]?.comp}
          </p>
        </div>
      </div>

      {/* Top Artilheiros */}
      <div className="bg-gray-900 rounded-xl border border-gray-800">
        <div className="p-5 border-b border-gray-800">
          <h2 className="text-white font-semibold text-lg">Top Artilheiros</h2>
          <p className="text-gray-400 text-sm">Temporada 2025/2026</p>
        </div>
        <div className="divide-y divide-gray-800">
          {topScorers.map((player, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <span className="text-gray-500 text-sm w-5">{i + 1}</span>
                <div>
                  <p className="text-white font-medium">{player.nomejogador}</p>
                  <p className="text-gray-400 text-sm">
                    {player.time} · {player.posicao}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-green-400 font-bold text-lg">
                  {player.gols}
                </p>
                <p className="text-gray-500 text-xs">
                  {player.assistencias} ast
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Times */}
      <div className="grid grid-cols-2 gap-4">
        {/* Times que mais marcam */}
        <div className="bg-gray-900 rounded-xl border border-gray-800">
          <div className="p-5 border-b border-gray-800">
            <h2 className="text-white font-semibold">Times que Mais Marcam</h2>
          </div>
          <div className="divide-y divide-gray-800">
            {topTeams.map((team, i) => (
              <div key={i} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-white font-medium">{team.time}</p>
                  <p className="text-gray-400 text-sm">{team.comp}</p>
                </div>
                <p className="text-green-400 font-bold">
                  {team.total_gols} gols
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Times mais agressivos */}
        <div className="bg-gray-900 rounded-xl border border-gray-800">
          <div className="p-5 border-b border-gray-800">
            <h2 className="text-white font-semibold">Times Mais Agressivos</h2>
          </div>
          <div className="divide-y divide-gray-800">
            {aggressiveTeams.map((team, i) => (
              <div key={i} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-white font-medium">{team.time}</p>
                  <p className="text-gray-400 text-sm">{team.comp}</p>
                </div>
                <div className="text-right">
                  <p className="text-yellow-400 font-bold">
                    {team.total_amarelos} 🟨
                  </p>
                  <p className="text-red-400 text-sm">
                    {team.total_vermelhos} 🟥
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

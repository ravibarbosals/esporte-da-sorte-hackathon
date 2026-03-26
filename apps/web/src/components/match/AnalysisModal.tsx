"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { AnalysisData } from "@/types/analysis";
import { getH2HStats, getMatchResult } from "@/lib/mocks/analysisData";
import styles from "./AnalysisModal.module.css";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  data: AnalysisData;
}

export default function AnalysisModal({ isOpen, onClose, data }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const homeStats = getH2HStats(data.h2h, data.homeTeam.name);
  const awayStats = getH2HStats(data.h2h, data.awayTeam.name);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const rc = (r: "W" | "D" | "L") =>
    ({
      W: "#00c853",
      D: "#ffd600",
      L: "#f44336",
    })[r];

  const rl = (r: "W" | "D" | "L") => ({ W: "V", D: "E", L: "D" })[r];

  return (
    <div
      ref={overlayRef}
      className={styles.overlay}
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.badge}>
            <span>📊</span>
            <span>ANALISE DE DADOS</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.teamsRow}>
          <div className={styles.team}>
            <span className={styles.flag}>{data.homeTeam.flagEmoji}</span>
            <span className={styles.teamName}>{data.homeTeam.name}</span>
          </div>

          <div className={styles.oddPill}>
            <span className={styles.oddType}>{data.oddType}</span>
            <span className={styles.oddValue}>@ {data.oddValue}</span>
          </div>

          <div className={`${styles.team} ${styles.teamRight}`}>
            <span className={styles.teamName}>{data.awayTeam.name}</span>
            <span className={styles.flag}>{data.awayTeam.flagEmoji}</span>
          </div>
        </div>

        <div className={styles.pills}>
          {[
            {
              label: `V ${data.homeTeam.shortName}`,
              value: homeStats.wins,
              color: data.homeTeam.color,
            },
            { label: "Empates", value: homeStats.draws, color: "#ffd600" },
            {
              label: `V ${data.awayTeam.shortName}`,
              value: awayStats.wins,
              color: data.awayTeam.color,
            },
            { label: "Med. Gols", value: homeStats.avgGoals, color: "#ff7043" },
            {
              label: "Over 2.5",
              value: `${homeStats.over25Pct}%`,
              color: "#ab47bc",
            },
            {
              label: "Ambos Marcam",
              value: `${homeStats.bttsPct}%`,
              color: "#26c6da",
            },
          ].map((s) => (
            <div
              key={s.label}
              className={styles.pill}
              style={{ "--c": s.color } as CSSProperties}
            >
              <span className={styles.pillVal}>{s.value}</span>
              <span className={styles.pillLbl}>{s.label}</span>
            </div>
          ))}
        </div>

        <div className={styles.sectionTitle}>Ultimos 5 confrontos diretos</div>
        <div className={styles.matchList}>
          {data.h2h.map((m, i) => {
            const res = getMatchResult(m, data.homeTeam.name);
            const isHome = m.homeTeam === data.homeTeam.name;
            return (
              <div
                key={i}
                className={styles.matchRow}
                style={{ "--rc": rc(res) } as CSSProperties}
              >
                <div className={styles.matchMeta}>
                  <span className={styles.matchDate}>{m.date}</span>
                  <span className={styles.matchComp}>{m.competition}</span>
                </div>
                <div className={styles.matchTeams}>
                  <span className={`${styles.mt} ${isHome ? styles.hl : ""}`}>
                    {m.homeTeam}
                  </span>
                  <div className={styles.score}>
                    <span>{m.homeScore}</span>
                    <span className={styles.sep}>-</span>
                    <span>{m.awayScore}</span>
                  </div>
                  <span
                    className={`${styles.mt} ${styles.mtr} ${!isHome ? styles.hl : ""}`}
                  >
                    {m.awayTeam}
                  </span>
                </div>
                <div
                  className={styles.resBadge}
                  style={{ background: rc(res) }}
                >
                  {rl(res)}
                </div>
              </div>
            );
          })}
        </div>

        <div className={styles.formRow}>
          {[
            { team: data.homeTeam, form: data.homeForm },
            { team: data.awayTeam, form: data.awayForm },
          ].map(({ team, form }) => {
            const wins = form.filter((f) => f.result === "W").length;
            return (
              <div key={team.name} className={styles.formCard}>
                <div className={styles.formHeader}>
                  <span>{team.flagEmoji}</span>
                  <span className={styles.formName}>{team.name}</span>
                  <span
                    style={{
                      color: team.color,
                      fontWeight: 800,
                      fontSize: 12,
                    }}
                  >
                    {Math.round((wins / Math.max(1, form.length)) * 100)}% V
                  </span>
                </div>
                <div className={styles.formDots}>
                  {form.map((f, i) => (
                    <div
                      key={i}
                      className={styles.dot}
                      style={{ background: rc(f.result) }}
                      title={`${f.match} ${f.score}`}
                    >
                      {rl(f.result)}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className={styles.analystBox}>
          <div className={styles.analystHeader}>
            <span>Nota do analista</span>
            <div className={styles.confBar}>
              <div
                className={styles.confFill}
                style={{ width: `${data.confidence}%` }}
              />
            </div>
            <span
              style={{
                color: "#00c853",
                fontWeight: 800,
                fontSize: 12,
                whiteSpace: "nowrap",
              }}
            >
              {data.confidence}% confianca
            </span>
          </div>
          <p className={styles.analystText}>{data.analystNote}</p>
        </div>
      </div>
    </div>
  );
}

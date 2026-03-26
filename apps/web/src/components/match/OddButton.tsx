"use client";

import { useState } from "react";
import { AnalysisTeam } from "@/types/analysis";
import { useAnalysis } from "@/lib/hooks/useAnalysis";
import AnalysisModal from "./AnalysisModal";
import styles from "./OddButton.module.css";

interface OddButtonProps {
  label: string;
  value: string;
  homeTeam: AnalysisTeam;
  awayTeam: AnalysisTeam;
  oddType: string;
  competitionId?: string;
  isActive?: boolean;
  onClick?: () => void;
}

export default function OddButton({
  label,
  value,
  homeTeam,
  awayTeam,
  oddType,
  competitionId = "53",
  isActive = false,
  onClick,
}: OddButtonProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const { data, loading, error, fetchAnalysis } = useAnalysis({
    competitionId,
  });

  const handleAnalysis = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setModalOpen(true);
    await fetchAnalysis(homeTeam.name, awayTeam.name, oddType, value);
  };

  return (
    <>
      <div className={`${styles.wrap} ${isActive ? styles.active : ""}`}>
        <button
          className={styles.oddBtn}
          onClick={onClick}
          aria-label={`${oddType} @ ${value}`}
        >
          <span className={styles.lbl}>{label}</span>
          <span className={styles.val}>{value}</span>
        </button>
        <button
          className={styles.analysisBtn}
          onClick={handleAnalysis}
          disabled={loading}
        >
          {loading ? (
            <span className={styles.spinner} />
          ) : (
            <>
              <span>📊</span>
              <span className={styles.analysisTxt}>ANALISE</span>
            </>
          )}
        </button>
      </div>

      {modalOpen && loading && (
        <div className={styles.loadOverlay}>
          <div className={styles.loadCard}>
            <span className={styles.loadSpinner} />
            <span className={styles.loadTxt}>Buscando analise...</span>
          </div>
        </div>
      )}

      {modalOpen && error && !loading && (
        <div className={styles.loadOverlay}>
          <div className={styles.loadCard}>
            <span className={styles.loadTxt}>
              Falha ao carregar analise: {error}
            </span>
            <button
              className={styles.analysisBtn}
              onClick={() => setModalOpen(false)}
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {modalOpen && data && (
        <AnalysisModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          data={data}
        />
      )}
    </>
  );
}

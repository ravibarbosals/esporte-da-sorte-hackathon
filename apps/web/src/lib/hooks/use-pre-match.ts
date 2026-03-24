"use client";

import { useEffect, useState } from "react";
import { PreMatchAnalysis } from "@/types";
import { getPreMatchAnalyses } from "@/services/assistant";

export function usePreMatch() {
  const [items, setItems] = useState<PreMatchAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    getPreMatchAnalyses()
      .then((data) => {
        if (!mounted) {
          return;
        }
        setItems(data);
      })
      .catch(() => {
        if (!mounted) {
          return;
        }
        setItems([]);
      })
      .finally(() => {
        if (!mounted) {
          return;
        }
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return {
    items,
    loading,
  };
}

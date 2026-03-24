"use client";

import { useEffect, useState } from "react";
import { ModelExplanationSection } from "@/types";
import { getModelExplanation } from "@/services/assistant";

export function useModelExplanation() {
  const [sections, setSections] = useState<ModelExplanationSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    getModelExplanation()
      .then((data) => {
        if (!mounted) {
          return;
        }
        setSections(data);
      })
      .catch(() => {
        if (!mounted) {
          return;
        }
        setSections([]);
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
    sections,
    loading,
  };
}

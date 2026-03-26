export function safeText(value: unknown, fallback: string): string {
  const parsed = String(value ?? "").trim();
  if (!parsed) {
    return fallback;
  }

  const normalized = parsed.toLowerCase();
  if (
    normalized === "undefined" ||
    normalized === "null" ||
    normalized === "nan"
  ) {
    return fallback;
  }

  return parsed;
}

export function safeNonNegativeNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }
  return parsed;
}

export function formatPercent(value: unknown, fallback = "-"): string {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  const safe = Math.max(0, Math.min(100, Math.round(parsed)));
  return `${safe}%`;
}

export function formatDecimalOdd(value: unknown, fallback = "-"): string {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 1) {
    return fallback;
  }

  return parsed.toFixed(2);
}

export function formatMinuteLabel(minute: unknown, fallback: string): string {
  const parsed = Number(minute);
  if (Number.isFinite(parsed) && parsed > 0 && parsed <= 180) {
    return `${Math.round(parsed)}'`;
  }
  return fallback;
}

export function formatScorePair(
  home: unknown,
  away: unknown,
): { home: number; away: number } {
  return {
    home: safeNonNegativeNumber(home, 0),
    away: safeNonNegativeNumber(away, 0),
  };
}

export function normalizeSourceTag(source: unknown, isLive: boolean): string {
  const normalized = String(source ?? "")
    .trim()
    .toLowerCase();

  if (normalized === "betsapi" && isLive) {
    return "live-real";
  }
  if (normalized === "statsbomb-replay") {
    return "replay";
  }
  if (normalized === "fallback") {
    return "fallback";
  }
  return "unknown";
}

export function formatMatchStatusLabel(
  status: unknown,
  phase: unknown,
  isLive: boolean,
): string {
  const signal = String(phase ?? status ?? "")
    .trim()
    .toLowerCase();

  if (isLive || signal === "live" || signal === "inplay") {
    return "AO VIVO";
  }
  if (signal === "finished" || signal === "ended") {
    return "ENCERRADO";
  }
  if (signal === "upcoming" || signal === "scheduled") {
    return "AGENDADO";
  }
  return "STATUS INDISPONIVEL";
}

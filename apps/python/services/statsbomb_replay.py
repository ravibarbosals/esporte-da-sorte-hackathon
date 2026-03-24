import glob
import json
import os
from dataclasses import dataclass
from datetime import datetime
from functools import lru_cache
from typing import Any, Dict, List, Optional, Tuple

DATA_ROOT = os.path.join("data", "statsbomb", "data")
EVENTS_DIR = os.path.join(DATA_ROOT, "events")
LINEUPS_DIR = os.path.join(DATA_ROOT, "lineups")
MATCHES_DIR = os.path.join(DATA_ROOT, "matches")
COMPETITIONS_FILE = os.path.join(DATA_ROOT, "competitions.json")

RELEVANT_EVENT_TYPES = {
    "Shot",
    "Foul Committed",
    "Bad Behaviour",
    "Substitution",
    "Pass",
    "Carry",
}

ON_TARGET_OUTCOMES = {
    "Goal",
    "Saved",
    "Saved to Post",
}

CARD_TYPES = {
    "Yellow Card": "yellow",
    "Second Yellow": "second_yellow",
    "Red Card": "red",
}

FIXED_REPLAY_MATCH_IDS = [4020846, 4020077, 4020005]

FIXED_REPLAY_MATCH_META: Dict[int, Dict[str, str]] = {
    4020846: {
        "competition": "UEFA Women's Euro",
        "matchDate": "2022-07-31",
        "kickoff": "18:00:00",
        "homeTeam": "England Women's",
        "awayTeam": "Spain Women's",
    },
    4020077: {
        "competition": "UEFA Women's Euro",
        "matchDate": "2022-07-12",
        "kickoff": "20:00:00",
        "homeTeam": "Germany Women's",
        "awayTeam": "Spain Women's",
    },
    4020005: {
        "competition": "UEFA Women's Euro",
        "matchDate": "2022-07-19",
        "kickoff": "20:00:00",
        "homeTeam": "England Women's",
        "awayTeam": "Italy Women's",
    },
}


@dataclass
class TeamSnapshot:
    name: str
    goals: int = 0
    shots: int = 0
    shots_on_target: int = 0
    xg: float = 0.0
    fouls: int = 0
    yellow_cards: int = 0
    red_cards: int = 0
    substitutions: int = 0
    corners: int = 0
    offensive_actions: int = 0
    box_entries: int = 0
    progressive_passes: int = 0


def _safe_get(data: Dict[str, Any], path: List[str], default: Any = None) -> Any:
    current = data
    for key in path:
        if not isinstance(current, dict) or key not in current:
            return default
        current = current[key]
    return current


def _to_float(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


@lru_cache(maxsize=4096)
def _load_json(file_path: str) -> Any:
    if not os.path.exists(file_path):
        return None
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)


@lru_cache(maxsize=1)
def get_competitions() -> List[Dict[str, Any]]:
    data = _load_json(COMPETITIONS_FILE)
    return data if isinstance(data, list) else []


@lru_cache(maxsize=1)
def _build_match_index() -> Dict[int, Dict[str, Any]]:
    index: Dict[int, Dict[str, Any]] = {}

    for file_path in glob.glob(os.path.join(MATCHES_DIR, "*", "*.json")):
        matches = _load_json(file_path)
        if not isinstance(matches, list):
            continue

        competition_id = os.path.basename(os.path.dirname(file_path))
        season_file = os.path.basename(file_path)
        season_id = season_file.replace(".json", "")

        for m in matches:
            if not isinstance(m, dict) or "match_id" not in m:
                continue

            match_id = int(m["match_id"])
            home_name = _safe_get(m, ["home_team", "home_team_name"], "Home")
            away_name = _safe_get(m, ["away_team", "away_team_name"], "Away")

            index[match_id] = {
                "match_id": match_id,
                "match_date": m.get("match_date"),
                "kick_off": m.get("kick_off"),
                "competition_id": int(_safe_get(m, ["competition", "competition_id"], competition_id) or 0),
                "competition_name": _safe_get(m, ["competition", "competition_name"], "Unknown competition"),
                "season_id": int(_safe_get(m, ["season", "season_id"], season_id) or 0),
                "season_name": _safe_get(m, ["season", "season_name"], season_id),
                "home_team": home_name,
                "away_team": away_name,
                "home_team_id": _safe_get(m, ["home_team", "home_team_id"]),
                "away_team_id": _safe_get(m, ["away_team", "away_team_id"]),
                "home_score": int(m.get("home_score", 0) or 0),
                "away_score": int(m.get("away_score", 0) or 0),
                "status": m.get("match_status", "available"),
                "stage": _safe_get(m, ["competition_stage", "name"]),
                "stadium": _safe_get(m, ["stadium", "name"]),
                "has_events": os.path.exists(os.path.join(EVENTS_DIR, f"{match_id}.json")),
                "has_lineups": os.path.exists(os.path.join(LINEUPS_DIR, f"{match_id}.json")),
            }

    return index


@lru_cache(maxsize=1)
def _default_live_match_ids() -> List[int]:
    index = _build_match_index()
    fixed_available = [match_id for match_id in FIXED_REPLAY_MATCH_IDS if match_id in index]
    if fixed_available:
        return fixed_available

    indexed = [m for m in index.values() if m["has_events"] and m["has_lineups"]]

    def sort_key(item: Dict[str, Any]) -> Tuple[str, str]:
        return (item.get("match_date") or "1900-01-01", item.get("kick_off") or "00:00:00")

    indexed.sort(key=sort_key, reverse=True)
    return [int(m["match_id"]) for m in indexed[:3]]


def _fixed_replay_cards(limit: int, minute: int) -> List[Dict[str, Any]]:
    selected = FIXED_REPLAY_MATCH_IDS[: max(1, limit)]
    cards: List[Dict[str, Any]] = []
    for match_id in selected:
        meta = FIXED_REPLAY_MATCH_META.get(match_id, {})
        cards.append(
            {
                "id": str(match_id),
                "status": "replay_live",
                "competition": meta.get("competition", "StatsBomb Replay"),
                "matchDate": meta.get("matchDate"),
                "kickoff": meta.get("kickoff"),
                "minute": minute,
                "homeTeam": meta.get("homeTeam", "Time da casa"),
                "awayTeam": meta.get("awayTeam", "Time visitante"),
                "score": {"home": 0, "away": 0},
                "miniInsight": "Replay StatsBomb fixo para garantir vitrine quando live real estiver vazio.",
            }
        )
    return cards


@lru_cache(maxsize=4096)
def _load_events(match_id: int) -> List[Dict[str, Any]]:
    data = _load_json(os.path.join(EVENTS_DIR, f"{match_id}.json"))
    return data if isinstance(data, list) else []


@lru_cache(maxsize=4096)
def _load_lineups(match_id: int) -> List[Dict[str, Any]]:
    data = _load_json(os.path.join(LINEUPS_DIR, f"{match_id}.json"))
    return data if isinstance(data, list) else []


def _get_match_meta(match_id: int) -> Optional[Dict[str, Any]]:
    return _build_match_index().get(match_id)


def _event_minute(event: Dict[str, Any]) -> int:
    minute = int(event.get("minute", 0) or 0)
    period = int(event.get("period", 1) or 1)

    if period in (3, 4) and minute < 90:
        minute += 90
    return minute


def _is_progressive_pass(event: Dict[str, Any]) -> bool:
    if _safe_get(event, ["type", "name"]) != "Pass":
        return False

    start = event.get("location") or []
    end = _safe_get(event, ["pass", "end_location"], []) or []
    if len(start) < 2 or len(end) < 2:
        return False

    progression = _to_float(end[0]) - _to_float(start[0])
    return progression >= 12


def _is_box_entry(event: Dict[str, Any]) -> bool:
    event_type = _safe_get(event, ["type", "name"])
    if event_type not in {"Pass", "Carry", "Shot"}:
        return False

    end = _safe_get(event, ["pass", "end_location"], None)
    if end is None and event_type == "Carry":
        end = _safe_get(event, ["carry", "end_location"], None)
    if end is None:
        end = event.get("location")

    if not isinstance(end, list) or len(end) < 2:
        return False

    x = _to_float(end[0])
    y = _to_float(end[1])
    return x >= 102 and 18 <= y <= 62


def _is_offensive_action(event: Dict[str, Any]) -> bool:
    event_type = _safe_get(event, ["type", "name"])
    if event_type == "Shot":
        return True
    if _is_box_entry(event):
        return True
    if _is_progressive_pass(event):
        return True

    if event_type == "Pass" and _safe_get(event, ["pass", "shot_assist"], False):
        return True

    return False


def _normalize_event(event: Dict[str, Any]) -> Dict[str, Any]:
    event_type = _safe_get(event, ["type", "name"], "Unknown")
    team = _safe_get(event, ["team", "name"], "Unknown")
    player = _safe_get(event, ["player", "name"], "Unknown")

    shot_outcome = _safe_get(event, ["shot", "outcome", "name"])
    is_goal = event_type == "Shot" and shot_outcome == "Goal"
    xg = _to_float(_safe_get(event, ["shot", "statsbomb_xg"], 0.0)) if event_type == "Shot" else 0.0

    card_name = _safe_get(event, ["foul_committed", "card", "name"]) or _safe_get(event, ["bad_behaviour", "card", "name"])

    return {
        "id": str(event.get("id", "")),
        "minute": _event_minute(event),
        "second": int(event.get("second", 0) or 0),
        "period": int(event.get("period", 1) or 1),
        "timestamp": event.get("timestamp"),
        "type": event_type,
        "team": team,
        "player": player,
        "xg": round(xg, 3),
        "is_goal": is_goal,
        "is_on_target": event_type == "Shot" and (shot_outcome in ON_TARGET_OUTCOMES),
        "is_dangerous_shot": event_type == "Shot" and (xg >= 0.15 or is_goal),
        "shot_outcome": shot_outcome,
        "card": CARD_TYPES.get(card_name or "", "none"),
        "substitution_replacement": _safe_get(event, ["substitution", "replacement", "name"]),
        "play_pattern": _safe_get(event, ["play_pattern", "name"]),
        "foul_type": _safe_get(event, ["foul_committed", "type", "name"]),
        "is_progressive_pass": _is_progressive_pass(event),
        "is_box_entry": _is_box_entry(event),
        "is_offensive_action": _is_offensive_action(event),
        "is_corner": event_type == "Pass" and _safe_get(event, ["pass", "type", "name"]) == "Corner",
    }


def _normalized_events(match_id: int) -> List[Dict[str, Any]]:
    normalized: List[Dict[str, Any]] = []

    for event in _load_events(match_id):
        event_type = _safe_get(event, ["type", "name"])
        if event_type not in RELEVANT_EVENT_TYPES and event_type != "Shot":
            continue
        normalized.append(_normalize_event(event))

    normalized.sort(key=lambda e: (e["minute"], e["second"], e["id"]))
    return normalized


def _events_until(match_id: int, minute: int) -> List[Dict[str, Any]]:
    minute = max(0, min(130, minute))
    return [e for e in _normalized_events(match_id) if e["minute"] <= minute]


def _init_team_snapshots(meta: Dict[str, Any]) -> Dict[str, TeamSnapshot]:
    home = meta["home_team"]
    away = meta["away_team"]
    return {
        home: TeamSnapshot(name=home),
        away: TeamSnapshot(name=away),
    }


def _summary_text(event: Dict[str, Any]) -> str:
    team = event["team"]
    player = event["player"]
    minute = event["minute"]

    if event["type"] == "Shot":
        if event["is_goal"]:
            return f"{minute}' Gol de {player} para {team}."
        if event["is_dangerous_shot"]:
            return f"{minute}' Finalizacao perigosa de {player} ({team})."
        return f"{minute}' Chute de {player} para {team}."

    if event["card"] in {"yellow", "second_yellow", "red"}:
        card_text = {
            "yellow": "cartao amarelo",
            "second_yellow": "segundo amarelo",
            "red": "cartao vermelho",
        }.get(event["card"], "cartao")
        return f"{minute}' {card_text} para {player} ({team})."

    if event["type"] == "Substitution":
        replacement = event.get("substitution_replacement") or "reserva"
        return f"{minute}' Substituicao em {team}: sai {player}, entra {replacement}."

    if event["type"] == "Foul Committed":
        return f"{minute}' Falta cometida por {player} ({team})."

    return f"{minute}' {event['type']} de {player} ({team})."


def get_matches(limit: int = 3, minute: int = 67) -> List[Dict[str, Any]]:
    selected = _default_live_match_ids()[: max(1, limit)]
    if not selected:
        return _fixed_replay_cards(limit, minute)

    results: List[Dict[str, Any]] = []

    for match_id in selected:
        meta = _get_match_meta(match_id)
        if not meta:
            continue

        state = get_match_state(match_id, minute)
        results.append(
            {
                "id": str(match_id),
                "status": "replay_live",
                "competition": meta["competition_name"],
                "matchDate": meta.get("match_date"),
                "kickoff": meta.get("kick_off"),
                "minute": minute,
                "homeTeam": meta["home_team"],
                "awayTeam": meta["away_team"],
                "score": {
                    "home": state["home"]["goals"],
                    "away": state["away"]["goals"],
                },
                "miniInsight": state.get("miniInsight"),
            }
        )

    if results:
        return results

    return _fixed_replay_cards(limit, minute)


def get_match(match_id: int) -> Optional[Dict[str, Any]]:
    meta = _get_match_meta(match_id)
    if not meta:
        return None

    return {
        "id": str(match_id),
        "competition": {
            "id": meta.get("competition_id"),
            "name": meta.get("competition_name"),
            "season": meta.get("season_name"),
        },
        "homeTeam": {
            "id": meta.get("home_team_id"),
            "name": meta.get("home_team"),
        },
        "awayTeam": {
            "id": meta.get("away_team_id"),
            "name": meta.get("away_team"),
        },
        "scheduled": {
            "date": meta.get("match_date"),
            "kickoff": meta.get("kick_off"),
        },
        "context": {
            "stage": meta.get("stage"),
            "stadium": meta.get("stadium"),
            "source": "statsbomb-local",
        },
    }


def get_match_state(match_id: int, minute: int) -> Optional[Dict[str, Any]]:
    meta = _get_match_meta(match_id)
    if not meta:
        return None

    events = _events_until(match_id, minute)
    teams = _init_team_snapshots(meta)

    recent_texts: List[str] = []

    for event in events:
        team = teams.get(event["team"])
        if not team:
            continue

        if event["type"] == "Shot":
            team.shots += 1
            team.xg += event["xg"]
            if event["is_on_target"]:
                team.shots_on_target += 1
            if event["is_goal"]:
                team.goals += 1

        if event["type"] == "Foul Committed":
            team.fouls += 1

        if event["type"] == "Substitution":
            team.substitutions += 1

        if event["card"] == "yellow":
            team.yellow_cards += 1
        if event["card"] in {"red", "second_yellow"}:
            team.red_cards += 1

        if event["is_corner"]:
            team.corners += 1

        if event["is_offensive_action"]:
            team.offensive_actions += 1

        if event["is_box_entry"]:
            team.box_entries += 1

        if event["is_progressive_pass"]:
            team.progressive_passes += 1

    for event in events[-6:]:
        if event["type"] in {"Shot", "Substitution", "Foul Committed"} or event["card"] != "none":
            recent_texts.append(_summary_text(event))

    home = teams[meta["home_team"]]
    away = teams[meta["away_team"]]

    mini_insight = (
        f"{meta['home_team']} {home.goals} x {away.goals} {meta['away_team']} aos {minute} min. "
        f"xG acumulado {home.xg:.2f} x {away.xg:.2f}."
    )

    return {
        "matchId": str(match_id),
        "minute": minute,
        "home": {
            "name": home.name,
            "goals": home.goals,
            "shots": home.shots,
            "shotsOnTarget": home.shots_on_target,
            "xg": round(home.xg, 3),
            "yellowCards": home.yellow_cards,
            "redCards": home.red_cards,
            "fouls": home.fouls,
        },
        "away": {
            "name": away.name,
            "goals": away.goals,
            "shots": away.shots,
            "shotsOnTarget": away.shots_on_target,
            "xg": round(away.xg, 3),
            "yellowCards": away.yellow_cards,
            "redCards": away.red_cards,
            "fouls": away.fouls,
        },
        "recentEvents": recent_texts[-5:],
        "miniInsight": mini_insight,
    }


def get_match_timeline(match_id: int, minute: int) -> Optional[List[Dict[str, Any]]]:
    meta = _get_match_meta(match_id)
    if not meta:
        return None

    timeline: List[Dict[str, Any]] = []

    for event in _events_until(match_id, minute):
        include = False
        event_ui_type = "outro"
        impact = "medio"

        if event["type"] == "Shot" and event["is_goal"]:
            include = True
            event_ui_type = "gol"
            impact = "alto"
        elif event["type"] == "Shot" and event["is_dangerous_shot"]:
            include = True
            event_ui_type = "finalizacao"
            impact = "alto"
        elif event["card"] != "none":
            include = True
            event_ui_type = "cartao"
            impact = "medio"
        elif event["type"] == "Substitution":
            include = True
            event_ui_type = "substituicao"
            impact = "medio"
        elif event["type"] == "Foul Committed" and event.get("foul_type") in {"Dangerous Play", "Handball", "Penalty"}:
            include = True
            event_ui_type = "outro"
            impact = "medio"

        if include:
            timeline.append(
                {
                    "id": event["id"],
                    "minute": event["minute"],
                    "team": event["team"],
                    "type": event_ui_type,
                    "impact": impact,
                    "description": _summary_text(event),
                }
            )

    return timeline


def _momentum_scores(match_id: int, minute: int, window: int = 10) -> Optional[Dict[str, Any]]:
    meta = _get_match_meta(match_id)
    if not meta:
        return None

    window_start = max(0, minute - window)
    recent = [e for e in _events_until(match_id, minute) if e["minute"] >= window_start]

    home = meta["home_team"]
    away = meta["away_team"]

    score = {home: 0.0, away: 0.0}

    for event in recent:
        team = event["team"]
        if team not in score:
            continue

        if event["type"] == "Shot":
            score[team] += 2.0
            score[team] += event["xg"] * 8.0
            if event["is_dangerous_shot"]:
                score[team] += 1.5
        if event["is_offensive_action"]:
            score[team] += 1.1
        if event["is_box_entry"]:
            score[team] += 1.4
        if event["is_progressive_pass"]:
            score[team] += 1.0
        if event["is_corner"]:
            score[team] += 0.9

    home_raw = score[home]
    away_raw = score[away]
    total = home_raw + away_raw

    if total <= 0:
        home_momentum = 50
        away_momentum = 50
    else:
        home_momentum = int(round((home_raw / total) * 100))
        away_momentum = int(round((away_raw / total) * 100))

    diff = home_momentum - away_momentum
    if abs(diff) < 7:
        trend = "estavel"
        summary = "Janela recente equilibrada, sem dominancia clara."
    elif diff > 0:
        trend = "home_up"
        summary = f"{home} pressiona mais nos ultimos {window} minutos."
    else:
        trend = "away_up"
        summary = f"{away} pressiona mais nos ultimos {window} minutos."

    return {
        "minute": minute,
        "window": window,
        "homeTeam": home,
        "awayTeam": away,
        "homeMomentum": home_momentum,
        "awayMomentum": away_momentum,
        "trend": trend,
        "summary": summary,
        "signals": {
            "homeRaw": round(home_raw, 3),
            "awayRaw": round(away_raw, 3),
            "source": "statsbomb-events",
        },
    }


def get_match_momentum(match_id: int, minute: int) -> Optional[Dict[str, Any]]:
    return _momentum_scores(match_id, minute, window=10)


def _clip(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def _winner_probs(state: Dict[str, Any], momentum: Dict[str, Any]) -> Dict[str, float]:
    home_goals = state["home"]["goals"]
    away_goals = state["away"]["goals"]
    goal_diff = home_goals - away_goals

    home_xg = state["home"]["xg"]
    away_xg = state["away"]["xg"]

    xg_diff = home_xg - away_xg
    momentum_diff = (momentum["homeMomentum"] - momentum["awayMomentum"]) / 100.0

    base_home = 0.34 + (goal_diff * 0.14) + (xg_diff * 0.11) + (momentum_diff * 0.18)
    base_away = 0.34 - (goal_diff * 0.14) - (xg_diff * 0.11) - (momentum_diff * 0.18)

    base_home = _clip(base_home, 0.05, 0.9)
    base_away = _clip(base_away, 0.05, 0.9)

    draw = _clip(1.0 - base_home - base_away, 0.05, 0.7)
    total = base_home + base_away + draw

    return {
        "home": round((base_home / total) * 100, 1),
        "draw": round((draw / total) * 100, 1),
        "away": round((base_away / total) * 100, 1),
    }


def get_match_predictions(match_id: int, minute: int) -> Optional[Dict[str, Any]]:
    state = get_match_state(match_id, minute)
    momentum = get_match_momentum(match_id, minute)
    meta = _get_match_meta(match_id)

    if not state or not momentum or not meta:
        return None

    winner = _winner_probs(state, momentum)

    home_name = state["home"]["name"]
    away_name = state["away"]["name"]

    shots_total = state["home"]["shots"] + state["away"]["shots"]
    card_total = (
        state["home"]["yellowCards"]
        + state["away"]["yellowCards"]
        + state["home"]["redCards"] * 2
        + state["away"]["redCards"] * 2
    )

    home_next_goal = _clip(0.33 + (momentum["homeMomentum"] - 50) / 120 + (state["home"]["xg"] - state["away"]["xg"]) / 12, 0.1, 0.8)
    away_next_goal = _clip(0.33 + (momentum["awayMomentum"] - 50) / 120 + (state["away"]["xg"] - state["home"]["xg"]) / 12, 0.1, 0.8)
    none_next_goal = _clip(1 - home_next_goal - away_next_goal, 0.05, 0.7)
    ng_total = home_next_goal + away_next_goal + none_next_goal

    minutes_left = max(0, 95 - minute)
    confidence = _clip(0.45 + minute / 180, 0.45, 0.9)

    trailing_team = home_name if state["home"]["goals"] < state["away"]["goals"] else away_name
    trailing_momentum = momentum["homeMomentum"] if trailing_team == home_name else momentum["awayMomentum"]
    leading_momentum = momentum["awayMomentum"] if trailing_team == home_name else momentum["homeMomentum"]

    comeback = _clip(0.1 + (trailing_momentum - leading_momentum) / 180 + minutes_left / 300, 0.02, 0.45)

    card_risk_total = _clip(0.15 + card_total / 14 + shots_total / 100, 0.1, 0.85)
    penalty_risk_total = _clip(0.05 + (state["home"]["shotsOnTarget"] + state["away"]["shotsOnTarget"]) / 50 + (momentum["homeMomentum"] + momentum["awayMomentum"]) / 600, 0.03, 0.4)

    return {
        "matchId": str(match_id),
        "minute": minute,
        "winnerProbability": {
            "label": "Probabilidade de resultado final",
            "probability": winner,
            "confidence": round(confidence, 2),
            "trend": momentum["trend"],
            "explanation": "Score atual, xG acumulado e momentum recente foram combinados em um scoring interpretavel.",
            "factors": [
                {"name": "score_diff", "value": state["home"]["goals"] - state["away"]["goals"]},
                {"name": "xg_diff", "value": round(state["home"]["xg"] - state["away"]["xg"], 3)},
                {"name": "momentum_diff", "value": momentum["homeMomentum"] - momentum["awayMomentum"]},
            ],
        },
        "nextGoalProbability": {
            "label": "Probabilidade do proximo gol",
            "probability": {
                "home": round((home_next_goal / ng_total) * 100, 1),
                "away": round((away_next_goal / ng_total) * 100, 1),
                "none": round((none_next_goal / ng_total) * 100, 1),
            },
            "confidence": round(_clip(confidence - 0.05, 0.35, 0.85), 2),
            "trend": momentum["trend"],
            "explanation": "Estimativa por pressao recente, xG e volume ofensivo acumulado.",
            "factors": [
                {"name": "home_momentum", "value": momentum["homeMomentum"]},
                {"name": "away_momentum", "value": momentum["awayMomentum"]},
                {"name": "xg_total", "value": round(state["home"]["xg"] + state["away"]["xg"], 3)},
            ],
        },
        "cardRisk": {
            "label": "Risco disciplinar",
            "probability": {
                "total": round(card_risk_total * 100, 1),
                "home": round(_clip(card_risk_total * 0.5 + state["home"]["fouls"] / 50, 0.05, 0.9) * 100, 1),
                "away": round(_clip(card_risk_total * 0.5 + state["away"]["fouls"] / 50, 0.05, 0.9) * 100, 1),
            },
            "confidence": round(_clip(confidence - 0.1, 0.35, 0.85), 2),
            "trend": "subindo" if card_total >= 3 else "estavel",
            "explanation": "Risco baseado em faltas, cartoes ja aplicados e ritmo de confronto.",
            "factors": [
                {"name": "fouls_total", "value": state["home"]["fouls"] + state["away"]["fouls"]},
                {"name": "cards_total", "value": card_total},
            ],
        },
        "penaltyRisk": {
            "label": "Chance de penalti no restante",
            "probability": round(penalty_risk_total * 100, 1),
            "confidence": round(_clip(confidence - 0.15, 0.25, 0.75), 2),
            "trend": "subindo" if penalty_risk_total > 0.2 else "estavel",
            "explanation": "Heuristica por presenca ofensiva, finalizacoes no alvo e intensidade recente.",
            "factors": [
                {"name": "shots_on_target", "value": state["home"]["shotsOnTarget"] + state["away"]["shotsOnTarget"]},
                {"name": "momentum_sum", "value": momentum["homeMomentum"] + momentum["awayMomentum"]},
            ],
        },
        "comebackChance": {
            "label": "Chance de reacao do time que esta atras",
            "team": trailing_team,
            "probability": round(comeback * 100, 1),
            "confidence": round(_clip(confidence - 0.08, 0.25, 0.8), 2),
            "trend": "subindo" if trailing_momentum > leading_momentum else "caindo",
            "explanation": "Estimativa usa placar atual, tempo restante e ritmo ofensivo da equipe em desvantagem.",
            "factors": [
                {"name": "minutes_left", "value": minutes_left},
                {"name": "trailing_momentum", "value": trailing_momentum},
                {"name": "leading_momentum", "value": leading_momentum},
            ],
        },
    }


def _team_recent_matches(team_name: str, before_date: str, competition_id: int, limit: int = 5) -> List[Dict[str, Any]]:
    idx = _build_match_index().values()

    filtered = [
        m
        for m in idx
        if m.get("competition_id") == competition_id
        and m.get("match_date")
        and m["match_date"] < before_date
        and (m["home_team"] == team_name or m["away_team"] == team_name)
        and m.get("has_events")
    ]

    filtered.sort(key=lambda m: m["match_date"], reverse=True)
    return filtered[:limit]


def _result_for_team(match_meta: Dict[str, Any], team_name: str) -> str:
    if match_meta["home_team"] == team_name:
        gf = match_meta["home_score"]
        ga = match_meta["away_score"]
    else:
        gf = match_meta["away_score"]
        ga = match_meta["home_score"]

    if gf > ga:
        return "V"
    if gf == ga:
        return "E"
    return "D"


def _team_avg_xg(team_name: str, matches: List[Dict[str, Any]]) -> float:
    values = []
    for m in matches:
        state = get_match_state(int(m["match_id"]), 95)
        if not state:
            continue
        if state["home"]["name"] == team_name:
            values.append(state["home"]["xg"])
        else:
            values.append(state["away"]["xg"])

    if not values:
        return 0.0
    return round(sum(values) / len(values), 3)


def get_pre_match_analysis(match_id: int) -> Optional[Dict[str, Any]]:
    meta = _get_match_meta(match_id)
    if not meta:
        return None

    match_date = meta.get("match_date") or datetime.utcnow().date().isoformat()
    comp_id = int(meta.get("competition_id") or 0)

    home_recent = _team_recent_matches(meta["home_team"], match_date, comp_id, limit=5)
    away_recent = _team_recent_matches(meta["away_team"], match_date, comp_id, limit=5)

    def avg_goals(team: str, data: List[Dict[str, Any]], scored: bool) -> float:
        vals = []
        for m in data:
            is_home = m["home_team"] == team
            gf = m["home_score"] if is_home else m["away_score"]
            ga = m["away_score"] if is_home else m["home_score"]
            vals.append(gf if scored else ga)
        if not vals:
            return 0.0
        return round(sum(vals) / len(vals), 2)

    home_form = "".join([_result_for_team(m, meta["home_team"]) for m in home_recent]) or "N/A"
    away_form = "".join([_result_for_team(m, meta["away_team"]) for m in away_recent]) or "N/A"

    h2h = [
        m
        for m in _build_match_index().values()
        if m.get("competition_id") == comp_id
        and m.get("match_date")
        and m["match_date"] < match_date
        and {m["home_team"], m["away_team"]} == {meta["home_team"], meta["away_team"]}
    ]
    h2h.sort(key=lambda m: m["match_date"], reverse=True)
    h2h = h2h[:5]

    return {
        "matchId": str(match_id),
        "homeTeam": meta["home_team"],
        "awayTeam": meta["away_team"],
        "recentForm": {
            "home": home_form,
            "away": away_form,
        },
        "averages": {
            "homeGoalsFor": avg_goals(meta["home_team"], home_recent, scored=True),
            "homeGoalsAgainst": avg_goals(meta["home_team"], home_recent, scored=False),
            "awayGoalsFor": avg_goals(meta["away_team"], away_recent, scored=True),
            "awayGoalsAgainst": avg_goals(meta["away_team"], away_recent, scored=False),
            "homeXg": _team_avg_xg(meta["home_team"], home_recent),
            "awayXg": _team_avg_xg(meta["away_team"], away_recent),
        },
        "headToHead": [
            {
                "matchId": str(m["match_id"]),
                "date": m["match_date"],
                "home": m["home_team"],
                "away": m["away_team"],
                "score": f"{m['home_score']} x {m['away_score']}",
            }
            for m in h2h
        ],
        "summary": (
            f"{meta['home_team']} chega com forma {home_form} e media de {avg_goals(meta['home_team'], home_recent, True)} gols marcados. "
            f"{meta['away_team']} vem com forma {away_form} e media de {avg_goals(meta['away_team'], away_recent, True)} gols marcados."
        ),
    }


def get_key_players(match_id: int) -> Optional[Dict[str, Any]]:
    meta = _get_match_meta(match_id)
    if not meta:
        return None

    events = _events_until(match_id, 95)
    lineups = _load_lineups(match_id)

    player_team: Dict[str, str] = {}
    for team_block in lineups:
        team_name = team_block.get("team_name")
        for p in team_block.get("lineup", []) or []:
            player_name = p.get("player_name")
            if team_name and player_name:
                player_team[player_name] = team_name

    player_stats: Dict[str, Dict[str, Any]] = {}

    for event in events:
        player = event.get("player")
        if not player or player == "Unknown":
            continue

        if player not in player_stats:
            player_stats[player] = {
                "team": event["team"],
                "shots": 0,
                "xg": 0.0,
                "key_passes": 0,
                "passes_into_box": 0,
                "cards": 0,
                "fouls": 0,
                "def_actions": 0,
            }

        stat = player_stats[player]

        if event["type"] == "Shot":
            stat["shots"] += 1
            stat["xg"] += event["xg"]

        if event["is_progressive_pass"]:
            stat["key_passes"] += 1

        if event["is_box_entry"]:
            stat["passes_into_box"] += 1

        if event["card"] != "none":
            stat["cards"] += 1

        if event["type"] == "Foul Committed":
            stat["fouls"] += 1

    raw_events = _load_events(match_id)
    for e in raw_events:
        player = _safe_get(e, ["player", "name"])
        if not player:
            continue

        event_type = _safe_get(e, ["type", "name"])
        if event_type in {"Duel", "Interception", "Block", "Clearance"}:
            if player not in player_stats:
                player_stats[player] = {
                    "team": _safe_get(e, ["team", "name"], "Unknown"),
                    "shots": 0,
                    "xg": 0.0,
                    "key_passes": 0,
                    "passes_into_box": 0,
                    "cards": 0,
                    "fouls": 0,
                    "def_actions": 0,
                }
            player_stats[player]["def_actions"] += 1

    if not player_stats:
        return {
            "matchId": str(match_id),
            "players": [],
        }

    def pick_best(metric_fn):
        return max(player_stats.items(), key=lambda item: metric_fn(item[1]))

    danger_name, danger_stat = pick_best(lambda s: s["xg"] * 2.3 + s["shots"] * 0.7)
    creator_name, creator_stat = pick_best(lambda s: s["key_passes"] * 1.4 + s["passes_into_box"] * 1.1)
    risk_name, risk_stat = pick_best(lambda s: s["cards"] * 2.0 + s["fouls"] * 0.35)
    defense_name, defense_stat = pick_best(lambda s: s["def_actions"])

    return {
        "matchId": str(match_id),
        "players": [
            {
                "role": "most_dangerous_offensive",
                "name": danger_name,
                "team": player_team.get(danger_name, danger_stat["team"]),
                "summary": f"{danger_name} lidera em xG ({danger_stat['xg']:.2f}) e volume de finalizacoes.",
                "signals": {
                    "shots": danger_stat["shots"],
                    "xg": round(danger_stat["xg"], 3),
                },
            },
            {
                "role": "most_creative",
                "name": creator_name,
                "team": player_team.get(creator_name, creator_stat["team"]),
                "summary": f"{creator_name} aparece mais na criacao de jogadas progressivas.",
                "signals": {
                    "keyPasses": creator_stat["key_passes"],
                    "boxEntries": creator_stat["passes_into_box"],
                },
            },
            {
                "role": "highest_disciplinary_risk",
                "name": risk_name,
                "team": player_team.get(risk_name, risk_stat["team"]),
                "summary": f"{risk_name} concentra mais sinais de risco disciplinar na partida.",
                "signals": {
                    "cards": risk_stat["cards"],
                    "fouls": risk_stat["fouls"],
                },
            },
            {
                "role": "defensive_anchor",
                "name": defense_name,
                "team": player_team.get(defense_name, defense_stat["team"]),
                "summary": f"{defense_name} tem maior participacao em acoes defensivas relevantes.",
                "signals": {
                    "defActions": defense_stat["def_actions"],
                },
            },
        ],
    }


def get_model_explanation() -> Dict[str, Any]:
    return {
        "model": "heuristic-live-replay-v1",
        "source": "statsbomb-local",
        "explanation": [
            {
                "id": "winner-probability",
                "title": "Probabilidade de vencedor",
                "content": "Combinacao interpretavel de placar atual, xG acumulado e momentum da janela recente.",
                "factors": ["score_diff", "xg_diff", "momentum_diff"],
            },
            {
                "id": "next-goal",
                "title": "Proximo gol",
                "content": "Pressao ofensiva recente, xG e finalizacoes no alvo ponderam quem esta mais perto do proximo gol.",
                "factors": ["home_momentum", "away_momentum", "xg_total", "shots_on_target"],
            },
            {
                "id": "disciplinary-penalty-risk",
                "title": "Riscos de cartao e penalti",
                "content": "Risco disciplinar e de penalti estimados por faltas, cartoes e intensidade ofensiva no jogo.",
                "factors": ["fouls_total", "cards_total", "offensive_pressure"],
            },
        ],
        "notes": [
            "Sem uso de mock no fluxo principal.",
            "Sem treino de modelo nesta etapa; heuristicas transparentes para demo.",
            "Persistencia opcional pode ser adicionada depois via adapter, hoje desativada.",
        ],
    }

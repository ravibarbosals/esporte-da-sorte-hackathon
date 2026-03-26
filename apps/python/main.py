from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from services.statsbomb import get_match_xg, get_team_xg_history, get_h2h_xg, get_team_shot_profile
from services.statsbomb_replay import (
    get_key_players,
    get_match,
    get_match_momentum,
    get_match_predictions,
    get_match_state,
    get_match_timeline,
    get_matches,
    get_model_explanation,
    get_pre_match_analysis,
)
from services.betsapi import (
    get_event_view,
    get_events_inplay,
    get_live_match,
    get_live_matches,
    get_live_momentum,
    get_live_odds_or_probabilities,
    get_live_timeline,
    get_match_odds,
    get_upcoming_matches,
)
from services.predictions import predict_match
from services.indicators import get_all_indicators
import json
import os

app = FastAPI(title="Esporte da Sorte - Analysis API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- HEALTH ---
@app.get("/health")
def health():
    return {"status": "ok"}

# --- PARTIDAS (BETSAPI) ---
@app.get("/matches/upcoming")
def upcoming_matches():
    return get_upcoming_matches()

@app.get("/matches/{event_id}/odds")
def match_odds(event_id: str):
    return get_match_odds(event_id)


# --- BETSAPI NORMALIZADA (PRIORIDADE PARA LIVE REAL) ---
@app.get("/betsapi/matches/live")
def betsapi_live_matches(limit: int = 10):
    return get_live_matches(limit=limit)


@app.get("/betsapi/events/inplay")
def betsapi_events_inplay(sport_id: int = 1):
    return get_events_inplay(sport_id=sport_id)


@app.get("/betsapi/events/{event_id}/view")
def betsapi_event_view(event_id: str):
    return get_event_view(event_id=event_id)


@app.get("/betsapi/matches/{match_id}")
def betsapi_live_match(match_id: str):
    match_data = get_live_match(match_id)
    if not match_data:
        raise HTTPException(status_code=404, detail="Partida ao vivo nao encontrada na BetsAPI")
    return match_data


@app.get("/betsapi/matches/{match_id}/timeline")
def betsapi_live_timeline(match_id: str):
    return get_live_timeline(match_id)


@app.get("/betsapi/matches/{match_id}/predictions")
def betsapi_live_predictions(match_id: str):
    payload = get_live_odds_or_probabilities(match_id)
    if not payload:
        raise HTTPException(status_code=404, detail="Previsoes indisponiveis para a partida")
    return payload


@app.get("/betsapi/matches/{match_id}/momentum")
def betsapi_live_momentum(match_id: str):
    payload = get_live_momentum(match_id)
    if not payload:
        raise HTTPException(status_code=404, detail="Momentum indisponivel para a partida")
    return payload

# --- XG POR PARTIDA ---
@app.get("/match/{match_id}/xg")
def match_xg(match_id: str):
    data = get_match_xg(match_id)
    if not data:
        raise HTTPException(status_code=404, detail="Partida não encontrada")
    return [
        {
            "time": r[0],
            "xg_total": r[1],
            "total_chutes": r[2],
            "gols": r[3]
        } for r in data
    ]

# --- HISTÓRICO XG DO TIME ---
@app.get("/team/{competition_id}/{team_name}/xg-history")
def team_xg_history(competition_id: str, team_name: str, limit: int = 10):
    data = get_team_xg_history(competition_id, team_name, limit)
    if not data:
        raise HTTPException(status_code=404, detail="Time não encontrado")
    return data

# --- PERFIL DE CHUTES DO TIME ---
@app.get("/team/{competition_id}/{team_name}/shot-profile")
def team_shot_profile(competition_id: str, team_name: str):
    data = get_team_shot_profile(competition_id, team_name)
    if not data:
        raise HTTPException(status_code=404, detail="Time não encontrado")
    return [
        {
            "tipo_chute": r[0],
            "parte_corpo": r[1],
            "total": r[2],
            "xg_medio": r[3],
            "gols": r[4],
            "taxa_conversao": r[5]
        } for r in data
    ]

# --- H2H COM XG ---
@app.get("/h2h/{competition_id}/{team_a}/{team_b}")
def h2h(competition_id: str, team_a: str, team_b: str):
    data = get_h2h_xg(competition_id, team_a, team_b)
    if not data:
        raise HTTPException(status_code=404, detail="H2H não encontrado")
    return data

# --- PREVISÕES ---
@app.get("/predictions/{home_team}/{away_team}")
def get_prediction(home_team: str, away_team: str):
    return predict_match(home_team, away_team)

# --- INDICADORES ---
@app.get("/indicators/{home_team}/{away_team}")
def get_indicators(home_team: str, away_team: str):
    return get_all_indicators(home_team, away_team)


# --- STATSBOMB LIVE REPLAY (REAL DATA, LOCAL) ---
@app.get("/statsbomb/matches/live")
def statsbomb_live_matches(minute: int = 67, limit: int = 3):
    return {
        "source": "statsbomb-replay",
        "mode": "replay",
        "minute": minute,
        "matches": get_matches(limit=limit, minute=minute),
    }


@app.get("/statsbomb/matches/{match_id}")
def statsbomb_match(match_id: int, minute: int = 67):
    match_data = get_match(match_id)
    if not match_data:
        raise HTTPException(status_code=404, detail="Partida nao encontrada")

    state = get_match_state(match_id, minute)
    if not state:
        raise HTTPException(status_code=404, detail="Eventos da partida nao encontrados")

    return {
        **match_data,
        "state": state,
    }


@app.get("/statsbomb/matches/{match_id}/state")
def statsbomb_match_state(match_id: int, minute: int = 67):
    state = get_match_state(match_id, minute)
    if not state:
        raise HTTPException(status_code=404, detail="Partida nao encontrada")
    return state


@app.get("/statsbomb/matches/{match_id}/timeline")
def statsbomb_match_timeline(match_id: int, minute: int = 67):
    timeline = get_match_timeline(match_id, minute)
    if timeline is None:
        raise HTTPException(status_code=404, detail="Partida nao encontrada")
    return {
        "matchId": str(match_id),
        "minute": minute,
        "events": timeline,
    }


@app.get("/statsbomb/matches/{match_id}/momentum")
def statsbomb_match_momentum(match_id: int, minute: int = 67):
    momentum = get_match_momentum(match_id, minute)
    if not momentum:
        raise HTTPException(status_code=404, detail="Partida nao encontrada")
    return momentum


@app.get("/statsbomb/matches/{match_id}/predictions")
def statsbomb_match_predictions(match_id: int, minute: int = 67):
    predictions = get_match_predictions(match_id, minute)
    if not predictions:
        raise HTTPException(status_code=404, detail="Partida nao encontrada")
    return predictions


@app.get("/statsbomb/matches/{match_id}/pre-match")
def statsbomb_pre_match(match_id: int):
    analysis = get_pre_match_analysis(match_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Partida nao encontrada")
    return analysis


@app.get("/statsbomb/matches/{match_id}/key-players")
def statsbomb_key_players(match_id: int):
    players = get_key_players(match_id)
    if not players:
        raise HTTPException(status_code=404, detail="Partida nao encontrada")
    return players


@app.get("/model/explanation")
def model_explanation():
    return get_model_explanation()
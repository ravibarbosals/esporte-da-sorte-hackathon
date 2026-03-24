from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from services.statsbomb import get_match_xg, get_team_xg_history, get_h2h_xg, get_team_shot_profile
from services.betsapi import get_upcoming_matches, get_match_odds
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
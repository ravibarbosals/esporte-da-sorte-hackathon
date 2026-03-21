from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from services.players import get_top_scorers, get_team_stats, get_team_risk, get_player_profile
from services.statsbomb import get_match_results, get_team_form
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

# --- INSIGHTS PRÉ-PROCESSADOS ---
@app.get("/insights")
def get_insights():
    path = "data/processed/insights.json"
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Insights não gerados ainda")
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

@app.get("/insights/frases")
def get_frases():
    path = "data/processed/frases.json"
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Frases não geradas ainda")
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

# --- JOGADORES ---
@app.get("/players/top-scorers")
def top_scorers(limit: int = 10):
    data = get_top_scorers(limit)
    return [
        {
            "player": r[0], "squad": r[1], "comp": r[2],
            "pos": r[3], "gols": r[4], "assists": r[5],
            "cartoes_amarelos": r[6], "cartoes_vermelhos": r[7],
            "gols_por_90": r[8]
        } for r in data
    ]

@app.get("/players/profile/{player_name}")
def player_profile(player_name: str):
    data = get_player_profile(player_name)
    if not data:
        raise HTTPException(status_code=404, detail="Jogador não encontrado")
    return {
        "player": data[0], "squad": data[1], "comp": data[2],
        "pos": data[3], "age": data[4], "gols": data[5],
        "assists": data[6], "cartoes_amarelos": data[7],
        "cartoes_vermelhos": data[8], "minutos": data[9],
        "chutes": data[10], "chutes_no_alvo": data[11],
        "gols_por_90": data[12]
    }

# --- TIMES ---
@app.get("/teams/{team_name}/stats")
def team_stats(team_name: str):
    data = get_team_stats(team_name)
    if not data:
        raise HTTPException(status_code=404, detail="Time não encontrado")
    return [
        {
            "player": r[0], "pos": r[1], "gols": r[2],
            "assists": r[3], "cartoes_amarelos": r[4],
            "cartoes_vermelhos": r[5], "minutos": r[6],
            "gols_por_90": r[7]
        } for r in data
    ]

@app.get("/teams/{team_name}/risk")
def team_risk(team_name: str):
    data = get_team_risk(team_name)
    if not data:
        raise HTTPException(status_code=404, detail="Time não encontrado")
    return {
        "team": team_name,
        "cartoes_amarelos": data[0],
        "cartoes_vermelhos": data[1],
        "media_amarelos_por_jogador": data[2]
    }

@app.get("/teams/{team_name}/form")
def team_form(team_name: str, competition_id: int = 11, season_id: int = 90):
    data = get_team_form(competition_id, season_id, team_name)
    if not data:
        raise HTTPException(status_code=404, detail="Time não encontrado")
    return [
        {
            "date": str(r[0]), "home": r[1], "away": r[2],
            "home_score": r[3], "away_score": r[4], "resultado": r[5]
        } for r in data
    ]

# --- PARTIDAS AO VIVO (BETSAPI) ---
@app.get("/matches/upcoming")
def upcoming_matches():
    return get_upcoming_matches()

@app.get("/matches/{event_id}/odds")
def match_odds(event_id: str):
    return get_match_odds(event_id)

@app.get("/matches/history/{competition_id}/{season_id}")
def match_history(competition_id: int, season_id: int):
    data = get_match_results(competition_id, season_id)
    return [
        {
            "match_id": r[0], "date": str(r[1]),
            "home": r[2], "away": r[3],
            "home_score": r[4], "away_score": r[5]
        } for r in data
    ]

@app.get("/health")
def health():
    return {"status": "ok"}

# --- PREVISÕES  ---

@app.get("/predictions/{home_team}/{away_team}")
def get_prediction(home_team: str, away_team: str):
    return predict_match(home_team, away_team)

# --- INDICADORES ---

@app.get("/indicators/{home_team}/{away_team}")
def get_indicators(home_team: str, away_team: str):
    return get_all_indicators(home_team, away_team)
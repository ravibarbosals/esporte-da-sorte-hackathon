from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from services.players import get_team_risk
from services.statsbomb import get_team_form
from services.betsapi import get_upcoming_matches, get_match_odds, get_inplay_matches
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


# --- TIMES ---

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

@app.get("/matches/live")
def live_matches():
    return get_inplay_matches()

@app.get("/matches/{event_id}/odds")
def match_odds(event_id: str):
    return get_match_odds(event_id)

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
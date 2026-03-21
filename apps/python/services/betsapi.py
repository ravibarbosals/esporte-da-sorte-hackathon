import requests
import os
from dotenv import load_dotenv

load_dotenv()

TOKEN = os.getenv("BETSAPI_TOKEN")
BASE_URL = "https://api.betsapi.com/v1"

def get_inplay_matches():
    response = requests.get(f"{BASE_URL}/bet365/inplay", params={"token": TOKEN})
    return response.json()

def get_prematch_odds(event_id):
    response = requests.get(f"{BASE_URL}/bet365/prematch", params={
        "token": TOKEN,
        "FI": event_id
    })
    return response.json()

def get_match_result(event_id):
    response = requests.get(f"{BASE_URL}/bet365/result", params={
        "token": TOKEN,
        "event_id": event_id
    })
    return response.json()

def get_leagues(sport_id=1):
    response = requests.get(f"{BASE_URL}/league", params={
        "token": TOKEN,
        "sport_id": sport_id
    })
    return response.json()

def get_upcoming_matches(sport_id=1):
    response = requests.get(f"{BASE_URL}/events/upcoming", params={
        "token": TOKEN,
        "sport_id": sport_id
    })
    return response.json()

def get_match_odds(event_id):
    response = requests.get(f"{BASE_URL}/bet365/prematch", params={
        "token": TOKEN,
        "FI": event_id
    })
    return response.json()

def get_league_results(league_id):
    response = requests.get(f"{BASE_URL}/events/ended", params={
        "token": TOKEN,
        "sport_id": 1,
        "league_id": league_id
    })
    return response.json()
import duckdb
import json

con = duckdb.connect()
con.execute("CREATE TABLE players AS SELECT * FROM read_csv_auto('data/raw/players_data.csv')")

frases = []

# artilheiro da temporada
top = con.execute("""
    SELECT Player, Squad, Comp, Gls, ROUND(Gls / NULLIF("90s", 0), 2) AS gols_por_90
    FROM players WHERE Gls > 0 AND "90s" >= 5
    ORDER BY Gls DESC LIMIT 1
""").fetchone()
frases.append(f"{top[0]} é o artilheiro da temporada com {top[3]} gols, média de {top[4]} por partida.")

# time mais perigoso em cartões
risco = con.execute("""
    SELECT Squad, Comp, SUM(CrdY) AS amarelos, SUM(CrdR) AS vermelhos
    FROM players GROUP BY Squad, Comp ORDER BY amarelos DESC LIMIT 1
""").fetchone()
frases.append(f"{risco[0]} ({risco[1]}) é o time com mais cartões amarelos: {risco[2]} amarelos e {risco[3]} vermelhos na temporada.")

# liga mais ofensiva
liga = con.execute("""
    SELECT Comp, ROUND(AVG(Gls), 2) AS media
    FROM players WHERE "90s" >= 5
    GROUP BY Comp ORDER BY media DESC LIMIT 1
""").fetchone()
frases.append(f"A {liga[0]} é a liga mais ofensiva com média de {liga[1]} gols por jogador na temporada.")

# jogador mais completo
completo = con.execute("""
    SELECT Player, Squad, Comp, Gls, Ast, (Gls + Ast) AS contrib
    FROM players WHERE "90s" >= 5
    ORDER BY contrib DESC LIMIT 1
""").fetchone()
frases.append(f"{completo[0]} ({completo[1]}) é o jogador mais completo com {completo[3]} gols e {completo[4]} assistências ({completo[5]} contribuições).")

# salva
with open("data/processed/frases.json", "w", encoding="utf-8") as f:
    json.dump(frases, f, ensure_ascii=False, indent=2)

print("=== FRASES GERADAS ===")
for f in frases:
    print(f"\n→ {f}")
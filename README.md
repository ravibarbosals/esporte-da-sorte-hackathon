# Assistente de Análise Esportiva — Esporte da Sorte Hackathon

Plataforma de análise esportiva que transforma dados brutos de partidas e odds em insights visuais claros, previsões de cenários e apoio à decisão para apostas esportivas.

---

## Desafio

**Desafio 1 — Assistente de Análise Esportiva**

> Desenvolver uma experiência digital que interprete dados brutos para gerar insights e previsões de cenários (gols, cartões, vencedores), transformando estatísticas complexas em apoio visual claro para o usuário.

---

## Stack

| Camada   | Tecnologia                                 |
| -------- | ------------------------------------------ |
| Frontend | Next.js 14 + React + TypeScript + Tailwind |
| Backend  | NestJS + TypeScript                        |
| Dados    | Python + DuckDB + FastAPI                  |
| Banco    | PostgreSQL                                 |
| Infra    | Docker + Docker Compose                    |
| Gráficos | Recharts                                   |

---

## Fontes de dados

- **[BetsAPI](https://betsapi.com/docs/events/)** — odds e partidas em tempo real
- **[Kaggle Football Stats 2025/2026](https://www.kaggle.com/datasets/hubertsidorowicz/football-players-stats-2025-2026)** — estatísticas de jogadores
- **[StatsBomb Open Data](https://www.kaggle.com/datasets/saurabhshahane/statsbomb-football-data/data)** — dados detalhados de eventos de partidas

---

## Estrutura do projeto

```
esporte-da-sorte-hackathon/
├── apps/
│   ├── api/          → NestJS (porta 3001)
│   ├── web/          → Next.js (porta 3000)
│   └── python/       → Análise de dados / FastAPI (porta 8000)
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

## Como rodar

### Pré-requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Node.js 20+](https://nodejs.org)
- [Python 3.11+](https://www.python.org)
- [Git](https://git-scm.com)

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/esporte-da-sorte-hackathon.git
cd esporte-da-sorte-hackathon
```

### 2. Configure as variáveis de ambiente

```bash
cp .env.example .env.local
```

Edite o `.env.local` com seus valores:

```env
DB_USER=postgres
DB_PASS=postgres
DB_NAME=esporte_da_sorte
BETSAPI_TOKEN=seu_token_aqui
```

### 3. Suba tudo com Docker

```bash
docker compose --env-file .env.local up --build
```

### 4. Acesse

| Serviço       | URL                   |
| ------------- | --------------------- |
| Frontend      | http://localhost:3000 |
| API           | http://localhost:3001 |
| Python worker | http://localhost:8000 |

---

## Rodar sem Docker (desenvolvimento)

**API (NestJS):**

```bash
cd apps/api
npm install
npm run start:dev
```

**Frontend (Next.js):**

```bash
cd apps/web
npm install
npm run dev
```

**Python:**

```bash
cd apps/python
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

---

## Endpoints principais

| Método | Endpoint           | Descrição                    |
| ------ | ------------------ | ---------------------------- |
| GET    | `/api/insights`    | Insights automáticos gerados |
| GET    | `/api/odds`        | Odds de partidas             |
| GET    | `/api/predictions` | Previsões de resultados      |
| GET    | `/api/matches`     | Histórico de partidas        |
| POST   | `/api/upload-csv`  | Upload de dataset            |

---

## Telas do dashboard

- **Overview** — KPIs principais e resumo do dia
- **Odds** — Gráfico de movimentação de odds
- **Insights** — Insights automáticos com linguagem natural
- **Previsões** — Probabilidade de resultado por partida

---

## Time

| Nome | Papel                      |
| ---- | -------------------------- |
| —    | Backend + Frontend + Infra |
| —    | Análise de dados + Python  |

---

## Evento

**Hackathon Esporte da Sorte — EdScript**
Site: [edscript.com.br](https://edscript.com.br)

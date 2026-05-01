# Trading Intelligence Dashboard

A local trading workstation for monitoring regulatory/news catalysts, running a stock screener, and viewing ticker charts.

---

## Stack

- **Frontend:** Next.js (App Router)
- **Backend:** FastAPI
- **Worker:** Python scraper/ingestion jobs
- **Cache / live feed:** Redis
- **Database:** Postgres
- **Container orchestration:** Docker Compose

---

## Features

- **Live News Feed**
  - Real-time scraping (SEC, FTC)
  - Live session mode (empty start, fills in real time)
  - History mode (last X items)
  - Session reset (“End Session”)

- **Stock Screener**
  - Filter by volume, price, % change, RVOL
  - API-driven results

- **Ticker Page**
  - Lookup any symbol
  - Lightweight chart rendering
  - Quick symbol buttons

- **UI**
  - Dark, trader-style theme
  - Fast, minimal layout
  - Focused workflow (news → screener → ticker)

---

## Run Instructions

### Prerequisites

- Docker and Docker Compose
- Node.js `>=20.9.0` for the Next.js app
- npm

### Recommended Start

Run the backend stack from the repo root:

```bash
docker compose up --build db redis api worker
```

In a second terminal, start the frontend:

```bash
cd apps/web
npm install
npm run dev
```

Then open:

- Frontend: `http://localhost:3000`
- API: `http://localhost:8000`
- API health check: `http://localhost:8000/health`

### Notes

- The frontend talks to `http://localhost:8000` by default through `NEXT_PUBLIC_API_BASE`.
- The worker fills Redis with news items and refreshes price data in the background, so the dashboard may look sparse for a moment right after startup.
- The ticker page can backfill candle data on the first lookup for a symbol.
- Update `SEC_USER_AGENT` in [docker-compose.yml](/home/jabbarweaver/Code/kareem-weaver/projects/trading_intelligence_dashboard/docker-compose.yml) before relying on SEC ingestion.

### Stop The Stack

```bash
docker compose down
```

To remove the Postgres volume too:

```bash
docker compose down -v
```

---

## Project Structure

```text
trading_intelligence_dashboard/
├── apps/
│   ├── api/                  # FastAPI backend
│   │   ├── app/              # API routes and DB layer
│   │   └── scripts/          # local data/bootstrap utilities
│   ├── web/                  # Next.js frontend
│   │   └── src/
│   │       ├── app/          # App Router pages and layout
│   │       ├── components/   # shared UI
│   │       └── lib/          # frontend API client helpers
│   └── worker/               # scrapers / background jobs
│       ├── jobs/             # ingestion tasks
│       └── pipelines/        # symbol extraction + ticker universe
├── docs/                     # architecture and demo notes
├── docker-compose.yml
└── README.md
```

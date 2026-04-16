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

## Project Structure

```text
trading_intelligence_dashboard/
├── apps/
│   ├── api/        # FastAPI backend
│   ├── web/        # Next.js frontend
│   └── worker/     # scrapers / background jobs
├── docker-compose.yml
└── README.md
# Demo Script

## Goal

Use this script for a 5-8 minute senior capstone demo of the Trading Intelligence Dashboard. The goal is to explain both the product value and the technical design in a way that shows clear software engineering decisions.

## Before You Present

1. Start the backend services:

```bash
docker compose up --build db redis api worker
```

2. Start the frontend in another terminal:

```bash
cd apps/web
npm install
npm run dev
```

3. Open these ahead of time:

- `http://localhost:3000`
- `http://localhost:8000/health`

4. Keep one terminal visible if possible so you can briefly show that the worker is running and the API is alive.

5. Have a few sample tickers ready:

- `AAPL`
- `NVDA`
- `TSLA`
- `MSFT`

## Suggested Talk Track

### 1. Opening

Say:

> Hello, my name is [Your Name], and this is my senior capstone project, the Trading Intelligence Dashboard. The goal of this system is to combine live regulatory news, stock screening, and ticker-level analysis into one interface that supports faster market research.

### 2. Problem Statement

Say:

> One problem traders and analysts face is that important information is scattered across multiple sources. News lives in one place, screening tools live in another, and chart lookup lives somewhere else. My project brings those workflows together into a single dashboard.

### 3. High-Level Architecture

Say:

> This project is built as a small full-stack system with three major parts: a Next.js frontend, a FastAPI backend, and a Python worker process. Redis is used for live news storage, and Postgres stores historical daily price data.

Then show the repo and explain:

- `apps/web` is the frontend.
- `apps/api` is the backend.
- `apps/worker` is the background data-ingestion layer.
- `docker-compose.yml` runs the multi-service environment.

### 4. Home Page

Go to the home page and say:

> This landing page acts as the entry point into the three main workflows: live news, the screener, and ticker lookup. The UI is intentionally focused and minimal so the user can move quickly between those tasks.

### 5. News Demo

Open `/news` and say:

> The news page is designed for real-time monitoring. The worker continuously pulls from sources like the FTC RSS feed and the SEC Atom feed, normalizes those items, and pushes them into Redis. The frontend polls the backend every few seconds so the feed can behave like a live tape.

Show:

- Live mode
- History mode
- Refresh/reset behavior

Say:

> This demonstrates a separation of concerns: the worker handles ingestion, Redis handles fast feed storage, the API exposes a clean route, and the frontend focuses on presentation.

### 6. Screener Demo

Open `/screener` and say:

> The screener page allows filtering by price, volume, percent change, and relative volume. Instead of hardcoding static results, the frontend sends filter values to the backend, and the FastAPI service runs SQL-based screening logic against the Postgres price table.

Try:

- A minimum RVOL like `1.5`
- A minimum volume
- A smaller result limit

Say:

> This part of the project shows database-backed querying and dynamic filtering rather than just displaying preloaded content.

### 7. Ticker Lookup Demo

Open `/ticker` and say:

> The ticker page lets the user inspect an individual symbol. If the symbol already exists in the database, the backend returns the stored candles. If not, the backend can backfill data on demand and then return chart-ready historical candles.

Type a ticker such as `AAPL` and say:

> This shows the system supporting both preloaded market data and just-in-time retrieval for symbols the user wants to inspect.

### 8. Code Structure Explanation

Now switch to the code and explain the important folders.

#### Frontend

- `apps/web/src/app`
  This contains the Next.js App Router pages such as the home page, news page, screener page, and ticker page.

- `apps/web/src/components`
  This contains shared UI pieces. Right now the main reusable component is the navigation bar.

- `apps/web/src/lib`
  This contains frontend helper logic, especially API functions that call the backend routes.

#### Backend

- `apps/api/app/main.py`
  This is the FastAPI entry point. It creates the application, enables CORS, registers the routers, and exposes the health endpoint.

- `apps/api/app/routes`
  This folder defines the backend endpoints. In FastAPI, a route definition maps an HTTP request like `GET /news` or `GET /screener` to a Python function.

- `apps/api/app/db`
  This is the database layer.
  `models.py` defines table structure.
  `session.py` creates the SQLAlchemy engine and session.
  `deps.py` provides the database dependency injected into routes.

- `apps/api/scripts`
  These are utility scripts for loading and seeding data.
  `load_prices.py` downloads and upserts price history.
  `seed_db.py` creates sample candle data for local development or fallback demos.

#### Worker

- `apps/worker/run_worker.py`
  This is the orchestration loop for background processing. It coordinates periodic price refreshes and live news ingestion.

- `apps/worker/jobs`
  This folder contains concrete background tasks.
  `ftc_rss.py` pulls FTC press releases.
  `sec_atom.py` pulls SEC filings.
  `fetch_prices.py` refreshes market price data.

- `apps/worker/pipelines`
  This folder contains reusable transformation logic.
  `ticker_universe.py` builds a stock-symbol universe from exchange files.
  `ticker_extract.py` extracts possible ticker symbols from news headlines.

### 9. End-To-End Data Flow

Say:

> The end-to-end flow is: external data sources are ingested by the worker, Redis stores fast-changing news data, Postgres stores historical pricing data, FastAPI exposes clean endpoints over that data, and the Next.js frontend renders the results for the user.

### 10. Why These Technologies

Say:

> I chose Next.js for the frontend because it gives me a modern React-based UI structure. I used FastAPI because it is lightweight and efficient for building clean API endpoints. I used Redis for fast access to live feed items, and Postgres for structured historical market data. Docker Compose ties the services together so the system can run as a reproducible local environment.

### 11. Closing

Say:

> In summary, this capstone demonstrates full-stack development, API design, background job processing, database integration, and real-time style UI behavior. It is not just a static dashboard, but a multi-service system that ingests, processes, stores, and presents market intelligence data.

## Short Version For A Faster Demo

If you only have 2-3 minutes, use this version:

1. Introduce the project as a full-stack trading intelligence dashboard.
2. Show the home page and name the three workflows.
3. Open the news page and explain worker plus Redis plus polling.
4. Open the screener and explain API plus SQL filtering.
5. Open ticker lookup and explain on-demand candle retrieval.
6. End with the directory overview: frontend, API, worker.

## Questions You May Get

### Why use both Redis and Postgres?

Use:

> Redis is a good fit for fast-changing live feed items, while Postgres is better for structured historical price data and database queries.

### Why separate the worker from the API?

Use:

> Separating them improves design clarity. The API handles requests, while the worker handles long-running ingestion and refresh tasks.

### What makes this a computer science project rather than just a website?

Use:

> The system includes backend API design, data modeling, background processing, external data ingestion, algorithmic ticker extraction, database querying, and multi-service orchestration. The website is only one layer of the full system.

### What would you improve next?

Use:

> Future work could include sentiment scoring, alerting, authentication, better symbol-to-company matching for filings, more advanced charting, and deployment to cloud infrastructure.

## Backup Plan If The Live Demo Gets Weird

1. Show the health endpoint first so you can prove the API is running.
2. If the news feed is quiet, explain that the worker ingests external sources asynchronously and switch to the screener or ticker lookup.
3. If network-based data is slow, use a seeded or previously loaded ticker and explain the architecture instead of waiting.
4. If time is short, focus on the end-to-end flow and directory explanation.

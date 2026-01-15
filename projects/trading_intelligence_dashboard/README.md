# Trading Intelligence Dashboard

## 🚀 Local Development (WSL)

> **Important:** This project must be run from the WSL Linux filesystem  
> (e.g. `~/trading_intelligence_dashboard`), **not** `/mnt/c`.

---

### 1️⃣ Start the backend (API + Database)

From the project root:

```bash
cd ~/trading_intelligence_dashboard
docker compose up


http://localhost:8000

http://localhost:8000/docs



## ✅ Project Checklist (created by Chat) — Trading Intelligence Dashboard

### 0️⃣ Project Setup & Foundations
- [x] Define capstone scope (product, not research-only)
- [x] Choose domain (trading / market intelligence)
- [x] Design high-level architecture (API + Web + DB)
- [x] Create monorepo structure
- [x] Set up GitHub repository
- [x] Move project to WSL Linux filesystem
- [x] Verify Docker + Node + Python environments
- [x] Write basic README run instructions

---

### 1️⃣ Backend (FastAPI + Postgres)
- [x] Initialize FastAPI project
- [x] Dockerize API service
- [x] Add Postgres container
- [x] Define database models (daily price candles)
- [x] Create DB session / dependency layer
- [x] Implement health check endpoint
- [x] Implement ticker candle endpoint
- [x] Seed database with dummy OHLCV data
- [x] Support multiple symbols in seed data
- [x] Verify API works via `/docs`

---

### 2️⃣ Screener Backend Logic
- [x] Create screener endpoint
- [x] Compute daily % change
- [x] Add volume filters
- [x] Add relative volume (RVOL) calculation
- [x] Add configurable lookback window
- [ ] Add gap % (open vs prev close)
- [ ] Add volatility (ATR or stdev)
- [ ] Add indicator table (RSI, EMA, etc.)
- [ ] Add sorting options (RVOL, % change)
- [ ] Add screener presets (momentum, gappers)

---

### 3️⃣ Frontend (Next.js App Router)
- [x] Initialize Next.js app
- [x] Fix routing structure (`apps/web/app`)
- [x] Create screener page route
- [x] Display screener table
- [x] Add filter inputs (volume, RVOL, limit)
- [x] Fetch data from backend API
- [x] Handle loading & error states
- [ ] Add navigation bar (Dashboard / Screener / News)
- [ ] Improve table styling (Tailwind polish)
- [ ] Highlight high-RVOL rows visually
- [ ] Add column sorting (client-side)

---

### 4️⃣ Ticker Detail Pages
- [x] Dynamic ticker route (`/ticker/[symbol]`)
- [ ] Fetch candle data for selected symbol
- [ ] Render price chart (candles or line)
- [ ] Display volume chart
- [ ] Display indicators (RSI, EMA)
- [ ] Add recent news for symbol
- [ ] Add back-navigation to screener

---

### 5️⃣ Data Ingestion & Workers
- [x] Create worker service skeleton
- [x] Add price fetch job (placeholder)
- [ ] Connect to real market data source
- [ ] Schedule periodic price updates
- [ ] Store historical prices
- [ ] Compute indicators asynchronously
- [ ] Store computed indicators in DB

---

### 6️⃣ News & Sentiment (Optional but Strong)
- [x] News route skeleton
- [ ] Integrate news scraper or API
- [ ] Tag news by ticker
- [ ] Display recent headlines per ticker
- [ ] Add basic sentiment scoring (optional)
- [ ] Highlight news-driven movers

---

### 7️⃣ Advanced / Stretch Features
- [ ] ML-based signal or prediction (baseline model)
- [ ] Backtesting simple strategies
- [ ] TradingView-style replay mode
- [ ] User watchlists
- [ ] Discord bot integration (alerts)
- [ ] Auth (read-only demo users)

---

### 8️⃣ Demo & Capstone Deliverables
- [ ] Finalize demo flow (click-by-click)
- [ ] Populate DB with realistic demo data
- [ ] Prepare demo script
- [ ] Capture screenshots / screen recording
- [ ] Write architecture explanation
- [ ] Write technical challenges section
- [ ] Write future work section
- [ ] Rehearse live demo
- [ ] Push final code to GitHub

---

### 9️⃣ Final Quality Checks
- [ ] Clean unused files/folders
- [ ] Add comments to complex logic
- [ ] Ensure README is clear and complete
- [ ] Verify project runs from scratch
- [ ] Confirm grading rubric alignment

---

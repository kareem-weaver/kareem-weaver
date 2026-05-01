# Architecture Overview

## System Summary

The Trading Intelligence Dashboard is a full-stack application built around three coordinated layers:

1. A Next.js frontend for the user interface
2. A FastAPI backend for API endpoints and database access
3. A Python worker for background data ingestion and refresh tasks

The system also uses:

- Redis for live news feed storage
- Postgres for historical price data
- Docker Compose to run the services together

## Main Runtime Components

### Frontend

Location: `apps/web`

Purpose:

- Renders the user interface
- Calls backend APIs
- Displays live news, screener results, and ticker charts

Important folders:

- `src/app`
  Route-based pages for the Next.js App Router

- `src/components`
  Reusable UI components such as the navigation bar

- `src/lib`
  Frontend-side utilities, especially API request helpers

### Backend API

Location: `apps/api`

Purpose:

- Exposes HTTP endpoints
- Reads from Redis and Postgres
- Returns data to the frontend in JSON form

Important folders:

- `app/main.py`
  FastAPI application entry point

- `app/routes`
  Route definitions for features such as news, screener, and ticker candles

- `app/db`
  Database configuration, models, and dependency helpers

- `scripts`
  Utility scripts for seeding and loading price data

### Worker

Location: `apps/worker`

Purpose:

- Pulls live external data
- Refreshes market prices
- Normalizes and stores incoming items

Important folders:

- `run_worker.py`
  Main loop for the worker process

- `jobs`
  Individual background tasks that talk to external sources or refresh data

- `pipelines`
  Reusable transformation logic such as ticker-universe loading and ticker extraction

## Data Flow

### News Flow

1. The worker reads the FTC RSS feed and the SEC Atom feed.
2. The worker normalizes each item into a consistent structure.
3. The worker stores unique news items in Redis.
4. The `/news` API route reads those items from Redis.
5. The frontend polls the API and displays the results in the live news page.

### Price Flow

1. The worker refreshes daily price history using `yfinance`.
2. Price data is stored in the `prices_daily` Postgres table.
3. The screener route queries Postgres using filter parameters.
4. The ticker route returns candle data for a specific symbol.
5. The frontend renders tables and charts from the returned JSON.

## Key Directory Definitions

### What are route definitions?

Route definitions are backend functions that respond to API requests.

Examples:

- `GET /news`
- `GET /screener`
- `GET /tickers/{symbol}/candles`

In this project, those route definitions live in `apps/api/app/routes`.

### What are jobs?

Jobs are background tasks that perform concrete units of external work, such as:

- fetching regulatory news
- fetching price data
- refreshing market records

In this project, those jobs live in `apps/worker/jobs`.

### What are pipelines?

Pipelines are reusable data-processing steps that help prepare or transform data before it is stored or used.

In this project, the pipelines:

- build the ticker universe
- extract likely stock symbols from headlines

### What is the db folder?

The `db` folder is the persistence layer of the backend. It defines:

- database models
- database sessions
- reusable dependency injection for routes

### What are scripts?

Scripts are one-off or reusable command-line utilities that support development and data preparation.

In this project, the scripts can:

- seed sample market data
- download and load historical prices

## Current API Surface

The currently active backend routes are:

- `/health`
- `/news`
- `/screener`
- `/tickers/{symbol}/candles`

There is also a `predictions.py` file in the routes folder, but it is not currently registered in `main.py`, so it is not part of the active API surface right now.

## Why This Design Works

This architecture is useful because it separates concerns clearly:

- the frontend handles presentation
- the API handles access to data
- the worker handles ingestion and background processing

That separation makes the system easier to reason about, extend, and demo as a real software engineering project rather than a single-script prototype.

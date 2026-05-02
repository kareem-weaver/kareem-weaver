# Trading Analysis Plan

## Visual Architecture Diagram

```mermaid
flowchart TD
    subgraph Frontend
        UI["Next.js Trading Dashboard UI"]
        UI -->|Upload CSV / View Reports| API
        UI -->|Request Charts / Analysis| API
    end

    subgraph Backend
        API["FastAPI Analysis Service"]
        API -->|Store / Query Data| DB
        API -->|Cache Results| Cache
        API -->|Send work| Worker
    end

    subgraph DataStorage
        DB[(Postgres)]
        Cache[(Redis)]
    end

    subgraph WorkerLayer
        Worker["Analysis Worker / Scheduler"]
        Worker -->|Fetch Market Data| MarketAPIs
        Worker -->|Run Analysis Jobs| AnalysisEngines
        Worker -->|Cache Results| Cache
    end

    subgraph Analysis
        AnalysisEngines["Metrics + Insights Engine"]
        AnalysisEngines -->|Generate charts| API
        AnalysisEngines -->|Generate reports| ReportStore
    end

    MarketAPIs["Market / Brokerage Data Sources"]
    ReportStore["Export Reports / PDF / HTML"]

    API -->|Serve Charts & Reports| UI
    DB -->|Historical trades + metrics| AnalysisEngines
    MarketAPIs -->|Reference data / benchmarks| AnalysisEngines
    Cache -->|Fast result retrieval| UI

    classDef service fill:#e8f4ff,stroke:#2b6cb0,stroke-width:1px;
    class API,Worker,AnalysisEngines service;
    classDef storage fill:#e6fffa,stroke:#2f855a,stroke-width:1px;
    class DB,Cache,ReportStore storage;
    classDef ui fill:#f7fafc,stroke:#4a5568,stroke-width:1px;
    class UI,MarketAPIs ui;
```

## Key Components

- **Frontend**: Next.js app with upload forms, chart display, and report viewer.
- **Backend**: FastAPI service for ingesting trade history, validating data, and requesting analysis.
- **Worker Layer**: Background analysis jobs and scheduled runs to compute metrics and generate visual summaries.
- **Storage**: Postgres for raw trade history and computed metrics, Redis for caching dashboards and intermediate results.
- **Analysis Engine**: Data processing, KPI calculation, strategy performance evaluation, and chart/report creation.

## Goals

- Produce a scalable, web-ready trading analysis dashboard.
- Make the system modular so you can add new analysis types without rewriting the full stack.
- Keep the frontend/backend/worker separation clear for easier deployment.

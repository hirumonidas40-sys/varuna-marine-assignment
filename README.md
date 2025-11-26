# Fuel EU Maritime Compliance - Minimal Implementation

## Overview

This repository contains a minimal but structured implementation of a Fuel EU compliance module optimized for local development and demonstration. The focus is on **domain modeling**, **hexagonal (ports & adapters) architecture**, and explicit documentation of **AI-agent usage** for generation and refactoring.

Primary features implemented (backend + frontend):

* Routes management, baseline setting
* Comparison baseline vs comparison routes
* Banking (Article 20) endpoints
* Pooling (Article 21) endpoints
* Frontend React dashboard with four tabs: Routes, Compare, Banking, Pooling

## Architecture Summary (Hexagonal)

High level layout:

```
src/
  core/
    domain/        # Entities, value objects, domain services
    application/   # Use cases / Interactors
    ports/         # Interfaces (input/output ports)
  adapters/
    ui/            # React app (frontend adapters)
    infrastructure/# DB repositories, HTTP controllers
  shared/          # Shared utilities, DTOs, transformers
```

Key rules followed:

* Business rules live in `core/application` and `core/domain` only.
* `adapters/infrastructure` implements ports defined in `core/ports`.
* UI adapters call application use cases via input ports.

## Setup & Run (dev)

### Prerequisites

* Node.js 18+
* pnpm or npm
* PostgreSQL (local or Docker)
* Optional: Docker & docker-compose

### DB (Docker compose)

```bash
# start a local Postgres for dev
docker run --name fuel-eu-postgres -e POSTGRES_PASSWORD=pass -e POSTGRES_DB=fuel_compliance -p 5432:5432 -d postgres:15
```

### Backend

```bash
cd backend
pnpm install
pnpm prisma:migrate # or npx prisma db push
pnpm dev
# server runs on http://localhost:4000
```

### Frontend

```bash
cd frontend
pnpm install
pnpm dev
# frontend runs on http://localhost:3000
```

## How to Execute Tests

* Backend unit tests (Jest + ts-jest)

```bash
cd backend
pnpm test
```

* Frontend unit + integration tests (Vitest + React Testing Library)

```bash
cd frontend
pnpm test
```

## API Endpoints (sample)

### GET /routes

Response:

```json
[
  {
    "routeId": "R001",
    "vesselType": "container",
    "fuelType": "MGO",
    "year": 2024,
    "ghgIntensity": 91.16,
    "fuelConsumptionTons": 120.5,
    "distanceKm": 2000,
    "totalEmissionsTons": 4.64
  }
]
```

### POST /routes/:routeId/baseline

Request: none
Response:

```json
{ "routeId":"R001", "baselineSet": true }
```

### GET /routes/comparison?target=89.3368

Response:

```json
{
  "target":89.3368,
  "comparison": [
    { "routeId":"R001", "baselineGhg": 91.16, "compGhg": 88.0 }
  ]
}
```

### Banking endpoints

* GET /compliance/cb?year=YYYY
* POST /banking/bank { shipId, year, amount }
* POST /banking/apply { fromShipId, toShipId, year, amount }

### Pooling endpoints

* GET /compliance/adjusted-cb?year=YYYY
* POST /pools { name, members: [{shipId, share}], year }


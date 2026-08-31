# Carpool India — Backend

Node.js/Express microservices + a Python FastAPI matching service, deployed as separate Render web services via `render.yaml`.

## Layout

```
services/booking       Node.js trips + bookings
services/matching      Python FastAPI route matching
services/payment       Razorpay platform fee + subscription plans
services/notification  Expo push + MSG91 + Gupshup + SOS
services/safety        SOS, ratings, route deviation, trust score
database/supabase      Postgres + PostGIS migrations, RLS, seeds
shared/types            Shared TypeScript contracts
shared/utils             Haversine, trust score, Zod validators
centrifugo               Real-time chat/pub-sub config
```

There is no local Postgres — this connects to Supabase Cloud (Auth, Realtime, Storage, PostGIS).

## Setup

```bash
cp .env.example .env
npm install
```

Apply SQL in order from `database/supabase/migrations`, then seeds.

## Run

```bash
docker compose up --build
```

Or individually:

```bash
npm run booking
npm run payment
npm run notification
npm run safety
cd services/matching && pip install -r requirements.txt && uvicorn main:app --port 8001
```

## Tests

```bash
npm test --workspace=@rideshare/booking
npm test --workspace=@rideshare/safety
cd services/matching && pytest
```

## Deploy

`render.yaml` at the repo root is a Render Blueprint — connect this repo in Render, it'll propose all 5 services on the free plan. Fill in the secrets it leaves blank (Supabase keys, Razorpay, Fast2SMS, Centrifugo, etc.) in the dashboard.

# RideShare India

Production-grade carpooling MVP for India. The goal is to beat BlaBlaCar India on safety (live GPS + in-app chat + SOS), payments (Razorpay UPI escrow), identity (mandatory Aadhaar + DL), and language (Hindi + Tamil from day one).

## Layout

```
mobile                        React Native + Expo SDK 51 + NativeWind
console                        Ops/admin dashboard (Vite + React)
frontend                       Marketing / passenger web site (Vite + React)
backend/services/booking       Node.js trips + bookings
backend/services/matching      Python FastAPI route matching
backend/services/payment       Razorpay platform fee + subscription plans
backend/services/notification  Expo push + MSG91 + Gupshup + SOS
backend/services/safety        SOS, ratings, route deviation, trust score
backend/database/supabase      Postgres + PostGIS migrations, RLS, seeds
backend/shared/types           Shared TypeScript contracts
backend/shared/utils           Haversine, trust score, Zod validators
backend/centrifugo             Real-time chat/pub-sub config
```

Each top-level folder (`mobile/`, `backend/`, `console/`, `frontend/`) can be deployed independently: `mobile/` via EAS/Expo, `backend/` as Docker services on any host, `console/` and `frontend/` as static Vite builds on Vercel/Netlify/etc.

There is no local Postgres. Use Supabase Cloud (Auth, Realtime, Storage, PostGIS).

## Prerequisites

- Node 20+
- Python 3.11+
- Docker (optional, for backend services)
- Expo Go or a dev build (Google Maps + background location)

## Setup

```bash
cp .env.example .env
npm install
```

Apply SQL in order from `backend/database/supabase/migrations`, then functions in `backend/database/supabase/functions`, then seeds.

Storage buckets to create in Supabase: `kyc-documents`, `profile-photos`.

## Run

Backends:

```bash
docker compose up --build
```

Or individually:

```bash
npm run booking
npm run payment
npm run notification
npm run safety
cd backend/services/matching && pip install -r requirements.txt && uvicorn main:app --port 8001
```

Mobile:

```bash
npm run mobile
```

## Tests

```bash
npm test --workspace=@rideshare/booking
npm test --workspace=@rideshare/safety
cd backend/services/matching && pytest
```

Matching includes 15 route-combination cases (direct match, 3km / 14.9km / 15.1km detours, women-only, seats, trust, price, departed/cancelled, wrong direction, Krishnagiri and Gurugram intermediate stops).

## Safety model

- Live GPS: driver broadcasts every 5s on Supabase Realtime channel `trip:{tripId}`
- In-app chat: driver + passengers on a trip, real-time via Centrifugo
- SOS: 2 second hold, SMS to 112 + emergency contacts + admin FCM
- Route deviation: Haversine vs encoded polyline, logged in `safety_events`

## Payments

The ride fare is settled directly between passenger and driver via UPI or cash — the app never touches it. The only amount the app charges via Razorpay is the platform fee (10% of the fare), unless the passenger has an active monthly plan, which waives it. Drivers need an active posting plan (local or outstation) to post a trip, and can pay a ₹150 cancellation bond per trip.

# RideShare India

Production-grade carpooling MVP for India. The goal is to beat BlaBlaCar India on safety (live GPS + in-app chat + SOS), payments (Razorpay UPI escrow), identity (mandatory Aadhaar + DL), and language (Hindi + Tamil from day one).

## Layout

```
apps/mobile          React Native + Expo SDK 51 + NativeWind
services/booking     Node.js trips + bookings
services/matching    Python FastAPI route matching
services/payment     Razorpay platform fee + subscription plans
services/notification Expo push + MSG91 + Gupshup + SOS
services/safety      SOS, ratings, route deviation, trust score
database/supabase    Postgres + PostGIS migrations, RLS, seeds
shared/types         Shared TypeScript contracts
shared/utils         Haversine, trust score, Zod validators
```

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

Apply SQL in order from `database/supabase/migrations`, then functions in `database/supabase/functions`, then seeds.

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
cd services/matching && pip install -r requirements.txt && uvicorn main:app --port 8001
```

Mobile:

```bash
npm run mobile
```

## Tests

```bash
npm test --workspace=@rideshare/booking
npm test --workspace=@rideshare/safety
cd services/matching && pytest
```

Matching includes 15 route-combination cases (direct match, 3km / 14.9km / 15.1km detours, women-only, seats, trust, price, departed/cancelled, wrong direction, Krishnagiri and Gurugram intermediate stops).

## Safety model

- Live GPS: driver broadcasts every 5s on Supabase Realtime channel `trip:{tripId}`
- In-app chat: driver + passengers on a trip, real-time via Centrifugo
- SOS: 2 second hold, SMS to 112 + emergency contacts + admin FCM
- Route deviation: Haversine vs encoded polyline, logged in `safety_events`

## Payments

The ride fare is settled directly between passenger and driver via UPI or cash — the app never touches it. The only amount the app charges via Razorpay is the platform fee (10% of the fare), unless the passenger has an active monthly plan, which waives it. Drivers need an active posting plan (local or outstation) to post a trip, and can pay a ₹150 cancellation bond per trip.

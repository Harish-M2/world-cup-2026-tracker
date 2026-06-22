# World Cup 2026 Sweepstake Tracker

A web app that tracks your sweepstake leaderboard automatically based on match results.

## Scoring Rules

- Win: 3 points
- Draw: 2 points
- Loss: 0 points

Each person has five assigned teams and receives points for every finished match involving those teams.
Only matches from 11 June 2026 onward are counted by default.
Only matches involving at least one assigned team from `data/participants.json` are included.

## Setup

1. Install dependencies:
   npm install
2. Create `.env` from `.env.example` (copy/paste file contents).
3. Add your football-data.org API key in `.env`:
   FOOTBALL_DATA_API_KEY=your_key
4. Start app:
   npm run dev

Open http://localhost:3000

## API Provider

This app uses `football-data.org` by default:

- Endpoint: `GET /v4/competitions/{COMPETITION_CODE}/matches?status=FINISHED`
- Header: `X-Auth-Token: YOUR_API_KEY`
- Date filter: `WORLD_CUP_START_DATE` (default `2026-06-11T00:00:00Z`)

If `FOOTBALL_DATA_API_KEY` is not set, the app falls back to demo results in `data/demoMatches.json`.

## Share With Friends

You can deploy this app to:

- Render (free web service)
- Railway
- Fly.io
- Any VPS or Node-compatible host

Set environment variables on the host and share the URL.

## Endpoints

- `GET /api/leaderboard` - current leaderboard, allocations, recent results
- `POST /api/refresh` - force refresh from API
- `GET /api/rules` - scoring rules

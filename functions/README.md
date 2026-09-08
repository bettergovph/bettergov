# BetterGov Cloudflare Functions

This folder contains Cloudflare Functions that run on a schedule to fetch and store data for the BetterGov application. The functions are written in TypeScript for improved type safety and developer experience.

## Functions

### 1. Weather Data (`api/weather.ts`)

Fetches weather data for major Philippine cities from OpenWeatherMap API and stores it in Cloudflare KV.

- **Schedule**: Runs hourly
- **KV Store**: `WEATHER_KV`
- **Environment Variables**: Requires `OPENWEATHERMAP_API_KEY`
- **Endpoints**:
  - `/api/weather` - Fetches from API if needed
  - `/weather` - Reads only from KV store

### 2. Currency Exchange Rates (`api/forex.ts`)

Fetches currency exchange rates from Bangko Sentral ng Pilipinas (BSP) and stores them in Cloudflare KV.

- **Schedule**: Runs hourly
- **KV Store**: `FOREX_KV`
- **Data Source**: BSP Exchange Rate API
- **Endpoints**:
  - `/api/forex` - Fetches from API if needed
  - `/forex` - Reads only from KV store

## TypeScript Setup

This project uses TypeScript for improved type safety and developer experience. The TypeScript configuration is located in `tsconfig.json` and includes:

- Target: ES2022
- Module: ES2022
- Types: @cloudflare/workers-types
- Strict type checking enabled

### Type Definitions

The `types.ts` file contains TypeScript interfaces for:

- `Env` - Environment variables and bindings for Cloudflare Workers
- Weather API response data structures
- Forex API response data structures

## Development Workflow

1. Make changes to TypeScript files in the `functions/` directory
2. Run the TypeScript compiler to build the project:

   ```
   npm run functions:build
   ```

3. Run the development server to test locally:

   ```
   npm run functions:dev
   ```

4. Deploy to Cloudflare:

   ```
   npm run functions:deploy
   ```

## Setup Instructions

1. Install Wrangler CLI (Cloudflare Workers CLI):

   ```
   npm install -g wrangler
   ```

2. Login to your Cloudflare account:

   ```
   wrangler login
   ```

3. Create KV namespaces:

   ```
   wrangler kv:namespace create WEATHER_KV
   wrangler kv:namespace create FOREX_KV
   ```

4. Update the `wrangler.toml` file with the KV namespace IDs from the previous step.

5. Add your API keys as secrets:

   ```
   wrangler secret put OPENWEATHERMAP_API_KEY
   ```

6. Install TypeScript dependencies:

   ```
   npm install --save-dev typescript @cloudflare/workers-types
   ```

7. Build and deploy the functions:

   ```
   npm run functions:build
   npm run functions:deploy
   ```

## Accessing the Data

### KV Storage

The following data is stored in Cloudflare KV with these keys:

- Weather data: `philippines_weather`
- Currency exchange rates: `bsp_exchange_rates`

You can access this data from your frontend application or other Cloudflare Workers/Functions.

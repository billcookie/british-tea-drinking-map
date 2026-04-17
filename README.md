# 🇬🇧🫖 British Tea Drinking Map

A crowdsourced interactive map for discovering and sharing the best tea drinking spots across the United Kingdom. Users can browse venues on a map, submit new locations with photos and ratings, and help build the definitive guide to British tea culture.

## Features

- Interactive map of the UK powered by Leaflet/OpenStreetMap
- Click anywhere on the map to submit a new tea spot
- Categorise venues: Cafe, Tea Room, Hotel, or Chain
- Upload photos and leave ratings and descriptions
- Rate limiting to prevent spam (5 submissions per IP per 10 minutes)
- Data persisted via [Re:earth CMS](https://reearth.io/service/cms)

## Tech Stack

- [Next.js](https://nextjs.org) 16
- [React](https://react.dev) 19 with TypeScript
- [Leaflet](https://leafletjs.com) for mapping
- [Tailwind CSS](https://tailwindcss.com) 4
- Re:earth CMS as the backend

## Getting Started

### Prerequisites

You need a Re:earth CMS project with a model configured for tea spot reports. Copy the example env file and fill in your credentials:

```bash
cp .env.example .env
```

Required environment variables (see `.env.example`):

| Variable | Description |
|---|---|
| `CMS_BASE_URL` | Re:earth CMS API base URL (default: `https://api.cms.reearth.io`) |
| `CMS_WORKSPACE_ID` | Your workspace ID |
| `CMS_PROJECT_ID` | Your project ID |
| `CMS_MODEL_ID` | The model ID for tea spot reports |
| `CMS_INTEGRATION_TOKEN` | API integration token |

### Install dependencies

```bash
npm install
```

### Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |

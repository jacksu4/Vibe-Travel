# Serendipity - The Global Detour Engine

> "The goal is NOT efficiency. The goal is to maximize 'Vibe' and discover hidden gems."

Serendipity is a high-end travel web application designed to help users discover hidden gems between Point A and Point B. It prioritizes "Vibe" over speed, offering a "Zen Futurism" interface with bilingual support (English/中文).

## Tech Stack

- **Framework:** Next.js 16 (App Router with Turbopack)
- **Styling:** Tailwind CSS v4
- **Animation:** Framer Motion
- **Map:** Mapbox GL JS (Globe projection)
- **AI:** Google Gemini API for intelligent route planning
- **Icons:** Lucide React
- **Fonts:** Geist Sans / Geist Mono
- **i18n:** React Context (no external library)

## Features

### Core Features
- **🌍 Rotating Globe:** Interactive 3D globe with auto-rotation on load
- **🎨 Premium Hero Section:** Gradient animated title with backdrop effects
- **🗺️ Intelligent Route Planning:** AI-powered waypoint suggestions via Gemini
- **🎚️ Vibe Slider:** Trade off efficiency for serendipity (0-100 scale)
- **✨ Extra Suggestions:** Hidden gems displayed as small markers near the route
- **📍 Nearby Places:** Click any waypoint to discover nearby attractions, restaurants, and activities
- **🌐 Bilingual Support:** Instant switching between English and Chinese (中文)
- **🎭 Multiple Map Themes:** Dark mode, Light mode, Satellite view

### UI/UX Highlights
- **The Void Design System:** Immersive dark mode with glassmorphism
- **Floating Island:** Sleek control panel for route planning at the bottom
- **Language Toggle:** Easy-to-access switcher in top-left corner
- **Map Controls:** Theme switcher and view reset in top-right corner
- **Gem Cards:** Beautiful waypoint popups with images and ratings
- **Nearby Recommendations:** 5-8 curated places with ratings, reviews, and distances
- **Smart Navigation:** Prev/Next buttons for main waypoints (hidden for nearby places)

## Getting Started

### Prerequisites

- Node.js 18+
- Mapbox Access Token
- Google Gemini API Key

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd Vibe-Travel
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file and add your API keys:
   ```env
   NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage Guide

### Planning a Trip

1. **Enter Locations:**
   - Start: Where you are (e.g., "Tokyo")
   - End: Where you want to go (e.g., "Osaka")

2. **Set Duration:**
   - Use +/- buttons to select trip duration (1-14 days)

3. **Adjust Vibe:**
   - Left (0-30): Efficient route with minimal stops
   - Middle (30-70): Balanced mix of speed and sights
   - Right (70-100): Scenic route with hidden gems (+2h travel time)

4. **Launch:**
   - Click "Launch" / "启动" to generate your route
   - Watch the AI planning process with animated loading text

### Exploring Waypoints

1. **View Route:**
   - Globe stops rotating and zooms to your route
   - Cyan line shows the path
   - Large circular markers show main waypoints

2. **Click Waypoint:**
   - See beautiful popup with image, description, and rating
   - "Vibe Check" section explains why this place fits your journey
   - Navigate with "Prev Stop" / "Next Stop" buttons

3. **Discover Nearby:**
   - When viewing a waypoint, nearby places appear as yellow markers (🍴 📸 🛍️)
   - 5-8 curated recommendations with ratings and distances
   - Click any nearby place to view details
   - Nearby place popups don't show Prev/Next navigation

### Switching Languages

- Click the 🌍 globe icon in the top-left corner
- All UI text updates instantly
- Supported: English (EN) ↔ Chinese (中文)

### Testing

Run the test suite:

```bash
npm test
```

## API Endpoints

### `POST /api/plan-trip`
Plans a complete trip with waypoints and extra suggestions.

**Request:**
```json
{
  "start": "San Francisco",
  "end": "Los Angeles",
  "vibe": 80,
  "days": 2
}
```

**Response:**
```json
{
  "start": { "name": "San Francisco", "coordinates": [-122.4194, 37.7749] },
  "end": { "name": "Los Angeles", "coordinates": [-118.2437, 34.0522] },
  "waypoints": [...],
  "extraSuggestions": [...],
  "route": { "type": "LineString", "coordinates": [...] }
}
```

### `POST /api/nearby`
Fetches nearby places for a specific location.

**Request:**
```json
{
  "location": "Tokyo Tower",
  "coordinates": [139.7454, 35.6586]
}
```

**Response:**
```json
{
  "nearby_places": [
    {
      "name": "Sushi Saito",
      "type": "food",
      "description": "Michelin 3-star sushi experience",
      "rating": 4.9,
      "review_count": 2500,
      "distance": 0.3,
      "coordinates": [139.7467, 35.6601],
      "image_keyword": "Sushi Saito Tokyo interior"
    }
  ]
}
```

## Project Structure

```
Vibe-Travel/
├── app/
│   ├── api/
│   │   ├── plan-trip/route.ts    # Main trip planning API
│   │   └── nearby/route.ts       # Nearby places API
│   ├── layout.tsx                # Root layout with LanguageProvider
│   ├── page.tsx                  # Homepage with hero and trip planning
│   └── globals.css               # Global styles
├── components/
│   ├── FloatingIsland.tsx        # Trip input control panel
│   ├── MapBackground.tsx         # Interactive Mapbox globe
│   ├── WaypointPopup.tsx         # Waypoint detail popup with nearby places
│   ├── PlaceAutocomplete.tsx     # Location search with Mapbox API
│   ├── LanguageToggle.tsx        # Language switcher button
│   └── GemCard.tsx               # Gem card component (future use)
├── contexts/
│   └── LanguageContext.tsx       # i18n state management
├── lib/
│   ├── i18n.ts                   # Translation dictionaries
│   └── mapbox.ts                 # Mapbox helper functions
└── package.json
```

## Environment Variables

Create a `.env.local` file with:

```env
# Required
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_mapbox_token
GEMINI_API_KEY=your_gemini_api_key

# Optional (if using custom Mapbox styles)
NEXT_PUBLIC_MAPBOX_STYLE_DARK=mapbox://styles/...
NEXT_PUBLIC_MAPBOX_STYLE_LIGHT=mapbox://styles/...
```

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT

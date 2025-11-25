# Vibe Travel 🌍✈️

An AI-powered travel planning application that optimizes for "Serendipity" vs. "Efficiency".

## 🚀 Features

- **AI Trip Planning**: Uses Google Gemini to generate personalized itineraries based on your "Vibe" (Serendipity vs. Efficiency).
- **Interactive Map**: 3D Globe view with dynamic markers for waypoints, city highlights, and route stops.
- **Smart Suggestions**:
  - **City Highlights**: 6-8 must-visit spots in start/end cities (focused on dense city centers).
  - **Route Stops**: Interesting stops *along* the driving route.
  - **Extra Gems**: Hidden gems near your path.
- **Dynamic Visualization**:
  - Markers change color based on map theme (Dark/Light/Satellite) for optimal visibility.
  - Interactive popups with details and ratings.
- **Performance**:
  - **Client-side Caching**: Instantly loads previously planned trips.
  - **Optimized API**: Parallelized geocoding and robust error handling.
- **Bilingual Support**: English and Chinese (简体中文) interface.

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS, Framer Motion
- **Map**: Mapbox GL JS, React Map GL
- **AI**: Google Gemini API (`gemini-2.5-flash`)
- **Backend**: Next.js API Routes
- **Testing**: Jest, React Testing Library

## 📦 Installation

1. **Clone the repo**:
   ```bash
   git clone https://github.com/jacksu4/Vibe-Travel.git
   cd Vibe-Travel
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set Environment Variables**:
   Create a `.env.local` file in the root directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
   ```

4. **Run Development Server**:
   ```bash
   npm run dev
   ```

5. **Open**: [http://localhost:3000](http://localhost:3000)

## 🧪 Testing

The project includes comprehensive unit and integration tests with 70%+ code coverage.

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage
```

## 🏗️ Project Structure

```
vibe-travel/
├── app/
│   ├── api/              # API routes
│   │   ├── plan-trip/    # Trip planning endpoint
│   │   ├── nearby/       # Nearby places search
│   │   └── place-photos/ # Place photos retrieval
│   ├── layout.tsx        # Root layout with providers
│   └── page.tsx          # Main page component
├── components/
│   ├── FloatingIsland.tsx   # Trip input form
│   ├── MapBackground.tsx    # Interactive map
│   ├── TripJournal.tsx      # Itinerary display
│   └── LanguageToggle.tsx   # Language switcher
├── contexts/
│   └── LanguageContext.tsx  # i18n context
├── lib/
│   ├── mapbox.ts        # Mapbox geocoding & routing
│   ├── cache.ts         # In-memory caching
│   └── firebase.ts      # Firebase config (optional)
├── __tests__/           # Test files
└── public/              # Static assets
```

## 🔧 Key Technical Details

### Gemini Model Configuration
- **Model**: `gemini-2.5-flash` (optimized for v1beta API)
- **JSON Parsing**: Robust extraction that handles Markdown code blocks and malformed responses

### Caching Strategy
- **Client-side**: `localStorage` for instant repeated searches
- **Server-side**: In-memory cache with deterministic keys

### Map Markers
- Dynamic styling based on theme (black on light, white on dark)
- Category-based icons (🍴 food, 📸 sight, 🛍️ shop, 🎯 activity)
- Interactive popups with ratings and descriptions

## 📝 Recent Fixes

### Critical Bug Fixes (Nov 2025)
1. **Gemini API 404 Error**: Updated model from deprecated versions to `gemini-2.5-flash` for v1beta API compatibility
2. **JSON Parsing Issues**: Fixed regex that was stripping URLs containing `//`, added Markdown code block handling
3. **Test Mocking**: Comprehensive mocks for Firebase, Framer Motion, Mapbox, and Next.js navigation

## 🤝 Contributing

Contributions are welcome! Please ensure:
- All tests pass (`npm test`)
- Code coverage remains above 70%
- TypeScript types are properly defined

## 📄 License

MIT License

## 👨‍💻 Author

Created by [jacksu4](https://github.com/jacksu4)

# 🌿 GardenAI

**AI-powered garden companion that makes plant care intuitive, personal, and delightful.**

[![Built with Lovable](https://img.shields.io/badge/Built%20with-Lovable-green)](https://lovable.dev)

<a href="https://garden-ai.lovable.app/dashboard">
  <img src="https://cdn.vectorstock.com/i/750p/67/65/try-it-rounded-modern-black-ui-element-vector-62516765.avif" alt="Try it" width="160" />
</a>

---

## 🌱 Overview

The GardenAI is a mobile-first web application that helps home gardeners of all experience levels care for their plants with confidence. It combines real-time weather data, AI-powered plant identification, and personalized maintenance schedules to reduce the guesswork in gardening.

## 🎯 Problem Statement

Over 77% of U.S. households engage in gardening, yet beginners often struggle with inconsistent care, pest identification, and seasonal planning. Existing tools are either too complex for casual gardeners or too simplistic for those wanting to grow. The Empathetic Gardener bridges this gap with an empathetic, intelligent approach to plant care.

## ✨ Key Features (MVP)

| Feature | Description |
|---|---|
| **🔐 Authentication** | Email-based signup & login with secure session management |
| **👤 Profile Setup** | Zip code, experience level, and personalized onboarding |
| **🌦️ Weather Integration** | Real-time conditions via Open-Meteo API with smart watering recommendations |
| **📸 AI Plant Scanner** | Photograph any plant to get instant identification, care tips, and growing info |
| **🌻 Plant Inventory** | Track your garden plants with health scores, locations, and care schedules |
| **📋 Task Management** | Personalized daily tasks for watering, pruning, and maintenance |
| **📊 Garden Dashboard** | At-a-glance stats, weather, tasks, and plant health overview |

## 👥 Target Personas

- **Sarah** — Aspiring Home Gardener (25-35, beginner, wants structured guidance)
- **Miguel** — Weekend Warrior (35-50, intermediate, time-constrained)
- **Grace** — Senior Green Thumb (60+, experienced, needs accessibility)

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Tailwind CSS, Framer Motion |
| **UI Components** | shadcn/ui (Radix primitives) |
| **Backend** | Lovable Cloud — Auth, Database, Edge Functions, Storage |
| **AI** | Lovable AI Gateway (Google Gemini 3 Flash) for plant identification |
| **Weather** | Open-Meteo API (free, no API key required) |
| **Routing** | React Router v6 |
| **State** | TanStack React Query |

## 📁 Project Structure

```
├── docs/                    # Product documentation & PRD
│   ├── Garden_App.pdf       # Full PRD, personas, and roadmap
│   └── README.md            # Documentation summary
├── src/
│   ├── components/          # React components
│   │   ├── AddPlantDialog   # Add plants from catalog
│   │   ├── PlantScannerDialog # AI plant identification
│   │   ├── ProfileSetup     # User onboarding
│   │   ├── ProtectedRoute   # Auth guard
│   │   ├── WeatherCard      # Weather + watering recommendations
│   │   └── ui/              # shadcn/ui design system
│   ├── hooks/               # Custom hooks (useAuth)
│   ├── integrations/        # Backend client & types
│   └── pages/               # Route pages
│       ├── Index            # Landing page
│       ├── Auth             # Login / Signup
│       └── Dashboard        # Main app experience
├── supabase/
│   ├── functions/           # Edge functions
│   │   ├── get-weather/     # Weather data + watering logic
│   │   └── identify-plant/  # AI plant identification
│   └── migrations/          # Database schema
└── tailwind.config.ts       # Garden-themed design tokens
```

## 🎨 Design System

The app uses a custom **garden-inspired** design system:

- **Typography**: Fraunces (serif headings) + DM Sans (body)
- **Palette**: Earthy greens, warm accents, sky blues
- **Tokens**: `--garden-leaf`, `--garden-earth`, `--garden-sun`, `--garden-sky`, `--garden-bloom`

## 🚀 Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. Open [http://localhost:5173](http://localhost:5173)

> **Note**: Backend services (auth, database, AI, weather) are powered by Lovable Cloud and work automatically.

## 🗺️ Roadmap

- [ ] Succession planting calendar
- [ ] Community Q&A forum
- [ ] Pest & disease diagnosis via AI
- [ ] Garden journal with photo timeline
- [ ] Push notifications for care reminders
- [ ] Marketplace for local nurseries

## 📄 Documentation

See [`docs/`](./docs/) for the full PRD, market research, user personas, and jobs-to-be-done analysis.

## 📝 License

Private project — all rights reserved.

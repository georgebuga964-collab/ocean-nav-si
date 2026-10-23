# Ocean Nav SI

Maritime navigation and chart plotting system built with React, Leaflet, and Supabase.

## Repository Structure

- **`ocean-nav-si/`**: Client-facing navigation and map application (React + Vite + Leaflet + Tailwind CSS).
- **`ocean-nav-admin/`**: Admin portal for managing routes, points of interest, and chart data.
- **`supabase/`**: Database schema migrations and configuration.

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm

### Installation & Development

#### 1. Ocean Nav SI (Client App)
```bash
cd ocean-nav-si
npm install
cp .env.example .env.local  # configure your Supabase credentials
npm run dev
```

#### 2. Ocean Nav Admin (Admin Dashboard)
```bash
cd ocean-nav-admin
npm install
cp .env.example .env.local  # configure your Supabase credentials
npm run dev
```

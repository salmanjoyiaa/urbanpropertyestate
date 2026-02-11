# UrbanEstate — Premium Rental Marketplace

A production-ready **Next.js 14** (App Router) + **Supabase** real estate rental marketplace connecting property agents with customers via WhatsApp booking.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6)

## Features

- **🏠 Property Listings** — Browsable grid with search, city/type/beds filters, and skeleton loading
- **📸 Photo Galleries** — Swipeable image gallery with thumbnails, navigation, and cover photo selection
- **💬 WhatsApp Booking** — One-tap "Book on WhatsApp" button with pre-filled agent message
- **🔐 Agent Dashboard** — Create/edit listings, upload/reorder photos, block availability dates
- **🛡️ Row Level Security** — All data secured at the database layer via RLS policies
- **📱 Mobile-First** — Responsive design with sticky CTAs, bottom navigation, and touch-optimized UI
- **🔑 Authentication** — Email/password + magic link via Supabase Auth with cookie-based SSR

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Database | Supabase (PostgreSQL) |
| Auth | @supabase/ssr (cookie-based SSR) |
| Styling | Tailwind CSS + shadcn/ui |
| Language | TypeScript |
| Hosting | Vercel |

## Quick Start

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd UrbanRealEstate
npm install
```

### 2. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Copy your **Project URL** and **anon public key** from Settings → API

### 3. Set Environment Variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run Database Migrations

Open the Supabase **SQL Editor** and run these files in order:

1. `supabase/migration.sql` — Creates tables, indexes, triggers, and RLS policies
2. `supabase/storage.sql` — Creates the photo storage bucket with upload policies
3. `supabase/seed.sql` — *(Optional)* Inserts sample data

> **Note:** For the seed script, you must first create test users in Authentication → Users, then replace the placeholder UUIDs.

### 5. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/
│   ├── page.tsx                          # Home page
│   ├── login/page.tsx                    # Authentication
│   ├── properties/page.tsx               # Property listings
│   ├── properties/[id]/page.tsx          # Property detail
│   ├── agents/[id]/page.tsx              # Agent profile
│   ├── dashboard/
│   │   ├── page.tsx                      # Dashboard home
│   │   └── properties/
│   │       ├── new/page.tsx              # Create listing
│   │       └── [id]/edit/page.tsx        # Edit listing
│   └── auth/
│       ├── callback/route.ts             # Auth callback
│       └── signout/route.ts              # Sign out
├── components/
│   ├── ui/                               # shadcn/ui base components
│   ├── navbar.tsx                        # Responsive navigation
│   ├── footer.tsx                        # Site footer
│   ├── property-card.tsx                 # Property card component
│   ├── property-gallery.tsx              # Image gallery
│   ├── property-form.tsx                 # Create/edit form
│   ├── filter-bar.tsx                    # Search & filters
│   ├── whatsapp-button.tsx               # WhatsApp CTA
│   ├── availability-calendar.tsx         # Date availability
│   └── skeleton-card.tsx                 # Loading placeholder
├── lib/
│   ├── supabase/
│   │   ├── client.ts                     # Browser client
│   │   ├── server.ts                     # Server client
│   │   └── middleware.ts                 # Session refresh
│   ├── types.ts                          # TypeScript interfaces
│   └── utils.ts                          # Helpers
└── middleware.ts                          # Auth middleware
```

## Database Schema

| Table | Description |
|---|---|
| `profiles` | Agent profiles (extends auth.users) |
| `properties` | Property listings with all details |
| `property_photos` | Photo URLs with position and cover flag |
| `property_blocks` | Unavailable date ranges |

### RLS Policies Summary

- **Anonymous users**: Can read published properties and public agent profiles
- **Authenticated agents**: Full CRUD on their own properties, photos, and blocks
- **Storage**: Uploaded files scoped to `properties/<agent_id>/<property_id>/`

## Deploy to Vercel

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

### Manual Deploy

```bash
npm install -g vercel
vercel
```

### Required Environment Variables

Set these in Vercel → Project Settings → Environment Variables:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key |

> **Important:** Never commit `.env.local` to version control. The `.gitignore` already excludes it.

## WhatsApp Integration

Each property detail page includes a "Book on WhatsApp" button that opens:

```
https://wa.me/{AGENT_WHATSAPP_NUMBER}?text={ENCODED_MESSAGE}
```

Pre-filled message format:
```
Hi {AgentName}, I'm interested in {PropertyTitle}. Link: {PropertyURL}
```

Agent WhatsApp numbers must be in E.164 format without symbols (e.g., `923001234567`).

## License

MIT

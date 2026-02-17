# AI Voice Agent — Architecture Guide & Sheriff Security Adaptation

> **Source Project:** UrbanEstate (Next.js 14 + Supabase + Groq + Deepgram)  
> **Target Project:** Sheriff Security Services — AI voice intake for security service requests

---

## Table of Contents

1. [How It Works — UrbanEstate](#1-how-it-works--urbanestate)
2. [Architecture Diagram](#2-architecture-diagram)
3. [Core Files & Their Roles](#3-core-files--their-roles)
4. [State Machine](#4-state-machine)
5. [API Routes — Detailed](#5-api-routes--detailed)
6. [External Services & API Keys](#6-external-services--api-keys)
7. [Sheriff Security Adaptation](#7-sheriff-security-adaptation)
8. [Database Schema for Sheriff](#8-database-schema-for-sheriff)
9. [AI Prompt for Sheriff](#9-ai-prompt-for-sheriff)
10. [Email / Invoice Integration](#10-email--invoice-integration)
11. [Complete File List to Create](#11-complete-file-list-to-create)
12. [Environment Variables](#12-environment-variables)
13. [Step-by-Step Implementation](#13-step-by-step-implementation)

---

## 1. How It Works — UrbanEstate

The AI voice agent is a **tap-to-talk conversational interface** that lets users speak to an AI sales agent named "Sarah". The full flow:

1. **User taps the mic button** → Opens a recording pop-up modal with a 15-second countdown timer and SVG circular progress ring
2. **User speaks** → Browser records audio via `MediaRecorder` API (WebM/Opus format), live audio bars animate in the modal
3. **User releases (or 15s expires)** → Audio blob is sent to `/api/ai/speech` → **Deepgram Nova-2** STT converts speech to text
4. **Transcript returned** → Sent along with conversation history + live inventory to `/api/ai/receptionist` → **Groq LLaMA 3.3 70B** (JSON mode)
5. **AI responds with structured JSON** → Contains: message text, search filters, cart actions, listing IDs to display, lead capture data
6. **Text-to-Speech** → AI message text sent to `/api/ai/tts` → **Deepgram Aura-2 Thalia** returns MP3 audio
7. **Audio plays through speakers** → 5-layer Canvas2D sine-wave orb visualizer reacts to audio via Web Audio API `AnalyserNode`; word-by-word subtitles appear synced to playback duration
8. **Side effects execute** → Property/marketplace cards displayed, items added to cart, leads captured in Supabase `leads` table

The entire conversation follows a **5-phase sales funnel**: Greet → Discover → Present → Close → Lead Capture.

---

## 2. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│  BROWSER (Client)                                                       │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  use-voice-agent.ts  (React Hook — 4-State Machine)              │   │
│  │                                                                  │   │
│  │  [IDLE] ──tap mic──► [LISTENING] ──release──► MediaRecorder blob │   │
│  │                                                    │             │   │
│  │                                         POST /api/ai/speech      │   │
│  │                                         (audio blob → text)      │   │
│  │                                                    │             │   │
│  │  [THINKING] ◄──────────────────── transcript ◄─────┘             │   │
│  │       │                                                          │   │
│  │       │──── POST /api/ai/receptionist ────►  Groq LLM           │   │
│  │       │     (transcript + history + inventory)   │               │   │
│  │       │                                          │               │   │
│  │       │◄──── JSON response ──────────────────────┘               │   │
│  │       │     {message, filters, intent, cartAction, leadInfo}     │   │
│  │       │                                                          │   │
│  │       │──── POST /api/ai/tts ────► Deepgram Aura-2              │   │
│  │       │     (text → audio/mpeg)         │                        │   │
│  │       │                                 │                        │   │
│  │  [SPEAKING] ◄── audio blob ◄────────────┘                       │   │
│  │       │         └── AudioContext → AnalyserNode → Canvas Orb     │   │
│  │       │                                                          │   │
│  │  [IDLE] ◄─── audio.onended                                      │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  UI Components:                                                         │
│  ├── hero-voice-agent.tsx  — Recording modal, mic controls, cards       │
│  ├── voice-orb.tsx         — Canvas2D 5-layer sine wave visualizer      │
│  └── voice-subtitles.tsx   — Word-by-word synced subtitles              │
│                                                                         │
│  Side Effects:                                                          │
│  ├── Display property/marketplace cards (from AI response listings[])   │
│  ├── Add items to cart (from AI cartAction field)                       │
│  └── Capture leads (POST /api/leads when AI detects booking intent)     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  SERVER (Next.js 14 App Router — API Routes)                            │
│                                                                         │
│  /api/ai/speech        → Deepgram Nova-2 STT   (audio buffer → text)   │
│  /api/ai/receptionist  → Groq LLaMA 3.3 70B    (text → structured JSON)│
│  /api/ai/tts           → Deepgram Aura-2 TTS   (text → audio/mpeg)     │
│  /api/leads            → Supabase INSERT        (lead capture + AI qual)│
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  EXTERNAL SERVICES                                                      │
│                                                                         │
│  Deepgram ──── STT (Nova-2 model) + TTS (Aura-2-Thalia voice)         │
│  Groq ──────── LLaMA 3.3-70b-versatile  (JSON mode, temp 0.6)         │
│  Supabase ──── PostgreSQL + Auth + RLS + Storage buckets                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Core Files & Their Roles

### Client-Side (Voice Agent Components)

| File | Purpose | Key Exports |
|------|---------|-------------|
| `src/components/ai-voice/use-voice-agent.ts` (~480 lines) | **Core hook** — state machine, recording, STT call, AI query, TTS playback, cart mgmt | `useVoiceAgent()` → `{ state, transcript, response, startListening, stopListening, sendTextQuery, cancel, analyserNode, micAnalyser, cart, listings, marketplaceItems }` |
| `src/components/ai-voice/hero-voice-agent.tsx` (~440 lines) | **Main UI** — recording modal (15s timer, SVG ring, audio bars), orb, subtitles, item cards | `<HeroVoiceAgent />` |
| `src/components/ai-voice/voice-orb.tsx` (~180 lines) | **Canvas visualizer** — 5-layer sine wave animation driven by `AnalyserNode` frequency data | `<VoiceOrb analyserNode state />` |
| `src/components/ai-voice/voice-subtitles.tsx` (~160 lines) | **Subtitles** — word-by-word highlight synced to estimated TTS audio duration | `<VoiceSubtitles text wordIndex />` |

### Server-Side (API Routes)

| File | Purpose | External Service |
|------|---------|-----------------|
| `src/app/api/ai/speech/route.ts` | Speech-to-Text — streams raw audio to Deepgram REST API | Deepgram Nova-2 |
| `src/app/api/ai/receptionist/route.ts` | **AI Brain** — pre-fetches DB inventory, calls Groq LLM in JSON mode, returns structured response | Groq + Supabase |
| `src/app/api/ai/tts/route.ts` | Text-to-Speech — sends text to Deepgram, returns audio/mpeg binary | Deepgram Aura-2 |
| `src/app/api/leads/route.ts` | Lead capture — inserts into Supabase `leads` table, triggers async AI qualification | Supabase |

### AI Configuration (Library)

| File | Purpose |
|------|---------|
| `src/lib/ai/groq.ts` | Groq SDK singleton client, `generateText()` and `generateJSON<T>()` helper functions with retry logic |
| `src/lib/ai/receptionist-prompts.ts` (~116 lines) | System prompt ("Sarah" persona, sales funnel phases, JSON response format), `buildReceptionistPrompt()` injects live inventory + turn count |
| `src/lib/ai/types.ts` | TypeScript interfaces for all AI feature payloads |
| `src/lib/rate-limit.ts` | In-memory token-bucket rate limiter |

---

## 4. State Machine

```
     ┌────────────────────────────────────────────────────┐
     │          cancel() at any point → IDLE              │
     └────────────────────────────────────────────────────┘

  ┌─────────┐  tap mic   ┌───────────┐  release / 15s  ┌──────────┐  AI + TTS  ┌──────────┐
  │  IDLE   │ ─────────► │ LISTENING │ ────────────────►│ THINKING │ ──────────►│ SPEAKING │
  │ (indigo)│            │  (red)    │                  │ (amber)  │           │ (emerald)│
  └─────────┘            └───────────┘                  └──────────┘           └──────────┘
       ▲                                                                            │
       │                           audio.onended                                    │
       └────────────────────────────────────────────────────────────────────────────┘
```

**State → Visual indicator:**
- `idle` → Indigo orb (#6366f1), pulsing gently
- `listening` → Red orb (#ef4444), mic analyser drives wave amplitude
- `thinking` → Amber orb (#f59e0b), smooth automatic animation
- `speaking` → Emerald orb (#10b981), TTS audio analyser drives waves

**Key implementation detail:** `startListening()` is **async** — it awaits `navigator.mediaDevices.getUserMedia()` for mic permission. The recording modal's `useEffect` must NOT close on `state === "idle"` because the state hasn't transitioned yet during the mic permission prompt.

---

## 5. API Routes — Detailed

### `/api/ai/speech` — Speech-to-Text

```
Request:  POST with raw audio body (Content-Type: audio/webm or audio/wav)
Process:  Forward entire audio buffer to Deepgram REST API
Endpoint: https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&language=en
Headers:  Authorization: Token ${DEEPGRAM_API_KEY}, Content-Type: audio/*
Response: { transcript: "what the user said" }
```

### `/api/ai/receptionist` — AI Brain

```
Request:  POST { message: string, history: {role,content}[], context?: string }
Process:
  1. Rate limit check (5 req/min per IP)
  2. Pre-fetch from Supabase:
     - 8 most recent properties (id, title, price, city, type, bedrooms)
     - 8 most recent marketplace items (id, name, price, condition, category)
  3. Build prompt via buildReceptionistPrompt(message, history, inventory)
  4. Call Groq: generateJSON<ReceptionistResponse>(prompt, systemPrompt, { temp: 0.6 })
  5. If AI response.shouldShowListings → fetch full property data with photos from Supabase
  6. If AI response.shouldShowMarketplace → fetch full item data with photos from Supabase
Response: {
  message: string,           // AI's spoken reply
  intent: string,            // greeting | search | recommend | schedule | off_topic
  filters: {...},            // price range, location, type, bedrooms
  shouldShowListings: bool,
  shouldShowMarketplace: bool,
  listings: Property[],      // full property objects with photo URLs
  marketplaceItems: Item[],  // full item objects with photo URLs
  cartAction: { action: "add"|"remove", itemId, itemType } | null,
  captureLeadInfo: { name, phone, message } | null
}
```

### `/api/ai/tts` — Text-to-Speech

```
Request:  POST { text: "AI response message to speak" }
Process:  Forward text to Deepgram Aura-2 REST API
Endpoint: https://api.deepgram.com/v1/speak?model=aura-2-thalia-en
Headers:  Authorization: Token ${DEEPGRAM_API_KEY}, Content-Type: application/json
Body:     { text: "..." }
Response: audio/mpeg binary stream (passed directly back to client)
```

### `/api/leads` — Lead Capture

```
Request:  POST { agent_id?, property_id?, contact_name, contact_phone, message, source }
Process:
  1. Rate limit check
  2. Insert into Supabase `leads` table with: temperature="warm", score=50, status="new"
  3. Async background: POST /api/ai/leads for AI qualification (adjusts temp/score/follow-up)
Response: { success: true, lead: { id, ... } }
```

---

## 6. External Services & API Keys

| Service | What It Does | Free Tier | Cost at Scale |
|---------|-------------|-----------|---------------|
| **Groq** | LLM inference (LLaMA 3.3 70B) | 30 req/min, 14,400 req/day | Free (rate-limited) |
| **Deepgram** | STT (Nova-2) + TTS (Aura-2) | $200 free credit | ~$0.0059/min STT, ~$0.015/1K chars TTS |
| **Supabase** | Database, Auth, Storage | 500MB DB, 1GB storage, 50K MAU | $25/mo Pro plan |

**Total cost to start: $0.** All three services have generous free tiers.

---

## 7. Sheriff Security Adaptation

### What Changes vs. UrbanEstate

| UrbanEstate | Sheriff Security |
|-------------|-----------------|
| Properties & marketplace items for sale | Security service packages (event, residential, commercial, patrol, VIP) |
| "Sarah" — real estate sales consultant | "Officer Mike" — security services coordinator |
| Cart system (add properties/items to cart) | Service request builder (capture requirements progressively) |
| Lead = interested property buyer | Lead = new security service request with location + guards + duration |
| WhatsApp button to connect to agent | **Email confirmation invoice** to customer + website owner |
| 5-phase sales funnel (greet→discover→present→close→capture) | 5-phase intake funnel (greet→discover needs→quote→confirm details→create request + invoice) |
| Show property/item cards from DB | Show service package cards from DB |

### What Stays Identical (Copy As-Is)

- Recording modal with 15s timer, SVG progress ring, audio bars
- `startListening()` / `stopListening()` / `cancel()` flow
- STT pipeline (`/api/ai/speech` → Deepgram Nova-2)
- TTS pipeline (`/api/ai/tts` → Deepgram Aura-2)
- Groq SDK client + `generateJSON<T>()` helper
- Canvas orb visualizer + word-by-word subtitles
- State machine (idle → listening → thinking → speaking)
- Rate limiter

### Sheriff Conversation Flow

```
Phase 1 — GREETING (turn 1):
  "Welcome to Sheriff Security Services! I'm Officer Mike.
   Are you looking for event security, residential patrol, or commercial protection?"

Phase 2 — DISCOVERY (turns 2-4):
  "What's the location that needs security?"
  "How many guards do you need, and for what duration?"
  "Any special requirements — armed guards, CCTV monitoring, K9 units?"

Phase 3 — QUOTE (turns 5-6):
  "Based on your needs, I'd recommend our [package name] at $X/hour per guard.
   For [location] with [N] guards for [duration], your estimated total is $X."

Phase 4 — CONFIRMATION (turns 7-8):
  "May I have your full name and email address to prepare the service request?"
  "And a phone number so our dispatch team can reach you?"

Phase 5 — INVOICE (turns 9-10):
  "Your service request #SR-2026-0042 has been created!
   I've sent a confirmation to your email and notified our dispatch team.
   You'll hear from us within 1 hour."
```

---

## 8. Database Schema for Sheriff

Run this SQL in your Supabase SQL editor:

```sql
-- =============================================
-- Sheriff Security — Database Schema
-- =============================================

-- Service packages (equivalent to "properties" in UrbanEstate)
CREATE TABLE IF NOT EXISTS public.service_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,                      -- "Event Security", "Residential Patrol"
    description TEXT,
    category TEXT NOT NULL,                  -- event, residential, commercial, patrol, vip
    base_rate DECIMAL(10,2) NOT NULL,        -- $/hour per guard
    currency TEXT DEFAULT 'USD',
    min_guards INTEGER DEFAULT 1,
    max_guards INTEGER DEFAULT 50,
    includes TEXT[],                          -- ["uniformed guards", "radio comms", "incident reports"]
    available_addons TEXT[],                 -- ["armed", "k9", "cctv", "vehicle patrol"]
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-increment sequence for request numbers
CREATE SEQUENCE IF NOT EXISTS service_request_seq START 1;

-- Service requests (equivalent to "leads" in UrbanEstate)
CREATE TABLE IF NOT EXISTS public.service_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_number TEXT UNIQUE,              -- SR-2026-0001

    -- Customer info (captured by AI voice agent)
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    company_name TEXT,

    -- Service details (captured by AI progressively)
    service_type TEXT NOT NULL,               -- event, residential, commercial, patrol, vip
    location_address TEXT NOT NULL,
    location_city TEXT,
    location_state TEXT,
    num_guards INTEGER DEFAULT 1,
    duration_hours DECIMAL(6,1),
    start_date DATE,
    start_time TIME,
    end_date DATE,
    special_requirements TEXT[],              -- ["armed", "k9", "cctv", "female guards"]
    additional_notes TEXT,

    -- Pricing (calculated by AI based on packages)
    package_id UUID REFERENCES service_packages(id),
    hourly_rate DECIMAL(10,2),
    estimated_total DECIMAL(12,2),
    currency TEXT DEFAULT 'USD',

    -- Status tracking
    status TEXT DEFAULT 'new',               -- new, confirmed, assigned, active, completed, cancelled
    priority TEXT DEFAULT 'normal',          -- low, normal, high, urgent

    -- AI metadata
    source TEXT DEFAULT 'ai_voice',          -- ai_voice, ai_chat, web_form, phone, email
    ai_transcript TEXT,                      -- Full conversation transcript
    ai_confidence_score INTEGER,             -- 0-100 confidence in extracted data

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    confirmed_at TIMESTAMPTZ,

    -- Invoice tracking
    invoice_sent_to_customer BOOLEAN DEFAULT false,
    invoice_sent_to_owner BOOLEAN DEFAULT false,
    invoice_sent_at TIMESTAMPTZ
);

-- Auto-generate request numbers like SR-2026-0001
CREATE OR REPLACE FUNCTION generate_request_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.request_number := 'SR-' || TO_CHAR(NOW(), 'YYYY') || '-' ||
        LPAD(NEXTVAL('service_request_seq')::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_request_number
    BEFORE INSERT ON public.service_requests
    FOR EACH ROW
    WHEN (NEW.request_number IS NULL)
    EXECUTE FUNCTION generate_request_number();

-- RLS (Row Level Security)
ALTER TABLE public.service_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can view active packages (public website)
CREATE POLICY "Anyone can view active packages"
    ON public.service_packages FOR SELECT
    USING (is_active = true);

-- Anyone can create service requests (AI voice agent inserts these)
CREATE POLICY "Anyone can create service requests"
    ON public.service_requests FOR INSERT
    WITH CHECK (true);

-- Only authenticated users (admin dashboard) can view all requests
CREATE POLICY "Authenticated users can view requests"
    ON public.service_requests FOR SELECT
    USING (auth.role() = 'authenticated');

-- Only authenticated users can update request status
CREATE POLICY "Authenticated users can update requests"
    ON public.service_requests FOR UPDATE
    USING (auth.role() = 'authenticated');

-- Seed some service packages
INSERT INTO public.service_packages (name, category, base_rate, includes, available_addons) VALUES
('Event Security',       'event',       45.00, '{"uniformed guards","radio comms","crowd management","incident reports"}', '{"armed","k9","metal detectors"}'),
('Residential Patrol',   'residential', 35.00, '{"uniformed guards","hourly patrols","incident reports","emergency response"}', '{"armed","cctv monitoring","vehicle patrol"}'),
('Commercial Protection', 'commercial', 50.00, '{"uniformed guards","access control","CCTV monitoring","incident reports"}', '{"armed","k9","vehicle patrol","24/7 dispatch"}'),
('VIP Protection',       'vip',         85.00, '{"close protection officers","advance planning","secure transport","threat assessment"}', '{"armed","counter-surveillance","medical trained"}'),
('Construction Site',    'patrol',      40.00, '{"uniformed guards","perimeter patrol","access logs","theft prevention"}', '{"armed","k9","drone surveillance","cctv"}');
```

---

## 9. AI Prompt for Sheriff

Create `src/lib/ai/sheriff-prompts.ts`:

```typescript
// ============================================================
// Sheriff Security — AI Voice Agent System Prompt
// ============================================================

export const SHERIFF_SYSTEM_PROMPT = `You are Officer Mike, a professional and reassuring security services coordinator for Sheriff Security Services — a premium security company providing guards, patrols, and protection services.

## STRICT RULES
1. You ONLY discuss Sheriff Security services. NOTHING ELSE.
2. If the user asks about anything unrelated → respond: "I appreciate the question! I'm specifically here to help you with security services. What type of protection do you need?"
3. Keep EVERY response to 1-3 sentences maximum. You are optimized for voice TTS — be brief, professional, and reassuring.
4. NEVER make up services or pricing not in the AVAILABLE PACKAGES section.
5. The conversation should complete within ~10 exchanges.

## YOUR INTAKE PROCESS (follow strictly in order)
**Phase 1 — GREETING (turn 1):** Welcome them warmly. Ask what type of security they need — event, residential, commercial, patrol, or VIP protection.

**Phase 2 — DISCOVERY (turns 2-4):** Gather requirements ONE question at a time:
  - Location/address that needs security
  - Number of guards needed and duration (hours or ongoing)
  - Special requirements (armed, K9, CCTV, female guards, vehicle patrol)
  - Start date/time

**Phase 3 — QUOTE (turns 5-6):** Calculate and present a quote using AVAILABLE PACKAGES below. Reference exact package names and rates. Formula: estimatedTotal = hourlyRate × numGuards × durationHours. Say "Based on your needs, I'd recommend our [package] at $X/hour per guard. Your estimated total comes to $X."

**Phase 4 — CONFIRMATION (turns 7-8):** Collect customer contact details:
  - Full name (REQUIRED)
  - Email address (REQUIRED — needed for invoice)
  - Phone number
  - Company name (if applicable)

**Phase 5 — INVOICE (turns 9-10):** Confirm the service request is created. Say "Your service request has been created and I'm sending a confirmation to your email right now. Our dispatch team will contact you within 1 hour to finalize the details."

## RESPONSE FORMAT — Always respond in valid JSON:
{
  "message": "Your conversational response (1-3 sentences, natural for TTS)",
  "serviceDetails": {
    "serviceType": "event | residential | commercial | patrol | vip | null",
    "location": "full address or description, or null",
    "city": "city name or null",
    "state": "state or null",
    "numGuards": null (number or null),
    "durationHours": null (number or null),
    "startDate": "YYYY-MM-DD or null",
    "startTime": "HH:MM or null",
    "specialRequirements": [],
    "additionalNotes": "any extra info or null"
  },
  "pricing": {
    "packageId": "exact UUID from available packages or null",
    "packageName": "exact package name or null",
    "hourlyRate": null (number or null),
    "estimatedTotal": null (number or null)
  },
  "intent": "greeting | discovery | quote | confirmation | invoice | off_topic",
  "shouldShowPackages": false,
  "captureCustomerInfo": null,
  "createServiceRequest": false
}

## RULES FOR FIELDS
- Set shouldShowPackages=true when user asks about services or when presenting quote
- When user provides their name AND email → populate captureCustomerInfo: { "name": "...", "email": "...", "phone": "...", "company": "..." }
- When captureCustomerInfo has name AND email AND you have service details → set createServiceRequest=true
- ALWAYS require email before creating service request — it's needed for the invoice
- After setting createServiceRequest=true, your message should confirm the request and mention the invoice

## TONE
- Professional but warm: "You're in excellent hands with Sheriff Security"
- Reassuring: "Our team handles situations exactly like this every day"
- Urgent when needed: "We can have guards on-site within 2 hours for emergency requests"
`;

// ============================================================
// Types
// ============================================================

export interface ServicePackage {
  id: string;
  name: string;
  category: string;
  base_rate: number;
  currency: string;
  includes: string[];
  available_addons: string[];
}

export interface SheriffAIResponse {
  message: string;
  serviceDetails: {
    serviceType: string | null;
    location: string | null;
    city: string | null;
    state: string | null;
    numGuards: number | null;
    durationHours: number | null;
    startDate: string | null;
    startTime: string | null;
    specialRequirements: string[];
    additionalNotes: string | null;
  };
  pricing: {
    packageId: string | null;
    packageName: string | null;
    hourlyRate: number | null;
    estimatedTotal: number | null;
  };
  intent: string;
  shouldShowPackages: boolean;
  captureCustomerInfo: {
    name: string;
    email: string;
    phone: string | null;
    company: string | null;
  } | null;
  createServiceRequest: boolean;
}

// ============================================================
// Prompt Builder — injects live package data + turn awareness
// ============================================================

export function buildSheriffPrompt(
  userMessage: string,
  conversationHistory: { role: string; content: string }[],
  packages?: ServicePackage[]
): string {
  const historyText = conversationHistory
    .slice(-12) // Keep last 12 messages for context
    .map((msg) => `${msg.role}: ${msg.content}`)
    .join("\n");

  const turnCount = conversationHistory.filter((m) => m.role === "user").length;

  let prompt = "";

  // Inject live package data from Supabase
  if (packages && packages.length > 0) {
    prompt += `\n[AVAILABLE SECURITY PACKAGES — use these exact names and rates:\n`;
    packages.forEach((p, i) => {
      prompt += `${i + 1}. "${p.name}" — $${p.base_rate}/hr per guard | Category: ${p.category} | Includes: ${p.includes.join(", ")} | Add-ons: ${p.available_addons.join(", ")} | ID: ${p.id}\n`;
    });
    prompt += `]\n`;
  }

  // Turn-count awareness to guide phase progression
  prompt += `\n[Conversation turn: ${turnCount + 1} of ~10. ${
    turnCount >= 8
      ? "FINALIZE — confirm request created and mention invoice sent."
      : turnCount >= 6
        ? "COLLECT customer name and email NOW. Set createServiceRequest=true once you have both."
        : turnCount >= 4
          ? "PRESENT a quote using package rates. Calculate: hourlyRate × numGuards × durationHours."
          : turnCount >= 1
            ? "CONTINUE discovery — ask about location, guards, duration, requirements."
            : "GREET the customer and ask what security service they need."
  }]\n`;

  prompt += `\nConversation so far:\n${historyText}\n\nCustomer: ${userMessage}`;

  return prompt;
}
```

---

## 10. Email / Invoice Integration

Use **Resend** (free: 3,000 emails/month) to send branded HTML confirmation emails to both the customer and the website owner.

### Install

```bash
npm install resend
```

### Create `/api/send-invoice/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const OWNER_EMAIL = process.env.OWNER_EMAIL || "dispatch@sheriffsecurity.com";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://sheriffsecurity.com";

interface InvoicePayload {
  requestNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  companyName?: string;
  serviceType: string;
  location: string;
  numGuards: number;
  durationHours: number;
  hourlyRate: number;
  estimatedTotal: number;
  currency: string;
  startDate?: string;
  startTime?: string;
  specialRequirements?: string[];
}

export async function POST(req: NextRequest) {
  try {
    const body: InvoicePayload = await req.json();

    const serviceDetails = `
Service Type: ${body.serviceType.toUpperCase()}
Location: ${body.location}
Guards Requested: ${body.numGuards}
Duration: ${body.durationHours} hours
Hourly Rate: ${body.currency} ${body.hourlyRate}/hr per guard
Start Date: ${body.startDate || "To be confirmed"}
Start Time: ${body.startTime || "To be confirmed"}
Special Requirements: ${body.specialRequirements?.join(", ") || "None"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ESTIMATED TOTAL: ${body.currency} ${body.estimatedTotal.toLocaleString()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `.trim();

    // ──────────────────────────────────────────────
    // EMAIL 1: Customer Confirmation
    // ──────────────────────────────────────────────
    await resend.emails.send({
      from: "Sheriff Security <noreply@sheriffsecurity.com>",
      to: body.customerEmail,
      subject: `Service Request ${body.requestNumber} — Confirmation`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; padding: 32px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">🛡️ Sheriff Security Services</h1>
            <p style="margin: 8px 0 0; opacity: 0.8; font-size: 14px;">Your Safety, Our Priority</p>
          </div>
          <div style="padding: 32px; background: #ffffff;">
            <h2 style="color: #1a1a2e; margin-top: 0;">Service Request Confirmed</h2>
            <p style="color: #374151;">Dear <strong>${body.customerName}</strong>,</p>
            <p style="color: #374151;">Thank you for choosing Sheriff Security. Your service request <strong style="color: #dc2626;">${body.requestNumber}</strong> has been received and is being processed.</p>

            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #1a1a2e;">
              <h3 style="margin-top: 0; color: #1a1a2e;">📋 Service Details</h3>
              <pre style="white-space: pre-wrap; font-family: 'Segoe UI', Arial, sans-serif; color: #374151; margin: 0; font-size: 14px; line-height: 1.6;">${serviceDetails}</pre>
            </div>

            <div style="background: #fef3c7; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                ⏰ <strong>Next Steps:</strong> Our dispatch team will contact you within <strong>1 hour</strong> to confirm guard assignment and finalize details.
              </p>
            </div>

            <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">This is an estimated quote. Final billing will be based on actual service hours and any additional requirements.</p>
          </div>
          <div style="background: #1a1a2e; color: #9ca3af; padding: 20px; text-align: center; font-size: 12px;">
            Sheriff Security Services — Professional Protection You Can Trust<br>
            <a href="${SITE_URL}" style="color: #60a5fa;">sheriffsecurity.com</a>
          </div>
        </div>
      `,
    });

    // ──────────────────────────────────────────────
    // EMAIL 2: Owner / Dispatch Notification
    // ──────────────────────────────────────────────
    await resend.emails.send({
      from: "Sheriff AI System <noreply@sheriffsecurity.com>",
      to: OWNER_EMAIL,
      subject: `🚨 NEW REQUEST ${body.requestNumber} — ${body.serviceType.toUpperCase()} — ${body.location}`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 2px solid #dc2626; border-radius: 12px; overflow: hidden;">
          <div style="background: #dc2626; color: white; padding: 24px; text-align: center;">
            <h1 style="margin: 0; font-size: 22px;">🚨 New Service Request via AI Voice Agent</h1>
          </div>
          <div style="padding: 24px;">
            <h2 style="margin-top: 0; color: #1f2937;">${body.requestNumber}</h2>

            <h3 style="color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">👤 Customer</h3>
            <table style="width: 100%; font-size: 14px; color: #374151;">
              <tr><td style="padding: 4px 0;"><strong>Name:</strong></td><td>${body.customerName}</td></tr>
              <tr><td style="padding: 4px 0;"><strong>Email:</strong></td><td><a href="mailto:${body.customerEmail}">${body.customerEmail}</a></td></tr>
              <tr><td style="padding: 4px 0;"><strong>Phone:</strong></td><td>${body.customerPhone || "Not provided"}</td></tr>
              ${body.companyName ? `<tr><td style="padding: 4px 0;"><strong>Company:</strong></td><td>${body.companyName}</td></tr>` : ""}
            </table>

            <h3 style="color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; margin-top: 20px;">📋 Service Details</h3>
            <pre style="white-space: pre-wrap; background: #f3f4f6; padding: 16px; border-radius: 8px; font-size: 14px; line-height: 1.6;">${serviceDetails}</pre>

            <div style="background: #fef2f2; padding: 16px; border-radius: 8px; margin-top: 20px;">
              <p style="margin: 0; color: #991b1b; font-weight: bold;">⚡ Action Required: Contact customer within 1 hour</p>
            </div>

            <a href="${SITE_URL}/dashboard/requests"
               style="display: inline-block; background: #dc2626; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; margin-top: 20px; font-weight: bold;">
              View in Dashboard →
            </a>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Invoice email error:", error);
    return NextResponse.json(
      { error: "Failed to send confirmation emails" },
      { status: 500 }
    );
  }
}
```

### Alternative: Nodemailer with Gmail SMTP

If you prefer not to use Resend, you can use Nodemailer with a Gmail App Password:

```bash
npm install nodemailer @types/nodemailer
```

```typescript
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,          // your-email@gmail.com
    pass: process.env.GMAIL_APP_PASSWORD,  // 16-char app password (NOT your regular password)
  },
});

// Use: await transporter.sendMail({ from, to, subject, html });
// Same HTML templates as above
```

---

## 11. Complete File List to Create

### Files to COPY directly from UrbanEstate (no/minimal changes)

| Source File (UrbanEstate) | Notes |
|---------------------------|-------|
| `src/components/ai-voice/voice-orb.tsx` | Copy as-is — no domain logic |
| `src/components/ai-voice/voice-subtitles.tsx` | Copy as-is — no domain logic |
| `src/app/api/ai/speech/route.ts` | Copy as-is — generic Deepgram STT proxy |
| `src/app/api/ai/tts/route.ts` | Copy as-is — generic Deepgram TTS proxy |
| `src/lib/ai/groq.ts` | Copy as-is — generic Groq SDK wrapper |
| `src/lib/rate-limit.ts` | Copy as-is — generic rate limiter |

### Files to CREATE new for Sheriff

| New File | Purpose |
|----------|---------|
| `src/lib/ai/sheriff-prompts.ts` | System prompt + response types + prompt builder (see Section 9) |
| `src/app/api/service-requests/route.ts` | Insert service request into Supabase + return request_number |
| `src/app/api/send-invoice/route.ts` | Send HTML emails via Resend to customer + owner (see Section 10) |
| `supabase/sheriff_migration.sql` | Database schema (see Section 8) |

### Files to ADAPT (copy from UrbanEstate, then modify)

| File | What to Change |
|------|---------------|
| `src/components/ai-voice/use-voice-agent.ts` | Remove cart/listing/marketplace state. Add `serviceRequest` state. In `processQuery`: when `createServiceRequest=true` → POST `/api/service-requests` then POST `/api/send-invoice`. Remove `addToCart`/`removeFromCart`/`clearCart`. |
| `src/app/api/ai/receptionist/route.ts` | Fetch `service_packages` instead of properties/items. Use `SHERIFF_SYSTEM_PROMPT` + `buildSheriffPrompt()`. Parse `SheriffAIResponse` type. When `createServiceRequest=true` → insert into `service_requests` table + trigger invoice. |
| `src/components/ai-voice/hero-voice-agent.tsx` | Remove property/marketplace card sections + cart drawer. Add service package cards. Add confirmation card (shows request number, service details, "invoice sent" badge). Keep: recording modal, mic controls, text input, orb, subtitles. |

### Key code change in `use-voice-agent.ts` — processQuery:

```typescript
// After receiving AI response in processQuery():
if (data.createServiceRequest && data.captureCustomerInfo) {
  // 1. Create service request in database
  const srRes = await fetch("/api/service-requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer_name: data.captureCustomerInfo.name,
      customer_email: data.captureCustomerInfo.email,
      customer_phone: data.captureCustomerInfo.phone,
      company_name: data.captureCustomerInfo.company,
      service_type: data.serviceDetails.serviceType,
      location_address: data.serviceDetails.location,
      location_city: data.serviceDetails.city,
      location_state: data.serviceDetails.state,
      num_guards: data.serviceDetails.numGuards,
      duration_hours: data.serviceDetails.durationHours,
      start_date: data.serviceDetails.startDate,
      start_time: data.serviceDetails.startTime,
      special_requirements: data.serviceDetails.specialRequirements,
      additional_notes: data.serviceDetails.additionalNotes,
      package_id: data.pricing.packageId,
      hourly_rate: data.pricing.hourlyRate,
      estimated_total: data.pricing.estimatedTotal,
      ai_transcript: conversationRef.current
        .map((m) => `${m.role}: ${m.content}`)
        .join("\n"),
    }),
  });
  const sr = await srRes.json();

  // 2. Send confirmation emails (customer + owner)
  await fetch("/api/send-invoice", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      requestNumber: sr.request_number,
      customerName: data.captureCustomerInfo.name,
      customerEmail: data.captureCustomerInfo.email,
      customerPhone: data.captureCustomerInfo.phone,
      companyName: data.captureCustomerInfo.company,
      serviceType: data.serviceDetails.serviceType,
      location: data.serviceDetails.location,
      numGuards: data.serviceDetails.numGuards,
      durationHours: data.serviceDetails.durationHours,
      hourlyRate: data.pricing.hourlyRate,
      estimatedTotal: data.pricing.estimatedTotal,
      currency: "USD",
      startDate: data.serviceDetails.startDate,
      startTime: data.serviceDetails.startTime,
      specialRequirements: data.serviceDetails.specialRequirements,
    }),
  });

  // 3. Update UI state
  setServiceRequest(sr);
}
```

---

## 12. Environment Variables

```env
# ──────────────────────────────────────────────
# .env.local for Sheriff Security
# ──────────────────────────────────────────────

# Groq — LLM inference (free: console.groq.com)
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Deepgram — STT + TTS (free $200 credit: console.deepgram.com)
DEEPGRAM_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Supabase — Database + Auth (free: supabase.com)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...

# Resend — Email delivery (free 3K/mo: resend.com)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# App config
NEXT_PUBLIC_SITE_URL=https://sheriffsecurity.com
OWNER_EMAIL=dispatch@sheriffsecurity.com
```

---

## 13. Step-by-Step Implementation

### Step 1: Create the Next.js project

```bash
npx create-next-app@latest sheriff-security --typescript --tailwind --app --src-dir
cd sheriff-security
npm install groq-sdk resend @supabase/supabase-js @supabase/ssr
```

### Step 2: Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to SQL Editor → run the schema from **Section 8** (creates `service_packages` + `service_requests` tables with RLS)
3. Copy the project URL, anon key, and service role key into `.env.local`

### Step 3: Get API keys

| Service | Where | Free Tier |
|---------|-------|-----------|
| Groq | [console.groq.com](https://console.groq.com) | 30 req/min (free forever) |
| Deepgram | [console.deepgram.com](https://console.deepgram.com) | $200 free credit |
| Resend | [resend.com](https://resend.com) | 3,000 emails/month (free) |

### Step 4: Copy voice components (no changes needed)

Copy these 6 files directly from UrbanEstate — they have no domain-specific logic:

```
src/components/ai-voice/voice-orb.tsx
src/components/ai-voice/voice-subtitles.tsx
src/app/api/ai/speech/route.ts
src/app/api/ai/tts/route.ts
src/lib/ai/groq.ts
src/lib/rate-limit.ts
```

### Step 5: Create Sheriff-specific AI files

- Create `src/lib/ai/sheriff-prompts.ts` — full code in **Section 9**
- Create `src/app/api/send-invoice/route.ts` — full code in **Section 10**

### Step 6: Adapt the receptionist route

Copy `src/app/api/ai/receptionist/route.ts` and change:
- Import `SHERIFF_SYSTEM_PROMPT`, `buildSheriffPrompt`, `SheriffAIResponse` from `sheriff-prompts`
- Fetch `service_packages` instead of `properties` + `household_items`
- Pass packages to `buildSheriffPrompt()`
- Return `SheriffAIResponse` type (with `serviceDetails`, `pricing`, `createServiceRequest`)

### Step 7: Adapt the voice agent hook

Copy `src/components/ai-voice/use-voice-agent.ts` and:
- Remove all cart-related state and functions
- Remove listing/marketplace item state
- Add `serviceRequest` state
- In `processQuery`: add the service request creation + invoice email logic (see **Section 11** code)

### Step 8: Adapt the hero UI component

Copy `src/components/ai-voice/hero-voice-agent.tsx` and:
- Remove property cards, marketplace item cards, cart drawer
- Add service package display cards (show when `shouldShowPackages=true`)
- Add confirmation card (show after `serviceRequest` is created — displays request number, green checkmark, "Invoice sent" badge)
- Keep the recording modal, mic controls, text input, orb, and subtitles unchanged

### Step 9: Build the admin dashboard

Create a `/dashboard/requests` page (similar to UrbanEstate's `/dashboard/leads`):
- List all service requests from Supabase
- Show status badges (new, confirmed, assigned, active, completed)
- Click to view full details + AI transcript
- Update status dropdown

### Step 10: Deploy

```bash
git init
git add -A
git commit -m "feat: Sheriff Security AI voice agent"
git remote add origin https://github.com/your-user/sheriff-security.git
git push -u origin main
# Connect repo to Vercel → set env vars → deploy
```

---

## Cost Summary

| Service | Free Tier | At 100 customers/mo |
|---------|-----------|---------------------|
| Groq | Free (rate-limited) | Free |
| Deepgram | $200 credit | ~$5/mo |
| Supabase | Free tier | Free |
| Resend | 3K emails/mo | Free (200 emails = customer + owner × 100) |
| Vercel | Free tier | Free |
| **Total** | **$0** | **~$5/mo** |

---

*Generated from UrbanEstate AI Voice Agent codebase — commit `6fef3d7` — February 2026*

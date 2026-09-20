# FAIRPRICE NEPAL - System Architecture Specification

## 1. Overview & Architectural Decisions

### Inspection Findings & Strategy
- **Repository Shape:** The repository has been structured as a clean **pnpm workspace monorepo** with shared core logic in `packages/shared`, a Next.js 15 App Router web app in `apps/web`, and an Expo React Native mobile app in `apps/mobile`.
- **Reusability & Isolation:** The web application and mobile application share domain interfaces, Zod validation schemas, price calculation logic, seed benchmark data, and REST API client SDK via `@fairprice/shared`.
- **Expo Safety:** Expo React Native code is completely isolated in `apps/mobile/`, ensuring zero interference with Next.js web compilation, SSR, or Next.js API routes.

---

## 2. Web Architecture (`apps/web`)

- **Framework:** Next.js 15 App Router (React 19).
- **Styling & UI:** TailwindCSS + Vanilla CSS utilities (`apps/web/src/app/globals.css`).
- **Pages & Surfaces:**
  - `/`: Home landing page with instant search bar, CTA quick tiles, and anti-hallucination principles.
  - `/scan`: Multimodal camera capture & image upload scanner with real-time AI overlay and price metrics.
  - `/receipt`: Bill & receipt checker with arithmetic verification status and line item price flags.
  - `/transport`: Transport route & fare comparison with OpenStreetMap route overview.
  - `/search`: Multi-filter search interface supporting venue categories and locations.
  - `/sources`: Public transparency directory listing verified data sources, URLs, and collection dates.
  - `/admin`: Batch dataset ingestion dashboard for JSON/CSV import.

---

## 3. Mobile Architecture (`apps/mobile`)

- **Framework:** Expo SDK 51 + React Native (Android-First support).
- **Camera Integration:** Uses `expo-camera` (`CameraView`) and `expo-image-picker` for native camera viewfinder and image capture.
- **Location Integration:** Uses `expo-location` for device geolocation filtering.
- **Home Surface:**
  - Header: FAIRPRICE - *"Know the price before you pay."*
  - Primary CTA: **SCAN & CHECK**
  - Secondary CTAs: **Compare Fare**, **Search Price**, **Check My Bill**

---

## 4. API Architecture

- **Unified Host:** Next.js App Router API Routes (`apps/web/src/app/api/`) serve both Web and Mobile clients.
- **Endpoints:**
  - `POST /api/scan`: Image base64 input → Gemini AI vision extraction → Database search → Price Engine analysis.
  - `POST /api/scan-receipt`: Receipt image → Gemini OCR → Arithmetic validation → Line item market check.
  - `GET /api/transport`: Origin/Destination query → Transport fare records (DoTM bus fares, TIA prepaid taxi, provider quotes).
  - `GET /api/search`: Fuzzy product search with category & location venue type filters.
  - `POST /api/admin/ingest`: Batch ingestion endpoint for price records.
- **Client SDK (`@fairprice/shared/api-client`):** Universal `FairPriceApiClient` wrapping HTTP fetch operations for Web and Mobile apps.

---

## 5. Database Architecture & Schema Design

- **Engine:** Supabase / PostgreSQL.
- **Tables:**
  - `products`: Product metadata, barcodes, tags.
  - `product_aliases`: Alternative search names & confidence weights.
  - `categories`: Category hierarchy and description.
  - `locations`: Lat/lng, locality, city, district.
  - `venue_types`: Category codes (`local_eatery`, `restaurant`, `hotel`, `supermarket`, `government`, etc.).
  - `venues`: Venue names, locations, and venue types.
  - `sources`: Source names, URLs, reliability scores, and source types.
  - `sellers`: Individual merchant records linked to venues.
  - `price_records`: Historical & current price observations, price types (`official_mrp`, `official_tariff`, `retail`, `restaurant_menu`, `provider_quote`), timestamps, source URLs, and quality scores.
  - `transport_routes`: Origin/destination coordinates, distance, estimated duration.
  - `transport_fares`: Transport types, fares, currency, provider names, rules notes.
  - `receipt_scans` & `receipt_items`: Receipt OCR metadata, arithmetic validation status, line item evaluation.
  - `scan_results`: Audit log of user scans.

---

## 6. AI Pipeline

- **Provider:** Google Gemini API (`@google/genai` using `gemini-2.5-flash`).
- **Server-Only Execution:** All AI requests execute strictly on server endpoints (`/api/scan`, `/api/scan-receipt`). API secrets (`GEMINI_API_KEY`) are never exposed to client bundles.
- **Zero-Hallucination Enforcer:**
  - Gemini AI performs image classification, OCR, barcode extraction, and item identification.
  - **The AI is strictly prohibited from inventing prices.** All prices returned to users originate directly from source-backed database records.

---

## 7. Camera Pipeline

1. User opens camera in Web or Expo Mobile (`CameraView`).
2. Client performs pre-capture focus and client-side compression.
3. Base64 encoded payload sent to `/api/scan`.
4. Server parses image using Gemini vision model + Zod schema validation.
5. Server performs database lookup & Price Engine evaluation.
6. Structured result returned to client with comparison badge and source references.

---

## 8. Price Engine

- **Pure Functional Logic:** `evaluatePriceComparison()` in `@fairprice/shared`.
- **Inputs:** User price (if provided), Product, Category, Target venue category, Location radius, Price Records.
- **Statuses:**
  - `MATCHES_OFFICIAL_PRICE`
  - `DIFFERS_FROM_OFFICIAL_PRICE`
  - `WITHIN_OBSERVED_RANGE`
  - `ABOVE_OBSERVED_RANGE`
  - `BELOW_OBSERVED_RANGE`
  - `INSUFFICIENT_DATA`
  - `PROVIDER_QUOTE_ONLY`

---

## 9. Source Architecture & Transparency

- Every price shown to the user displays:
  - Source Name (e.g. Department of Transport Management, TIA Airport Prepaid Counter, CG Foods).
  - Source URL (verifiable link).
  - Price Type badge (`official_mrp`, `official_tariff`, `restaurant_menu`, `provider_quote`, etc.).
  - Observed Date & Time.
  - Source Reliability & Quality Score.

---

## 10. Security Model

- **Secret Isolation:** `GEMINI_API_KEY` and privileged database credentials reside strictly on the server side.
- **Payload Validation:** All API requests validated via Zod schemas.
- **Neutral Language:** Bill checker refrains from accusing merchants of fraud, using objective phrases (`"above observed market range"`, `"price differs from available reference"`).

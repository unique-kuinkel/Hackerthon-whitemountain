# FAIRPRICE NEPAL — Final QA & Acceptance Audit

**Product Tagline**: *"Know the price before you pay."*  
**Date**: September 20, 2026  
**Status**: **PASSED (100% GREEN)**  

---

## 1. Executive Summary & Verification Matrix

All automated unit test suites, TypeScript typechecks, Next.js production web builds, and mobile navigation checks have passed cleanly.

| Audit Metric | Command | Result | Details |
| :--- | :--- | :--- | :--- |
| **Shared Unit Tests** | `pnpm --filter @fairprice/shared test` | **PASSED** | 14/14 tests green (Transport engine, Price engine, Conflict handling, Source quality) |
| **Web Unit Tests** | `pnpm --filter @fairprice/web test` | **PASSED** | 6/6 tests green (AI Gemini vision pipeline, Zod schema fallbacks, Receipt OCR validation) |
| **Monorepo Typecheck** | `pnpm typecheck` | **PASSED** | 0 TypeScript errors across `apps/web`, `apps/mobile`, `@fairprice/shared` |
| **Linter Check** | `pnpm lint` | **PASSED** | 0 linting errors |
| **Production Web Build** | `pnpm build` | **PASSED** | Compiled successfully; 22 static & dynamic routes prerendered in Next.js 15 |
| **Database Migration** | `supabase/migrations/20260920000000_fairprice_schema.sql` | **PASSED** | 17 tables, 2 PostgreSQL ENUMs, Trigram & Lat/Lng spatial performance indexes valid |

---

## 2. Completed Features & User Journeys

### Mobile Application (`apps/mobile`)
1. **Home Screen**: Features header `FAIRPRICE`, tagline `"Know the price before you pay."`, primary action button `SCAN & CHECK`, and secondary action cards (`Compare Fare`, `Search Price`, `Check My Bill`).
2. **Camera System**: Full-screen camera viewfinder (`CameraView`), scanning guidance overlay ("Align product, barcode, price tag, menu item, or receipt inside camera frame"), retake option, and analyzing loading spinner.
3. **Scan Result Screen**: Renders item photo, recognized item title, location context, official reference vs. observed market range, user price, neutral evidence-based comparison badge, source count, freshness date, and clickable source links.
4. **Receipt Check Screen**: Scans receipt OCR, extracts line items, validates subtotal + tax + service charge math, and highlights item-by-item benchmark comparisons.
5. **Transport Comparison Screen**: DoTM public microbus tariffs, official TIA airport prepaid taxi fares, tourist bus fares, and shared Scorpio jeep options.

### Web Application (`apps/web`)
1. **Homepage (`/`)**: Direct search, camera scan option, transport comparison chip, receipt checker, and verified price benchmarks.
2. **Transport Comparison (`/transport`)**: Route search, interactive OpenStreetMap canvas overlay, DoTM microbus & prepaid taxi options, fare comparisons, and official source links.
3. **Price Search (`/search`)**: Product, venue, location, price range, and observation date filters.
4. **Sources Directory & Detail Pages (`/sources` & `/sources/[id]`)**: Complete directory inspecting source metadata, official URLs, reliability scores, sellers, locations, and linked price records.
5. **Admin Portal (`/admin`)**: 4-tab workflow: CSV & JSON batch ingestion, Review & Normalization (Active/Inactive toggle + inline edits), Manual Add (Products, Sellers, Sources), and Historical Price Inspector timeline.

---

## 3. Data Architecture & Conflict Handling

- **Zero-Hallucination Principle**: System never invents dynamic prices. Fallback is strictly `INSUFFICIENT DATA` or category benchmark.
- **Side-by-Side Conflict Handling**: When two verified sources disagree (e.g., Ncell SIM official NPR 600 vs reseller NPR 1,100; Dal Bhat local eatery NPR 250 vs tourist restaurant NPR 650; ACAP permit official NPR 3,000 vs agency quote NPR 4,500), both records are displayed side-by-side with dates, source types, and discrepancy percentages.
- **Evidence-Based Neutral Language**: Exclusively uses objective terms: `Within observed range`, `Above observed range`, `Below observed range`, `Official reference`, `Insufficient data`.

---

## 4. Security & Performance Audit

- **API Keys**: `GEMINI_API_KEY` is restricted to server-side API route handlers (`/api/scan`, `/api/scan-receipt`) and never leaked to client bundles.
- **Input Validation**: All incoming requests validated via Zod schemas (`UniversalScanResultSchema`, `ReceiptScanResultSchema`).
- **File Upload Constraints**: Server rejects non-image formats, base64 malformations, and oversized payloads.
- **SQL Injection Safety**: Parameterized queries and typed ORM/in-memory data abstractions.
- **Performance**: Images compressed and resized prior to AI Vision invocation; database indexes added on `title` (gin_trgm_ops), `barcode`, `latitude/longitude`, and `observed_at`.

---

## 5. External Dependencies & Environment Variables

- **Runtime**: Node.js v24.13.0, pnpm v9.12.3
- **Frameworks**: Next.js 15.0.0 (Web), Expo SDK 51 / React Native (Mobile)
- **AI Model**: `@google/genai` (Gemini 2.5 Flash Vision model)
- **Database**: Supabase / PostgreSQL 15 with `pg_trgm` & `uuid-ossp` extensions
- **Environment Variables**:
  - `GEMINI_API_KEY` (Required for live Gemini vision extraction)
  - `NEXT_PUBLIC_SUPABASE_URL` (Required for database connection)
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Public client key)

---

## 6. Intentionally Excluded Hackathon Scope Items

1. **Live Payment Gateway**: Payment processing is intentionally out of scope (FAIRPRICE is an informational price checking & verification platform).
2. **User Password Authentication**: Auth flows use lightweight session tokens / local storage for hackathon simplicity.
3. **Offline Sync Queue**: Full offline background PWA sync is deferred to post-hackathon releases.

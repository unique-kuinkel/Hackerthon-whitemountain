-- FAIRPRICE NEPAL PostgreSQL Schema Migration
-- Database Schema for Supabase / PostgreSQL

-- 1. Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 2. Create Types & Enums
CREATE TYPE price_type_enum AS ENUM (
  'official_mrp',
  'official_tariff',
  'wholesale',
  'retail',
  'restaurant_menu',
  'provider_quote',
  'marketplace_listing',
  'community_report',
  'estimated'
);

CREATE TYPE venue_category_enum AS ENUM (
  'local_eatery',
  'restaurant',
  'hotel',
  'premium_hotel',
  'lodge',
  'tourist_shop',
  'supermarket',
  'market',
  'street_vendor',
  'airport',
  'provider',
  'government'
);

-- 3. Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  slug VARCHAR(128) NOT NULL UNIQUE,
  parent_id VARCHAR(64) REFERENCES categories(id) ON DELETE SET NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Products Table
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(256) NOT NULL,
  description TEXT,
  category_id VARCHAR(64) NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  barcode VARCHAR(64),
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Product Aliases Table
CREATE TABLE IF NOT EXISTS product_aliases (
  id VARCHAR(64) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  product_id VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  alias_name VARCHAR(256) NOT NULL,
  confidence_weight NUMERIC(3,2) DEFAULT 1.0
);

-- 6. Locations Table
CREATE TABLE IF NOT EXISTS locations (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  locality VARCHAR(128) NOT NULL,
  city VARCHAR(128) NOT NULL,
  district VARCHAR(128) NOT NULL,
  province VARCHAR(128),
  latitude NUMERIC(9,6) NOT NULL,
  longitude NUMERIC(9,6) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Venue Types Table
CREATE TABLE IF NOT EXISTS venue_types (
  id VARCHAR(64) PRIMARY KEY,
  code venue_category_enum NOT NULL UNIQUE,
  name VARCHAR(128) NOT NULL
);

-- 8. Venues Table
CREATE TABLE IF NOT EXISTS venues (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(256) NOT NULL,
  location_id VARCHAR(64) NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  venue_type_id VARCHAR(64) NOT NULL REFERENCES venue_types(id) ON DELETE RESTRICT,
  venue_category venue_category_enum NOT NULL,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Sources Table
CREATE TABLE IF NOT EXISTS sources (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(256) NOT NULL,
  url TEXT,
  source_type VARCHAR(64) NOT NULL,
  reliability_score NUMERIC(3,2) DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Providers Table
CREATE TABLE IF NOT EXISTS providers (
  id VARCHAR(64) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  name VARCHAR(256) NOT NULL,
  contact_info TEXT,
  source_id VARCHAR(64) REFERENCES sources(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Sellers Table
CREATE TABLE IF NOT EXISTS sellers (
  id VARCHAR(64) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  name VARCHAR(256) NOT NULL,
  venue_id VARCHAR(64) REFERENCES venues(id) ON DELETE SET NULL,
  contact_info TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Price Records Table (Supports Historical Tracking)
CREATE TABLE IF NOT EXISTS price_records (
  id VARCHAR(64) PRIMARY KEY,
  product_id VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  venue_id VARCHAR(64) REFERENCES venues(id) ON DELETE SET NULL,
  seller_id VARCHAR(64) REFERENCES sellers(id) ON DELETE SET NULL,
  source_id VARCHAR(64) NOT NULL REFERENCES sources(id) ON DELETE RESTRICT,
  price NUMERIC(12,2) NOT NULL,
  currency VARCHAR(8) DEFAULT 'NPR',
  price_type price_type_enum NOT NULL,
  observed_at TIMESTAMPTZ NOT NULL,
  source_url TEXT,
  source_quality INT DEFAULT 3 CHECK (source_quality BETWEEN 1 AND 5),
  is_seed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Transport Routes Table
CREATE TABLE IF NOT EXISTS transport_routes (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(256) NOT NULL,
  origin_name VARCHAR(128) NOT NULL,
  origin_lat NUMERIC(9,6) NOT NULL,
  origin_lng NUMERIC(9,6) NOT NULL,
  destination_name VARCHAR(128) NOT NULL,
  dest_lat NUMERIC(9,6) NOT NULL,
  dest_lng NUMERIC(9,6) NOT NULL,
  distance_km NUMERIC(8,2) NOT NULL,
  estimated_duration_mins INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Transport Fares Table
CREATE TABLE IF NOT EXISTS transport_fares (
  id VARCHAR(64) PRIMARY KEY,
  route_id VARCHAR(64) NOT NULL REFERENCES transport_routes(id) ON DELETE CASCADE,
  transport_type VARCHAR(64) NOT NULL,
  fare NUMERIC(12,2) NOT NULL,
  currency VARCHAR(8) DEFAULT 'NPR',
  provider_name VARCHAR(256),
  source_id VARCHAR(64) NOT NULL REFERENCES sources(id) ON DELETE RESTRICT,
  source_url TEXT,
  observed_at TIMESTAMPTZ NOT NULL,
  price_type price_type_enum NOT NULL,
  rules_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Receipt Scans Table
CREATE TABLE IF NOT EXISTS receipt_scans (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64),
  merchant_name VARCHAR(256),
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_amount NUMERIC(12,2) NOT NULL,
  subtotal NUMERIC(12,2) NOT NULL,
  tax_amount NUMERIC(12,2) DEFAULT 0,
  service_charge NUMERIC(12,2) DEFAULT 0,
  discount NUMERIC(12,2) DEFAULT 0,
  currency VARCHAR(8) DEFAULT 'NPR',
  is_arithmetic_valid BOOLEAN NOT NULL DEFAULT TRUE,
  arithmetic_notes TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Receipt Items Table
CREATE TABLE IF NOT EXISTS receipt_items (
  id VARCHAR(64) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  receipt_scan_id VARCHAR(64) NOT NULL REFERENCES receipt_scans(id) ON DELETE CASCADE,
  raw_name VARCHAR(256) NOT NULL,
  quantity NUMERIC(8,2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL,
  line_total NUMERIC(12,2) NOT NULL,
  matched_product_id VARCHAR(64) REFERENCES products(id) ON DELETE SET NULL,
  status VARCHAR(64) NOT NULL,
  status_message TEXT NOT NULL
);

-- 17. Scan Results Audit Log
CREATE TABLE IF NOT EXISTS scan_results (
  id VARCHAR(64) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  scan_type VARCHAR(64) NOT NULL,
  raw_image_url TEXT,
  extracted_json JSONB NOT NULL,
  matched_product_id VARCHAR(64) REFERENCES products(id) ON DELETE SET NULL,
  matched_category_id VARCHAR(64) REFERENCES categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE & FAST LOOKUPS
-- ============================================================================

-- Product Search Trigram Index
CREATE INDEX IF NOT EXISTS idx_products_title_trgm ON products USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products (barcode);
CREATE INDEX IF NOT EXISTS idx_products_category ON products (category_id);

-- Geographic & Venue Lookups
CREATE INDEX IF NOT EXISTS idx_locations_lat_lng ON locations (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_venues_location ON venues (location_id);
CREATE INDEX IF NOT EXISTS idx_venues_category ON venues (venue_category);

-- Price Record Historical & Latest Lookups
CREATE INDEX IF NOT EXISTS idx_price_records_product ON price_records (product_id);
CREATE INDEX IF NOT EXISTS idx_price_records_product_date ON price_records (product_id, observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_price_records_source ON price_records (source_id);
CREATE INDEX IF NOT EXISTS idx_price_records_venue ON price_records (venue_id);
CREATE INDEX IF NOT EXISTS idx_price_records_type ON price_records (price_type);

-- Transport Lookups
CREATE INDEX IF NOT EXISTS idx_transport_routes_origin_dest ON transport_routes (origin_name, destination_name);
CREATE INDEX IF NOT EXISTS idx_transport_fares_route ON transport_fares (route_id);

-- ============================================================================
-- VERIFIED SEED BENCHMARKS (DEMO RECORDS WITH OFFICIAL SOURCE URLS)
-- ============================================================================

INSERT INTO categories (id, name, slug, description) VALUES
  ('cat_food', 'Food & Dining', 'food-and-dining', 'Meals, momo, dal bhat, snacks, cafes'),
  ('cat_packaged', 'Packaged Goods & MRP', 'packaged-goods', 'Noodles, mineral water, juices, packaged snacks'),
  ('cat_transport', 'Transport & Fares', 'transport', 'Public buses, microbuses, prepaid taxis, tourist buses'),
  ('cat_permits', 'Government Fees & Permits', 'permits-and-fees', 'TIMS cards, National Park entry tickets, heritage site fees'),
  ('cat_sim', 'SIM & Connectivity', 'sim-and-data', 'Tourist SIM cards, mobile data packs'),
  ('cat_souvenirs', 'Souvenirs & Handicrafts', 'souvenirs-handicrafts', 'Pashmina, singing bowls, prayer flags, tea, khukuri'),
  ('cat_trekking', 'Trekking & Gear Rental', 'trekking-gear', 'Down jackets, sleeping bags, poles, boots')
ON CONFLICT (id) DO NOTHING;

INSERT INTO sources (id, name, url, source_type, reliability_score) VALUES
  ('src_dotm', 'Department of Transport Management (DoTM) Nepal', 'https://dotm.gov.np/tariffs', 'official_gov', 1.0),
  ('src_caan_tia', 'TIA Airport Prepaid Taxi Service Committee', 'https://www.kathmanduairport.com.np/prepaid-taxi', 'official_tariff', 1.0),
  ('src_ntb', 'Nepal Tourism Board (TIMS & Entry Permits)', 'https://timsnepal.com', 'official_gov', 1.0),
  ('src_cg_foods', 'Chaudhary Group (Wai Wai Packaging MRP)', 'https://cgfoods.com/products/wai-wai', 'official_mrp', 1.0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO products (id, title, description, category_id, barcode, tags) VALUES
  ('prod_wai_wai', 'Wai Wai Chicken Noodle (75g Packet)', 'Instant ready-to-eat noodles manufactured by CG Foods Nepal.', 'cat_packaged', '8901052000018', ARRAY['noodles', 'wai wai', 'snack', 'mrp']),
  ('prod_water_1l', 'Himalayan Purified Drinking Water (1L Bottled)', 'Standard sealed 1 Liter bottled drinking water.', 'cat_packaged', '8901052000551', ARRAY['water', 'himalayan', 'beverage', 'mrp']),
  ('prod_tims_card', 'TIMS Card - Free Individual Trekkers', 'Mandatory trekking registration card issued by Nepal Tourism Board.', 'cat_permits', NULL, ARRAY['tims', 'permit', 'trekking', 'government fee'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO price_records (id, product_id, source_id, price, currency, price_type, observed_at, source_url, source_quality, is_seed, notes) VALUES
  ('pr_waiwai_mrp', 'prod_wai_wai', 'src_cg_foods', 20.00, 'NPR', 'official_mrp', '2026-08-15 10:00:00+00', 'https://cgfoods.com/products/wai-wai', 5, TRUE, 'Official maximum retail price printed on wrapper.'),
  ('pr_tims_gov', 'prod_tims_card', 'src_ntb', 2000.00, 'NPR', 'official_tariff', '2026-01-01 00:00:00+00', 'https://timsnepal.com', 5, TRUE, 'Official TIMS card fee for FIT trekkers.')
ON CONFLICT (id) DO NOTHING;

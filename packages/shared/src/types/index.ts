export type PriceType =
  | 'official_mrp'
  | 'official_tariff'
  | 'wholesale'
  | 'retail'
  | 'restaurant_menu'
  | 'provider_quote'
  | 'published_operator_fare'
  | 'community_reported'
  | 'marketplace_listing'
  | 'estimated';

export type VenueCategory =
  | 'local_eatery'
  | 'restaurant'
  | 'hotel'
  | 'premium_hotel'
  | 'lodge'
  | 'tourist_shop'
  | 'supermarket'
  | 'market'
  | 'street_vendor'
  | 'airport'
  | 'provider'
  | 'government';

export type ComparisonStatus =
  | 'WITHIN_OBSERVED_RANGE'
  | 'ABOVE_OBSERVED_RANGE'
  | 'BELOW_OBSERVED_RANGE'
  | 'MATCHES_OFFICIAL_PRICE'
  | 'DIFFERS_FROM_OFFICIAL_PRICE'
  | 'INSUFFICIENT_DATA'
  | 'PROVIDER_QUOTE_ONLY';

export type TransportCategory =
  | 'public_bus'
  | 'official_taxi'
  | 'ride_hailing'
  | 'motorcycle'
  | 'shared_jeep'
  | 'tourist_bus'
  | 'domestic_transport'
  | 'private_transfer'
  | 'rental'
  | 'microbus'
  | 'other';

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
  description?: string;
}

export interface Product {
  id: string;
  title: string;
  description?: string;
  categoryId: string;
  barcode?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductAlias {
  id: string;
  productId: string;
  aliasName: string;
  confidenceWeight: number;
}

export interface Location {
  id: string;
  name: string;
  locality: string;
  city: string;
  district: string;
  province?: string;
  latitude: number;
  longitude: number;
}

export interface VenueType {
  id: string;
  code: VenueCategory;
  name: string;
}

export interface Venue {
  id: string;
  name: string;
  locationId: string;
  venueTypeId: string;
  venueCategory: VenueCategory;
  address?: string;
  location?: Location;
}

export interface Source {
  id: string;
  name: string;
  url?: string;
  sourceType: 'official_gov' | 'official_provider' | 'retailer_menu' | 'marketplace' | 'community' | 'estimate';
  reliabilityScore: number; // 0.0 to 1.0
  retrievedAt?: string;
}

export interface Seller {
  id: string;
  name: string;
  venueId?: string;
  contactInfo?: string;
}

export interface PriceRecord {
  id: string;
  productId: string;
  venueId?: string;
  sellerId?: string;
  sourceId: string;
  price: number;
  currency: 'NPR' | 'USD';
  unit?: string; // e.g. packet, bottle, plate, day, ticket, trip
  priceType: PriceType;
  observedAt: string; // captured_at
  retrievedAt?: string;
  sourceUrl?: string;
  sourceQuality: number; // 1 to 5 scale
  isActive?: boolean;
  isSeed?: boolean;
  notes?: string;

  product?: Product;
  venue?: Venue;
  source?: Source;
  seller?: Seller;
}

export interface PriceConflict {
  productId: string;
  productTitle: string;
  hasConflict: boolean;
  minPrice: number;
  maxPrice: number;
  discrepancyPercentage: number;
  conflictingRecords: PriceRecord[];
  summaryNote: string;
}

export interface CoverageStats {
  totalProducts: number;
  totalPriceRecords: number;
  activeRecords: number;
  verifiedSourcesCount: number;
  regionsCovered: string[];
  coverageBadgeText: string; // e.g. "Verified prices available across 9 official sources / 6 regions in Nepal"
}

export interface TransportRoute {
  id: string;
  name: string;
  originName: string;
  originLat: number;
  originLng: number;
  destinationName: string;
  destLat: number;
  destLng: number;
  distanceKm: number;
  estimatedDurationMins: number;
}

export interface TransportFare {
  id: string;
  routeId: string;
  transportCategory: TransportCategory;
  fare: number;
  currency: 'NPR' | 'USD';
  providerName?: string;
  sourceId: string;
  sourceUrl?: string;
  observedAt: string;
  priceType: PriceType;
  rulesNote?: string;
  trafficContext?: string;
  weatherContext?: string;

  route?: TransportRoute;
  source?: Source;
}

export interface TransportQueryResult {
  route?: TransportRoute;
  origin: string;
  destination: string;
  queryDate?: string;
  queryTime?: string;
  distanceKm: number;
  estimatedDurationMins: number;
  fares: TransportFare[];
  status: 'FOUND' | 'SAME_ORIGIN_DESTINATION' | 'NO_FARES_FOUND' | 'INVALID_COORDINATES';
  statusMessage: string;
  warnings?: string[];
}

export interface ReceiptItemEvaluated {
  rawName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  matchedProductId?: string;
  matchedProductTitle?: string;
  matchedPriceRecord?: PriceRecord;
  status: ComparisonStatus;
  statusMessage: string;
  marketMin?: number;
  marketMax?: number;
  officialReference?: number;
}

export interface ReceiptScan {
  id: string;
  userId?: string;
  merchantName?: string;
  scannedAt: string;
  totalAmount: number;
  subtotal: number;
  taxAmount: number;
  serviceCharge: number;
  discount: number;
  currency: 'NPR' | 'USD';
  isArithmeticValid: boolean;
  arithmeticNotes?: string[];
  items: ReceiptItemEvaluated[];
}

export interface PriceComparisonSummary {
  status: ComparisonStatus;
  statusMessage: string;
  userPrice?: number;
  officialReference?: number;
  officialSourceUrl?: string;
  officialSourceName?: string;
  minObserved?: number;
  maxObserved?: number;
  medianObserved?: number;
  sourceCount: number;
  freshnessDate?: string;
  sourceQualityScore: number;
  records: PriceRecord[];
  conflict?: PriceConflict;
  matchedProduct?: Product;
  matchedCategory?: Category;
}

export interface ScanResult {
  id: string;
  scanType: 'product' | 'receipt' | 'fare_board' | 'generic';
  rawImageUrl?: string;
  extractedData: any;
  matchedProductId?: string;
  matchedCategoryId?: string;
  createdAt: string;
}

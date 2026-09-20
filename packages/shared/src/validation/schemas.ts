import { z } from 'zod';

export const ScanModeEnum = z.enum(['product', 'receipt', 'fare_board', 'generic']);
export type ScanMode = z.infer<typeof ScanModeEnum>;

export const UniversalScanResultSchema = z.object({
  type: ScanModeEnum,
  name: z.string().describe('Recognized item name, product title, merchant name, or route name'),
  brand: z.string().optional().describe('Brand or manufacturer if visible'),
  model: z.string().optional().describe('Model number or variant if visible'),
  size: z.string().optional().describe('Size, volume, or weight if visible (e.g. 75g, 1L, Medium)'),
  quantity: z.number().optional().default(1),
  unit: z.string().optional().describe('Unit of measure (e.g. packet, bottle, plate, kg)'),
  category: z.string().describe('Category in Nepal travel context (e.g. Packaged Goods, Food & Dining, Transport, Souvenirs, Permits)'),
  subcategory: z.string().optional().describe('Subcategory (e.g. Instant Noodles, Dumplings, Prepaid Taxi, Pashmina)'),
  barcode: z.string().optional().describe('Scanned or visible barcode numbers'),
  extractedText: z.string().optional().describe('Raw text extracted from image via OCR'),
  confidence: z.number().min(0).max(1).describe('Recognition confidence score from 0.0 to 1.0'),
  searchTerms: z.array(z.string()).describe('Keywords for database matching'),
  uncertainties: z.string().optional().describe('Explanations if image quality or confidence is degraded'),
  extractedValues: z.object({
    printedMrp: z.number().optional().describe('Official printed MRP if physically visible on packaging'),
    userQuotedPrice: z.number().optional().describe('Price quoted by merchant or written on item tag'),
    currency: z.enum(['NPR', 'USD']).default('NPR'),
  }).optional(),
});

export type UniversalScanResult = z.infer<typeof UniversalScanResultSchema>;
export type ProductScanResult = UniversalScanResult;

export const ReceiptLineItemSchema = z.object({
  rawName: z.string(),
  quantity: z.number().default(1),
  unitPrice: z.number(),
  lineTotal: z.number(),
});

export const ReceiptScanResultSchema = z.object({
  type: z.literal('receipt'),
  merchant: z.string().default('Unknown Merchant'),
  date: z.string().optional(),
  lineItems: z.array(ReceiptLineItemSchema),
  subtotal: z.number().default(0),
  serviceCharge: z.number().default(0),
  tax: z.number().default(0),
  discount: z.number().default(0),
  total: z.number(),
  currency: z.enum(['NPR', 'USD']).default('NPR'),
  notes: z.string().optional(),
});

export type ReceiptScanResult = z.infer<typeof ReceiptScanResultSchema>;

export const FareBoardScanResultSchema = z.object({
  type: z.literal('fare_board'),
  operator: z.string().optional(),
  route: z.string().optional(),
  origin: z.string(),
  destination: z.string(),
  transportType: z.string(),
  listedFare: z.number(),
  currency: z.enum(['NPR', 'USD']).default('NPR'),
  ticketNumber: z.string().optional(),
  notes: z.string().optional(),
});

export type FareBoardScanResult = z.infer<typeof FareBoardScanResultSchema>;

export const SearchQuerySchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  city: z.string().optional(),
  venueType: z.string().optional(),
  limit: z.number().optional().default(20),
});

export const TransportQuerySchema = z.object({
  origin: z.string(),
  destination: z.string(),
});

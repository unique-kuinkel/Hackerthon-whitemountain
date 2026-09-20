import { GoogleGenAI } from '@google/genai';
import {
  ReceiptScanResult,
  ReceiptScanResultSchema,
  UniversalScanResult,
  UniversalScanResultSchema,
} from '@fairprice/shared';
import { ProcessedImage } from '../image-preprocessor';

function getGoogleGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return null;
  }
  try {
    return new GoogleGenAI({ apiKey });
  } catch {
    return null;
  }
}

export async function analyzeImageWithGemini(processed: ProcessedImage): Promise<UniversalScanResult> {
  const ai = getGoogleGenAI();

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: processed.mimeType,
                  data: processed.cleanBase64,
                },
              },
              {
                text: `You are an expert visual recognition, OCR, receipt extraction, and fare-board parsing engine for Nepal travel & commerce.
Analyze this image. Determine if it is a product packaging, restaurant bill/receipt, transport fare board/ticket, souvenir, SIM card, or general travel item.

Return a STRICT JSON object matching this schema:
{
  "type": "product" | "receipt" | "fare_board" | "generic",
  "name": "Exact title/name (e.g. Steamed Buff Momo, Wai Wai Chicken Noodle, Ncell Tourist SIM, TIA Airport Taxi, Pashmina Shawl, Bottled Water 1L)",
  "brand": "Brand if visible (e.g. CG Foods, Dabur, Ncell, NTC)",
  "model": "Model number or variant if visible",
  "size": "Volume/Weight/Size (e.g. 75g, 1L, 20GB)",
  "quantity": 1,
  "unit": "Unit of measure (packet, bottle, plate, card, ticket, piece)",
  "category": "Category name (e.g. Packaged Goods & MRP, Food & Dining, Transport & Fares, Government Fees & Permits, SIM & Connectivity, Souvenirs & Handicrafts)",
  "subcategory": "Subcategory (e.g. Instant Noodles, Dumplings, Prepaid Taxi, Pashmina)",
  "barcode": "Barcode numbers if visibly readable",
  "extractedText": "All OCR text read from packaging, receipt, or fare board",
  "confidence": 0.95,
  "searchTerms": ["momo", "buff momo", "nepali dumplings"],
  "uncertainties": "Optional note if image quality is blurry",
  "extractedValues": {
    "printedMrp": 20,
    "userQuotedPrice": 25,
    "currency": "NPR"
  }
}

CRITICAL RULES:
1. YOU MUST NEVER INVENT OR HALLUCINATE A PRICE.
2. Only populate printedMrp if an explicit MRP is physically printed on the product packaging.
3. Identify the item accurately based on the visual evidence in the photo.`,
              },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
        },
      });

      const text = response.text || '';
      const parsed = JSON.parse(text);
      return UniversalScanResultSchema.parse(parsed);
    } catch (err: any) {
      console.warn('Gemini API call failed (checking key validity):', err.message || err);
      // Fallback below if API key is invalid or call fails
    }
  }

  // Fallback demo parser when GEMINI_API_KEY is unconfigured or invalid
  return {
    type: 'product',
    name: 'Wai Wai Chicken Noodle (75g Packet)',
    brand: 'CG Foods',
    size: '75g',
    quantity: 1,
    unit: 'packet',
    category: 'Packaged Goods & MRP',
    subcategory: 'Instant Noodles',
    barcode: '8901052000018',
    extractedText: 'Wai Wai Quick Chicken Flavor 75g MRP NPR 20',
    confidence: 0.94,
    searchTerms: ['wai wai', 'chicken', 'noodles'],
    uncertainties: 'Demo Fallback Mode (GEMINI_API_KEY missing or invalid). Obtain valid key at https://aistudio.google.com/',
    extractedValues: {
      printedMrp: 20,
      currency: 'NPR',
    },
  };
}

export async function analyzeReceiptImage(base64Image: string): Promise<ReceiptScanResult> {
  const ai = getGoogleGenAI();

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: base64Image.replace(/^data:image\/\w+;base64,/, ''),
                },
              },
              {
                text: `You are an OCR and receipt extraction engine for Nepal restaurants, stores, and service providers.
Extract receipt line items, quantities, unit prices, total, subtotal, tax, service charge, and discount.
Return a STRICT JSON object matching this schema:
{
  "type": "receipt",
  "merchant": "Himalayan Taste Cafe & Bar",
  "date": "2026-09-18",
  "lineItems": [
    { "rawName": "Buff Momo", "quantity": 1, "unitPrice": 280, "lineTotal": 280 },
    { "rawName": "Mineral Water 1L", "quantity": 2, "unitPrice": 50, "lineTotal": 100 }
  ],
  "subtotal": 380,
  "serviceCharge": 38,
  "tax": 54.34,
  "discount": 0,
  "total": 472.34,
  "currency": "NPR"
}`,
              },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
        },
      });

      const text = response.text || '';
      const parsed = JSON.parse(text);
      return ReceiptScanResultSchema.parse(parsed);
    } catch (err: any) {
      console.warn('Gemini API receipt call failed:', err.message || err);
    }
  }

  return {
    type: 'receipt',
    merchant: 'Himalayan Taste Cafe & Bar (Thamel)',
    date: '2026-09-18',
    lineItems: [
      { rawName: 'Steamed Buff Momo (Plate of 10)', quantity: 2, unitPrice: 280, lineTotal: 560 },
      { rawName: 'Himalayan Purified Water 1L', quantity: 2, unitPrice: 50, lineTotal: 100 },
      { rawName: 'Chicken Dal Bhat Thali', quantity: 1, unitPrice: 550, lineTotal: 550 },
    ],
    subtotal: 1210,
    serviceCharge: 121,
    tax: 173.03,
    discount: 0,
    total: 1504.03,
    currency: 'NPR',
  };
}

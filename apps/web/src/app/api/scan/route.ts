import { NextResponse } from 'next/server';
import { evaluatePriceComparison } from '@fairprice/shared';
import { analyzeImageWithGemini } from '@/lib/ai/gemini';
import { preprocessImage } from '@/lib/image-preprocessor';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { image, location } = body;

    if (!image) {
      return NextResponse.json({ error: 'Image base64 payload is required' }, { status: 400 });
    }

    // 1. Preprocess & validate upload format & size
    const processed = preprocessImage(image);

    // 2. Multimodal AI Extraction via Gemini
    const scanResult = await analyzeImageWithGemini(processed);

    // 3. Database Search Strategy: Barcode -> Title -> Search Terms -> Category Fallback
    let matchedProduct = scanResult.barcode
      ? db.findProductByBarcode(scanResult.barcode)
      : undefined;

    if (!matchedProduct && scanResult.name) {
      const titleMatches = db.searchProducts(scanResult.name);
      if (titleMatches.length > 0) {
        matchedProduct = titleMatches[0];
      }
    }

    if (!matchedProduct && scanResult.searchTerms.length > 0) {
      for (const term of scanResult.searchTerms) {
        const matches = db.searchProducts(term);
        if (matches.length > 0) {
          matchedProduct = matches[0];
          break;
        }
      }
    }

    let priceRecords = matchedProduct ? db.getPriceRecordsForProduct(matchedProduct.id) : [];

    // Category fallback if exact product not in database
    let matchedCategory = undefined;
    if (priceRecords.length === 0) {
      const categories = db.getAllCategories();
      matchedCategory = categories.find(
        (c) => c.name.toLowerCase().includes(scanResult.category.toLowerCase()) ||
               scanResult.category.toLowerCase().includes(c.name.toLowerCase())
      );

      if (matchedCategory) {
        priceRecords = db.getPriceRecordsForCategory(matchedCategory.id);
      }
    }

    // 4. Deterministic Price Engine Evaluation (Zero AI price hallucination)
    const userPrice = scanResult.extractedValues?.printedMrp || scanResult.extractedValues?.userQuotedPrice;

    const comparison = evaluatePriceComparison({
      userPrice,
      product: matchedProduct,
      category: matchedCategory,
      records: priceRecords,
    });

    return NextResponse.json({
      scanResult,
      comparison,
    });
  } catch (err: any) {
    console.error('Unified Scan API error:', err);
    return NextResponse.json({ error: err.message || 'Failed to process visual scan' }, { status: 500 });
  }
}

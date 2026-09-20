import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { evaluatePrice } from '@fairprice/shared';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || searchParams.get('query') || '';
    const categoryId = searchParams.get('category') || undefined;
    const activeOnly = searchParams.get('activeOnly') !== 'false';

    const products = db.searchProducts(q, categoryId);

    const results = products.map((product) => {
      const records = db.getPriceRecordsForProduct(product.id, !activeOnly);
      const conflict = db.detectPriceConflicts(product.id);
      
      // Calculate reference evaluation if first record exists
      let evaluation = null;
      if (records.length > 0) {
        evaluation = evaluatePrice(records[0].price, records);
      }

      return {
        product,
        recordsCount: records.length,
        records,
        conflict,
        evaluation,
      };
    });

    const coverageStats = db.getCoverageStats();

    return NextResponse.json({
      success: true,
      query: q,
      categoryId: categoryId || null,
      totalMatches: results.length,
      products: results,
      coverageStats,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to search prices' },
      { status: 500 }
    );
  }
}

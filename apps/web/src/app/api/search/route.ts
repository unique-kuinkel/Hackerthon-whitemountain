import { NextResponse } from 'next/server';
import { evaluatePriceComparison } from '@fairprice/shared';
import { db } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query') || '';
    const categoryId = searchParams.get('category') || undefined;
    const venueCategory = (searchParams.get('venueType') as any) || undefined;

    const products = db.searchProducts(query, categoryId);

    const items = products.map((product) => {
      const records = db.getPriceRecordsForProduct(product.id);
      const comparison = evaluatePriceComparison({
        product,
        records,
        targetVenueCategory: venueCategory,
      });

      return {
        product,
        comparison,
      };
    });

    return NextResponse.json({
      items,
      total: items.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to search prices' }, { status: 500 });
  }
}

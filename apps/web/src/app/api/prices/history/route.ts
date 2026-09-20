import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId') || searchParams.get('id') || searchParams.get('product') || '';

    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'Query parameter "productId" or "id" is required' },
        { status: 400 }
      );
    }

    const product = db.findProductById(productId);
    const history = db.getPriceHistory(productId);

    return NextResponse.json({
      success: true,
      productId,
      product: product || null,
      totalEntries: history.length,
      history,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch price history' },
      { status: 500 }
    );
  }
}

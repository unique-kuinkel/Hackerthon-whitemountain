import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { evaluatePrice } from '@fairprice/shared';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    // 1. Try finding by product ID
    let product = db.findProductById(id);
    let record = undefined;

    if (!product) {
      // 2. Try finding by price record ID
      record = db.findPriceRecordById(id);
      if (record && record.productId) {
        product = db.findProductById(record.productId);
      }
    }

    if (!product && !record) {
      return NextResponse.json(
        { success: false, error: `Price record or product with ID '${id}' not found` },
        { status: 404 }
      );
    }

    const productId = product ? product.id : record?.productId!;
    const records = db.getPriceRecordsForProduct(productId, includeInactive);
    const conflict = db.detectPriceConflicts(productId);
    const history = db.getPriceHistory(productId);

    // Calculate evaluation against all active records
    const evaluation = records.length > 0 ? evaluatePrice(records[0].price, records) : null;

    return NextResponse.json({
      success: true,
      id,
      product: product || record?.product,
      record: record || records[0],
      allRecords: records,
      conflict,
      evaluation,
      history,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch price details' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') !== 'false';

    const records = db.getAllPriceRecords(includeInactive);
    const products = db.getAllProducts();
    const sources = db.getAllSources();
    const sellers = db.getAllSellers();
    const coverageStats = db.getCoverageStats();

    return NextResponse.json({
      success: true,
      records,
      products,
      sources,
      sellers,
      coverageStats,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

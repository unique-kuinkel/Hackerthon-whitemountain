import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const source = db.findSourceById(id);

    if (!source) {
      return NextResponse.json(
        { success: false, error: `Source with ID '${id}' not found` },
        { status: 404 }
      );
    }

    const priceRecords = db.getPriceRecordsForSource(id, true);

    return NextResponse.json({
      success: true,
      source,
      totalObservations: priceRecords.length,
      priceRecords,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch source details' },
      { status: 500 }
    );
  }
}

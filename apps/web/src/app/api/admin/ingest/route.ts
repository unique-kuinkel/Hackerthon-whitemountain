import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const records = body.records || (Array.isArray(body) ? body : []);

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ error: 'Payload must contain a non-empty records array' }, { status: 400 });
    }

    const result = db.ingestBatch(records);

    return NextResponse.json({
      message: `Successfully ingested ${result.successCount} price records`,
      successCount: result.successCount,
      errors: result.errors,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed batch ingestion' }, { status: 500 });
  }
}

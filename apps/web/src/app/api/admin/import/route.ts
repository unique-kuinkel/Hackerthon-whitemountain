import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let recordsToIngest: any[] = [];

    if (contentType.includes('application/json')) {
      const body = await request.json();

      if (body.format === 'csv' && typeof body.data === 'string') {
        recordsToIngest = db.parseCSV(body.data);
      } else if (Array.isArray(body.records)) {
        recordsToIngest = body.records;
      } else if (Array.isArray(body.data)) {
        recordsToIngest = body.data;
      } else if (Array.isArray(body)) {
        recordsToIngest = body;
      } else {
        return NextResponse.json(
          { success: false, error: 'Invalid payload format. Expected array or CSV string.' },
          { status: 400 }
        );
      }
    } else if (contentType.includes('text/csv') || contentType.includes('text/plain')) {
      const text = await request.text();
      recordsToIngest = db.parseCSV(text);
    } else {
      // Fallback JSON attempt
      try {
        const text = await request.text();
        const json = JSON.parse(text);
        recordsToIngest = Array.isArray(json) ? json : json.records || json.data || [];
      } catch {
        return NextResponse.json(
          { success: false, error: 'Unsupported Content-Type. Send JSON or CSV.' },
          { status: 400 }
        );
      }
    }

    if (recordsToIngest.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid records found in payload to ingest.' },
        { status: 400 }
      );
    }

    const { successCount, errors } = db.ingestBatch(recordsToIngest);
    const updatedCoverage = db.getCoverageStats();

    return NextResponse.json({
      success: true,
      totalParsed: recordsToIngest.length,
      successCount,
      failedCount: errors.length,
      errors,
      updatedCoverage,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process import' },
      { status: 500 }
    );
  }
}

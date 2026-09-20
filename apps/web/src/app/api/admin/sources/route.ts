import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.name) {
      return NextResponse.json({ success: false, error: 'Source name is required' }, { status: 400 });
    }

    const source = db.addSource({
      name: body.name,
      url: body.url,
      sourceType: body.sourceType || 'retailer_menu',
      reliabilityScore: parseFloat(body.reliabilityScore || '0.8') || 0.8,
      retrievedAt: body.retrievedAt || new Date().toISOString(),
    });

    return NextResponse.json({ success: true, source });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

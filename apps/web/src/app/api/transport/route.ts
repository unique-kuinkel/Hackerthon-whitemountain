import { NextResponse } from 'next/server';
import { evaluateTransportQuery } from '@fairprice/shared';
import { db } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const origin = searchParams.get('origin') || '';
    const destination = searchParams.get('destination') || '';
    const date = searchParams.get('date') || undefined;
    const time = searchParams.get('time') || undefined;

    const { routes, fares } = db.findTransportFares(origin, destination);

    const result = evaluateTransportQuery({
      origin,
      destination,
      queryDate: date,
      queryTime: time,
      routes,
      fares,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Transport API error:', err);
    return NextResponse.json({ error: err.message || 'Failed to compare transport fares' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.name) {
      return NextResponse.json({ success: false, error: 'Seller name is required' }, { status: 400 });
    }

    const seller = db.addSeller({
      name: body.name,
      venueId: body.venueId,
      contactInfo: body.contactInfo,
    });

    return NextResponse.json({ success: true, seller });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

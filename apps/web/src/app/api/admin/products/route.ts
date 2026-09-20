import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.title) {
      return NextResponse.json({ success: false, error: 'Product title is required' }, { status: 400 });
    }

    const product = db.addProduct({
      title: body.title,
      description: body.description,
      categoryId: body.categoryId || 'cat_food',
      barcode: body.barcode,
      tags: body.tags ? (Array.isArray(body.tags) ? body.tags : body.tags.split(',')) : undefined,
    });

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

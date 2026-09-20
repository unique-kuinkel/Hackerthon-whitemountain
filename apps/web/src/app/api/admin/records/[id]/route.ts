import { NextResponse } from 'next/server';
import { db } from '../../../../../lib/db';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    let updated = undefined;

    if (typeof body.isActive === 'boolean') {
      updated = db.toggleRecordActiveStatus(id, body.isActive);
    }

    if (body.updates || body.price || body.priceType || body.unit) {
      const updates = body.updates || body;
      updated = db.updateRecordNormalization(id, updates);
    }

    if (!updated) {
      return NextResponse.json(
        { success: false, error: `Record with ID '${id}' not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      record: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update record' },
      { status: 500 }
    );
  }
}

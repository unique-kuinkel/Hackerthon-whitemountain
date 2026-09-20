import { NextResponse } from 'next/server';
import { evaluatePriceComparison, ReceiptItemEvaluated, ReceiptScan } from '@fairprice/shared';
import { analyzeReceiptImage } from '@/lib/ai/gemini';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { image } = body;

    if (!image) {
      return NextResponse.json({ error: 'Receipt image base64 is required' }, { status: 400 });
    }

    const rawReceipt = await analyzeReceiptImage(image);

    // Arithmetic validation check
    const arithmeticNotes: string[] = [];
    const computedSubtotal = rawReceipt.lineItems.reduce((acc: number, item: any) => acc + item.lineTotal, 0);
    const expectedTotal = computedSubtotal + rawReceipt.serviceCharge + rawReceipt.tax - rawReceipt.discount;
    const isArithmeticValid = Math.abs(expectedTotal - rawReceipt.total) < 2.0;

    if (!isArithmeticValid) {
      arithmeticNotes.push(
        `Subtotal (${computedSubtotal}) + Service (${rawReceipt.serviceCharge}) + Tax (${rawReceipt.tax}) - Discount (${rawReceipt.discount}) equals ${expectedTotal.toFixed(2)}, but total listed on bill is ${rawReceipt.total.toFixed(2)}.`
      );
    }

    // Evaluate line items against database prices
    const evaluatedItems: ReceiptItemEvaluated[] = rawReceipt.lineItems.map((item: any) => {
      const matches = db.searchProducts(item.rawName);
      const matchedProd = matches.length > 0 ? matches[0] : undefined;
      const records = matchedProd ? db.getPriceRecordsForProduct(matchedProd.id) : [];

      const comp = evaluatePriceComparison({
        userPrice: item.unitPrice,
        product: matchedProd,
        records,
      });

      let statusMsg = comp.statusMessage;
      if (comp.status === 'ABOVE_OBSERVED_RANGE') {
        statusMsg = `Unit price of NPR ${item.unitPrice} is above observed market range (NPR ${comp.minObserved} - ${comp.maxObserved}).`;
      } else if (comp.status === 'MATCHES_OFFICIAL_PRICE') {
        statusMsg = `Matches verified official price of NPR ${comp.officialReference}.`;
      } else if (comp.status === 'DIFFERS_FROM_OFFICIAL_PRICE') {
        statusMsg = `Price of NPR ${item.unitPrice} differs from available reference (NPR ${comp.officialReference}).`;
      } else if (comp.status === 'INSUFFICIENT_DATA') {
        statusMsg = 'Insufficient verified benchmark data for this specific item.';
      }

      return {
        rawName: item.rawName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
        matchedProductId: matchedProd?.id,
        matchedProductTitle: matchedProd?.title,
        status: comp.status,
        statusMessage: statusMsg,
        marketMin: comp.minObserved,
        marketMax: comp.maxObserved,
        officialReference: comp.officialReference,
      };
    });

    const receipt: ReceiptScan = {
      id: `rcpt_${Date.now()}`,
      merchantName: rawReceipt.merchant,
      scannedAt: new Date().toISOString(),
      subtotal: computedSubtotal,
      serviceCharge: rawReceipt.serviceCharge,
      taxAmount: rawReceipt.tax,
      discount: rawReceipt.discount,
      totalAmount: rawReceipt.total,
      currency: rawReceipt.currency,
      isArithmeticValid,
      arithmeticNotes,
      items: evaluatedItems,
    };

    return NextResponse.json({
      scanResult: rawReceipt,
      receipt,
    });
  } catch (err: any) {
    console.error('Receipt Scan API error:', err);
    return NextResponse.json({ error: err.message || 'Failed to analyze receipt' }, { status: 500 });
  }
}

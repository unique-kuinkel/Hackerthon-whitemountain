'use client';

import { useState, useRef } from 'react';
import { FileText, Upload, AlertCircle, CheckCircle, RefreshCw, Info } from 'lucide-react';
import { ReceiptScan } from '@fairprice/shared';

export default function ReceiptPage() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<ReceiptScan | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImagePreview(base64);
        analyzeReceipt(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeReceipt = async (base64: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/scan-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 }),
      });

      if (!res.ok) {
        throw new Error('Failed to analyze receipt');
      }

      const data = await res.json();
      setReceipt(data.receipt);
    } catch (err: any) {
      setError(err.message || 'Error parsing receipt');
    } finally {
      setLoading(false);
    }
  };

  const resetReceipt = () => {
    setImagePreview(null);
    setReceipt(null);
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">Check My Bill / Receipt</h1>
        <p className="text-sm text-slate-500">
          Upload a restaurant bill or store receipt to verify math arithmetic & compare item prices against market rates
        </p>
      </div>

      {!imagePreview ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto">
            <FileText className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900">Upload Receipt Photo</h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Snap a clear photo of your printed restaurant or retail bill
            </p>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-3 rounded-xl shadow transition-colors inline-flex items-center space-x-2"
          >
            <Upload className="w-5 h-5" />
            <span>Upload Bill Image</span>
          </button>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Left Column: Image Preview */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center">
              <img src={imagePreview} alt="Receipt preview" className="object-contain w-full h-full" />
              {loading && (
                <div className="absolute inset-0 bg-slate-900/70 flex flex-col items-center justify-center text-white space-y-3">
                  <RefreshCw className="w-8 h-8 animate-spin text-purple-400" />
                  <p className="text-sm font-semibold">Parsing bill & checking math...</p>
                </div>
              )}
            </div>

            <button
              onClick={resetReceipt}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Check Another Receipt</span>
            </button>
          </div>

          {/* Right Column: Parsed Receipt & Market Comparison */}
          <div className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 text-sm">
                {error}
              </div>
            )}

            {receipt && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                {/* Header */}
                <div className="border-b pb-4 border-slate-100 flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900">{receipt.merchantName}</h2>
                    <p className="text-xs text-slate-500">Scanned: {receipt.scannedAt.split('T')[0]}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      receipt.isArithmeticValid
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {receipt.isArithmeticValid ? 'Arithmetic Verified' : 'Math Mismatch Flagged'}
                  </span>
                </div>

                {/* Arithmetic warning if mismatch */}
                {!receipt.isArithmeticValid && receipt.arithmeticNotes && (
                  <div className="bg-red-50 p-4 rounded-xl border border-red-200 text-xs text-red-800 space-y-1">
                    <p className="font-bold flex items-center space-x-1">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <span>Arithmetic Discrepancy Detected</span>
                    </p>
                    {receipt.arithmeticNotes.map((note, idx) => (
                      <p key={idx}>{note}</p>
                    ))}
                  </div>
                )}

                {/* Line Items Breakdown */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-900">Line Items & Market Price Status</h3>

                  <div className="space-y-3">
                    {receipt.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-2"
                      >
                        <div className="flex justify-between items-start font-semibold text-slate-900">
                          <span>
                            {item.quantity}x {item.rawName}
                          </span>
                          <span>NPR {item.lineTotal.toLocaleString()}</span>
                        </div>

                        <div className="flex justify-between text-slate-500 text-[11px]">
                          <span>Unit Price: NPR {item.unitPrice}</span>
                          {item.marketMin && item.marketMax && (
                            <span>Observed Market: NPR {item.marketMin} – {item.marketMax}</span>
                          )}
                        </div>

                        {/* Status Label (Neutral Language) */}
                        <div
                          className={`p-2 rounded-lg text-[11px] font-medium flex items-center space-x-1.5 ${
                            item.status === 'MATCHES_OFFICIAL_PRICE' || item.status === 'WITHIN_OBSERVED_RANGE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.status === 'ABOVE_OBSERVED_RANGE' || item.status === 'DIFFERS_FROM_OFFICIAL_PRICE'
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          <Info className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{item.statusMessage}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Receipt Totals Summary */}
                <div className="border-t pt-4 border-slate-100 space-y-2 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>NPR {receipt.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Service Charge:</span>
                    <span>NPR {receipt.serviceCharge.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax / VAT:</span>
                    <span>NPR {receipt.taxAmount.toLocaleString()}</span>
                  </div>
                  {receipt.discount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Discount:</span>
                      <span>-NPR {receipt.discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-extrabold text-slate-900 border-t pt-2">
                    <span>Total Charged:</span>
                    <span>NPR {receipt.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

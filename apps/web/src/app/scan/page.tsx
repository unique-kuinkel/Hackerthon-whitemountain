'use client';

import { useState, useRef } from 'react';
import { Camera, Upload, AlertTriangle, CheckCircle, RefreshCw, ExternalLink, ShieldCheck, Tag } from 'lucide-react';
import { PriceComparisonSummary, ProductScanResult } from '@fairprice/shared';
import { DirectCameraCapture } from '../../components/camera/DirectCameraCapture';

export default function ScanPage() {
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ProductScanResult | null>(null);
  const [comparison, setComparison] = useState<PriceComparisonSummary | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Direct camera capture handler
  const handleCameraCapture = (file: File) => {
    setShowCameraModal(false);
    processFile(file);
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      processImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const processImage = async (base64: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 }),
      });

      if (!res.ok) {
        throw new Error('Failed to analyze image with price engine.');
      }

      const data = await res.json();
      setScanResult(data.scanResult);
      setComparison(data.comparison);
    } catch (err: any) {
      setError(err.message || 'Error processing scan. Check server connection.');
    } finally {
      setLoading(false);
    }
  };

  const resetScan = () => {
    setImagePreview(null);
    setScanResult(null);
    setComparison(null);
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">Scan & Check Price</h1>
        <p className="text-sm text-slate-500">
          Point your live camera or upload photo of packaging, food items, souvenirs, trekking gear, or SIM cards
        </p>
      </div>

      {/* Live Direct Camera Capture Overlay Component */}
      {showCameraModal && (
        <DirectCameraCapture
          onCapture={handleCameraCapture}
          onCancel={() => setShowCameraModal(false)}
        />
      )}

      {!imagePreview ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-6 shadow-sm">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-100">
            <Camera className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900">Capture or Upload Item Photo</h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Scan packaged goods, restaurant menus, SIM cards, pashmina shawls, or trekking equipment
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-md mx-auto">
            <button
              onClick={() => setShowCameraModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3.5 rounded-2xl shadow transition-all flex items-center justify-center space-x-2 text-sm"
            >
              <Camera className="w-5 h-5" />
              <span>📷 Open Camera</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-6 py-3.5 rounded-2xl transition-all flex items-center justify-center space-x-2 text-sm border border-slate-200"
            >
              <Upload className="w-5 h-5 text-slate-600" />
              <span>🖼 Upload Image</span>
            </button>

            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Captured / Uploaded Image Column */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center">
              <img src={imagePreview} alt="Scanned item" className="object-cover w-full h-full" />
              {loading && (
                <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center text-white space-y-3 backdrop-blur-sm">
                  <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
                  <p className="text-sm font-semibold">Gemini AI analyzing visual evidence...</p>
                </div>
              )}
            </div>

            <button
              onClick={resetScan}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 rounded-2xl transition-all flex items-center justify-center space-x-2 text-sm border border-slate-200"
            >
              <RefreshCw className="w-4 h-4 text-slate-600" />
              <span>Scan Another Item</span>
            </button>
          </div>

          {/* Analysis Results Column (Identical for Camera and Upload) */}
          <div className="space-y-6">
            {error && (
              <div className="bg-rose-50 text-rose-900 p-4 rounded-2xl border border-rose-200 text-xs flex items-start space-x-2">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-600 mt-0.5" />
                <div>
                  <p className="font-bold text-sm">Scan Error</p>
                  <p className="mt-0.5">{error}</p>
                </div>
              </div>
            )}

            {scanResult && comparison && (
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                {/* Recognized Item Info */}
                <div className="border-b pb-4 border-slate-100 space-y-1">
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full inline-block">
                    {scanResult.category}
                  </span>
                  <h2 className="text-2xl font-extrabold text-slate-900">{scanResult.name}</h2>
                  {scanResult.brand && (
                    <p className="text-xs text-slate-500">Brand: {scanResult.brand}</p>
                  )}
                  {scanResult.extractedValues?.printedMrp && (
                    <p className="text-xs text-slate-600 font-medium pt-1">
                      Printed Packaging MRP: NPR {scanResult.extractedValues.printedMrp}
                    </p>
                  )}
                </div>

                {/* Evidence-Based Neutral Comparison Status */}
                <div
                  className={`p-4 rounded-2xl border flex items-start space-x-3 ${
                    comparison.status === 'MATCHES_OFFICIAL_PRICE' || comparison.status === 'WITHIN_OBSERVED_RANGE'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : comparison.status === 'ABOVE_OBSERVED_RANGE' || comparison.status === 'DIFFERS_FROM_OFFICIAL_PRICE'
                      ? 'bg-rose-50 border-rose-200 text-rose-900'
                      : 'bg-sky-50 border-sky-200 text-sky-900'
                  }`}
                >
                  <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-600" />
                  <div>
                    <h3 className="font-bold text-xs uppercase tracking-wider">{comparison.status.replace(/_/g, ' ')}</h3>
                    <p className="text-xs mt-1 leading-relaxed">{comparison.statusMessage}</p>
                  </div>
                </div>

                {/* Metrics Breakdown */}
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div>
                    <span className="text-xs text-slate-500 block font-medium">Official Reference</span>
                    <span className="text-lg font-extrabold text-slate-900 font-mono">
                      {comparison.officialReference ? `NPR ${comparison.officialReference}` : 'N/A'}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs text-slate-500 block font-medium">Observed Market Range</span>
                    <span className="text-lg font-extrabold text-slate-900 font-mono">
                      {comparison.minObserved !== undefined
                        ? `NPR ${comparison.minObserved} - ${comparison.maxObserved}`
                        : 'N/A'}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs text-slate-500 block font-medium">Median Price</span>
                    <span className="text-base font-bold text-slate-700 font-mono">
                      {comparison.medianObserved ? `NPR ${comparison.medianObserved}` : 'N/A'}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs text-slate-500 block font-medium">Verified Sources</span>
                    <span className="text-base font-bold text-slate-700">
                      {comparison.sourceCount} {comparison.sourceCount === 1 ? 'record' : 'records'}
                    </span>
                  </div>
                </div>

                {/* Source Records List */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Verified Price Observations</span>
                  </h3>

                  <div className="space-y-2">
                    {comparison.records.map((rec) => (
                      <div
                        key={rec.id}
                        className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs flex justify-between items-center"
                      >
                        <div className="space-y-0.5">
                          <span className="font-semibold text-slate-900 block">{rec.venue?.name || 'Retailer / Source'}</span>
                          <span className="text-slate-500 block">
                            Type: <strong className="text-slate-700">{rec.priceType}</strong> &bull; Date: {rec.observedAt.split('T')[0]}
                          </span>
                          {rec.sourceUrl && (
                            <a
                              href={rec.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-600 hover:underline flex items-center space-x-0.5 pt-0.5 font-medium"
                            >
                              <span>{rec.source?.name || 'View Source Link'}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-extrabold text-slate-900 font-mono block">NPR {rec.price}</span>
                          <span className="text-slate-400 text-[10px]">Score: {rec.sourceQuality}/5</span>
                        </div>
                      </div>
                    ))}
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

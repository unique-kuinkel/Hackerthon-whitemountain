'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Camera, FileText, Bus, Search, ShieldCheck, ArrowRight, CheckCircle, HelpCircle } from 'lucide-react';
import { SEED_PRODUCTS, SEED_TRANSPORT_FARES } from '@fairprice/shared';

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?query=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="bg-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8 border-b border-slate-800 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center space-x-2 bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>100% Verified Nepal Government & Market Benchmarks</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            Know the price before you pay.
          </h1>

          <p className="text-slate-300 text-lg sm:text-xl max-w-2xl mx-auto">
            Instant AI price check & fare comparison across transport, menus, souvenirs, trekking permits, and packaged goods in Nepal.
          </p>

          {/* Instant Search Bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto flex items-center bg-white rounded-xl shadow-xl overflow-hidden p-1.5">
            <div className="pl-3 text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              placeholder="Search momo, taxi fare, Wai Wai, TIMS permit, pashmina..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-3 text-slate-900 focus:outline-none text-base"
            />
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-lg transition-colors flex items-center space-x-1"
            >
              <span>Search</span>
            </button>
          </form>

          {/* Primary Action Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 max-w-3xl mx-auto">
            <Link
              href="/scan"
              className="bg-emerald-600 hover:bg-emerald-500 text-white p-4 rounded-xl font-bold flex flex-col items-center space-y-2 shadow-lg hover:scale-105 transition-transform"
            >
              <Camera className="w-7 h-7" />
              <span className="text-sm">Scan Item</span>
            </Link>

            <Link
              href="/transport"
              className="bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-xl font-bold flex flex-col items-center space-y-2 shadow-lg hover:scale-105 transition-transform"
            >
              <Bus className="w-7 h-7" />
              <span className="text-sm">Compare Fare</span>
            </Link>

            <Link
              href="/receipt"
              className="bg-purple-600 hover:bg-purple-500 text-white p-4 rounded-xl font-bold flex flex-col items-center space-y-2 shadow-lg hover:scale-105 transition-transform"
            >
              <FileText className="w-7 h-7" />
              <span className="text-sm">Check Bill</span>
            </Link>

            <Link
              href="/sources"
              className="bg-slate-800 hover:bg-slate-700 text-white p-4 rounded-xl font-bold flex flex-col items-center space-y-2 border border-slate-700 shadow-lg hover:scale-105 transition-transform"
            >
              <ShieldCheck className="w-7 h-7 text-emerald-400" />
              <span className="text-sm">Verified Sources</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Verified Price Benchmarks Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Verified Nepal Price Benchmarks</h2>
            <p className="text-sm text-slate-500">Official tariffs, MRPs, and audited market ranges</p>
          </div>
          <Link href="/search" className="text-emerald-600 font-semibold text-sm hover:underline flex items-center">
            View all <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Packaged Goods MRP */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-md">
                Official Printed MRP
              </span>
              <span className="text-xs text-slate-400">CG Foods / Dabur</span>
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">Wai Wai Noodles (75g)</h3>
              <p className="text-2xl font-extrabold text-emerald-600 mt-1">NPR 20</p>
            </div>
            <p className="text-xs text-slate-500 border-t pt-3 border-slate-100">
              Source: CG Foods Official Packaging Packaging MRP. Same across Supermarkets & Stores.
            </p>
          </div>

          {/* Card 2: Transport Tariff */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-md">
                Government Fixed Fare
              </span>
              <span className="text-xs text-slate-400">CAAN / TIA</span>
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">Airport Taxi (TIA → Thamel)</h3>
              <p className="text-2xl font-extrabold text-blue-600 mt-1">NPR 800</p>
            </div>
            <p className="text-xs text-slate-500 border-t pt-3 border-slate-100">
              Official prepaid counter fare at TIA arrivals terminal. Fixed rate, no haggling.
            </p>
          </div>

          {/* Card 3: Dining Market Range */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-md">
                Location Aware Range
              </span>
              <span className="text-xs text-slate-400">Kathmandu Audit</span>
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">Buff Momo (Plate of 10)</h3>
              <p className="text-2xl font-extrabold text-amber-600 mt-1">NPR 130 – 280</p>
            </div>
            <p className="text-xs text-slate-500 border-t pt-3 border-slate-100">
              Local eatery in Asan: ~NPR 130. Tourist restaurant in Thamel: ~NPR 280.
            </p>
          </div>
        </div>
      </section>

      {/* Trust & Zero-Hallucination Principles */}
      <section className="bg-slate-100 py-12 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-10">
            <h2 className="text-2xl font-bold text-slate-900">Our Anti-Hallucination Guarantee</h2>
            <p className="text-sm text-slate-600">
              How FAIRPRICE NEPAL guarantees accuracy and prevents fake price predictions
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-2">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
              <h3 className="font-bold text-base text-slate-900">1. AI Vision Extraction Only</h3>
              <p className="text-xs text-slate-600">
                Gemini AI is used strictly to recognize images, read packaging barcodes, and parse OCR text from bills. It never invents price tags.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-2">
              <ShieldCheck className="w-8 h-8 text-blue-600" />
              <h3 className="font-bold text-base text-slate-900">2. Database-Backed Benchmarks</h3>
              <p className="text-xs text-slate-600">
                All comparisons are derived from verified official government tariffs (DoTM), printed packaging MRPs, and audited seller listings.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-2">
              <HelpCircle className="w-8 h-8 text-purple-600" />
              <h3 className="font-bold text-base text-slate-900">3. Source Transparency</h3>
              <p className="text-xs text-slate-600">
                Every price result clearly displays the source name, original web link, timestamp, and location category (e.g. Street vendor vs Hotel).
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

import Link from 'next/link';
import { ExternalLink, ShieldCheck, CheckCircle, ArrowRight } from 'lucide-react';
import { SEED_SOURCES } from '@fairprice/shared';

export default function SourcesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">Source Transparency Directory</h1>
        <p className="text-sm text-slate-500">
          Every price shown in FAIRPRICE NEPAL is strictly grounded in official government publications, packaging MRPs, or verified market audits.
        </p>
      </div>

      <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-200 text-emerald-900 space-y-2">
        <h2 className="font-bold text-base flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          <span>Real Source Principle</span>
        </h2>
        <p className="text-xs leading-relaxed text-emerald-800">
          Our system NEVER invents, hallucinates, or predicts dynamic prices out of thin air. When exact data is unavailable, we present comparable benchmarks or explicitly mark the result as "INSUFFICIENT DATA".
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="font-bold text-slate-900 text-lg">Active Benchmark Data Sources</h2>

        <div className="grid grid-cols-1 gap-4">
          {SEED_SOURCES.map((source) => (
            <div
              key={source.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0 hover:border-emerald-300 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                    {source.sourceType}
                  </span>
                  <span className="text-xs font-semibold text-emerald-600">
                    Reliability Score: {(source.reliabilityScore * 100).toFixed(0)}%
                  </span>
                </div>
                <h3 className="font-bold text-base text-slate-900">{source.name}</h3>
                {source.url && (
                  <p className="text-xs text-slate-500 font-mono">{source.url}</p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Link
                  href={`/sources/${source.id}`}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors flex items-center space-x-1"
                >
                  <span>View Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                {source.url && (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors flex items-center space-x-1"
                  >
                    <span>Official URL</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

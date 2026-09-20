'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Camera, FileText, Bus, Search, Database, ShieldCheck } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/scan', label: 'Scan & Check', icon: Camera },
    { href: '/transport', label: 'Transport Fares', icon: Bus },
    { href: '/receipt', label: 'Check Bill', icon: FileText },
    { href: '/search', label: 'Search', icon: Search },
    { href: '/sources', label: 'Sources', icon: ShieldCheck },
    { href: '/admin', label: 'Admin', icon: Database },
  ];

  return (
    <header className="bg-slate-900 text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-xl text-white shadow-lg group-hover:scale-105 transition-transform">
              FP
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-white block">FAIRPRICE NEPAL</span>
              <span className="text-xs text-emerald-400 block font-medium">Know the price before you pay</span>
            </div>
          </Link>

          <nav className="hidden md:flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="md:hidden flex items-center space-x-2">
            <Link
              href="/scan"
              className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center space-x-1"
            >
              <Camera className="w-4 h-4" />
              <span>Scan</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Nav strip */}
      <div className="md:hidden border-t border-slate-800 bg-slate-900 px-2 py-2 flex justify-around text-xs">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-1 px-2 rounded ${
                isActive ? 'text-emerald-400 font-bold' : 'text-slate-400'
              }`}
            >
              {Icon && <Icon className="w-4 h-4 mb-0.5" />}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}

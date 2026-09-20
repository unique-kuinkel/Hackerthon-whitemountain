import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'FAIRPRICE NEPAL - Know the price before you pay',
  description: 'Verified price comparison, transport tariffs, and receipt checker for tourists and locals in Nepal.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="bg-slate-900 text-slate-400 py-8 border-t border-slate-800 text-xs">
          <div className="max-w-7xl mx-auto px-4 text-center space-y-2">
            <p className="font-semibold text-slate-300">FAIRPRICE NEPAL &copy; 2026</p>
            <p>
              Prices powered strictly by official government tariffs (DoTM, CAAN, NTB), printed MRPs, and verified market audits. Zero AI price hallucination.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}

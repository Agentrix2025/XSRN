import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'XSRN Dashboard - X402 Service Routing Network',
  description: 'Manage rewards, view epochs, and participate in the XSRN protocol',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-900">
        <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm fixed w-full z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold gradient-text">XSRN</span>
                <span className="text-slate-400 text-sm">Dashboard</span>
              </div>
              <div className="flex items-center gap-4">
                <a href="/" className="text-slate-300 hover:text-white transition-colors">
                  Overview
                </a>
                <a href="/rewards" className="text-slate-300 hover:text-white transition-colors">
                  Rewards
                </a>
                <a href="/attestations" className="text-slate-300 hover:text-white transition-colors">
                  Attestations
                </a>
                <button className="btn-primary">
                  Connect Wallet
                </button>
              </div>
            </div>
          </div>
        </nav>
        <main className="pt-20">
          {children}
        </main>
      </body>
    </html>
  );
}

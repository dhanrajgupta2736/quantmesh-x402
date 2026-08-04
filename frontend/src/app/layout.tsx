import './globals.css';
import { Providers } from './providers';

export const metadata = {
  title: 'QuantMesh x402 | Decentralized Market Signal Terminal',
  description: 'x402 Micropayment Orchestration on Algorand Testnet',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

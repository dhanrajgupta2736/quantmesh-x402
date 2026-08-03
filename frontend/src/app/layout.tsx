import './globals.css';
import { Providers } from './providers';

export const metadata = {
  title: 'QuantMesh x402 | Decentralized Market Signal Terminal',
  description: 'x402 Micropayment Orchestration on Algorand Testnet',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

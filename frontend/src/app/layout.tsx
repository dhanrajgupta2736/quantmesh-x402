import './globals.css';
import { Providers } from './providers';

export const metadata = {
  title: 'QuantMesh x402 | Decentralized AI Signal Terminal',
  description: 'AI-Powered Micropayment Signal Orchestration on Algorand Testnet — 4-Agent Consensus Engine with x402 Protocol',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body className="bg-[var(--bg-main)] text-[var(--text-secondary)] antialiased min-h-screen selection:bg-[var(--accent)]/20 selection:text-[var(--accent)] bg-aurora-mesh">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

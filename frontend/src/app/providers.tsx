'use client';

import React from 'react';
import { NetworkId, WalletManager, WalletId } from '@txnlab/use-wallet-react';
import { WalletProvider } from '@txnlab/use-wallet-react';

const walletManager = new WalletManager({
  wallets: [
    WalletId.LUTE,
  ],
  defaultNetwork: NetworkId.TESTNET,
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WalletProvider manager={walletManager}>
      {children}
    </WalletProvider>
  );
}

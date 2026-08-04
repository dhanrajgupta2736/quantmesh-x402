import crypto from 'crypto';

/**
 * Computes a deterministic SHA-256 cryptographic box storage hash 
 * for signal attestation on Algorand Testnet.
 * 
 * Format: sha256(tokenSymbol:compositeScore:verdict:paymentTxId:timestamp)
 */
export function computeBoxStorageHash(
  tokenSymbol: string,
  compositeScore: number,
  verdict: string,
  paymentTxId: string
): { boxStorageHash: string; timestamp: number } {
  const timestamp = Math.floor(Date.now() / 1000);
  const rawPayload = `${tokenSymbol.toUpperCase()}:${compositeScore}:${verdict}:${paymentTxId}:${timestamp}`;
  const boxStorageHash = crypto.createHash('sha256').update(rawPayload).digest('hex');
  return { boxStorageHash, timestamp };
}

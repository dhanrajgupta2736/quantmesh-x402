import crypto from 'crypto';

/**
 * Computes a deterministic SHA-256 cryptographic attestation digest
 * anchoring fused market signals to an on-chain Algorand payment transaction ID.
 * 
 * Format: sha256(tokenSymbol:compositeScore:verdict:paymentTxId:timestamp)
 */
export function computeAttestationHash(
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

// Backward compatibility export
export const computeBoxStorageHash = computeAttestationHash;

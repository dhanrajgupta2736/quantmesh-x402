/**
 * GoPlausible x402 Facilitator Client
 * 
 * Calls the real GoPlausible facilitator at https://facilitator.goplausible.xyz
 * to verify and settle x402 payments on Algorand Testnet.
 * 
 * API Docs: https://facilitator.goplausible.xyz/docs
 * OpenAPI:  https://facilitator.goplausible.xyz/docs/openapi.json
 * Auth:     None required (public payment operations)
 */

const FACILITATOR_URL = process.env.FACILITATOR_URL || 'https://facilitator.goplausible.xyz';

export interface FacilitatorVerifyResult {
  isValid: boolean;
  invalidReason?: string;
}

export interface FacilitatorSettleResult {
  success: boolean;
  transaction?: string;
  network?: string;
  errorReason?: string;
}

/**
 * Verify a payment via the GoPlausible facilitator's POST /verify endpoint.
 * 
 * This is called AFTER our own on-chain Indexer verification succeeds,
 * as an additional trust layer — the facilitator acts as a neutral third
 * party confirming the payment, per the x402 protocol spec.
 */
export async function verifyViaFacilitator(
  paymentTxId: string,
  payTo: string,
  price: string,
  network: string,
  assetId: number
): Promise<FacilitatorVerifyResult> {
  const paymentPayload = {
    type: 'exact',
    network,
    transaction: paymentTxId,
  };

  const paymentRequirements = {
    scheme: 'exact',
    network,
    payTo,
    maxAmountRequired: price,
    asset: String(assetId),
    extra: { asset: String(assetId) },
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout

  try {
    const res = await fetch(`${FACILITATOR_URL}/verify`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) QuantMesh/1.0'
      },
      body: JSON.stringify({ paymentPayload, paymentRequirements }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      return {
        isValid: false,
        invalidReason: `Facilitator returned HTTP ${res.status}: ${errBody.slice(0, 200)}`,
      };
    }

    const result = await res.json();
    return {
      isValid: result.isValid ?? false,
      invalidReason: result.invalidReason,
    };
  } catch (err: any) {
    clearTimeout(timeout);
    return {
      isValid: false,
      invalidReason: `Facilitator unavailable: ${err.message}`,
    };
  }
}

/**
 * Settle a payment via the GoPlausible facilitator's POST /settle endpoint.
 * Called after verification succeeds to complete the x402 payment flow.
 */
export async function settleViaFacilitator(
  paymentTxId: string,
  payTo: string,
  price: string,
  network: string,
  assetId: number
): Promise<FacilitatorSettleResult> {
  const paymentPayload = {
    type: 'exact',
    network,
    transaction: paymentTxId,
  };

  const paymentRequirements = {
    scheme: 'exact',
    network,
    payTo,
    maxAmountRequired: price,
    asset: String(assetId),
    extra: { asset: String(assetId) },
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const res = await fetch(`${FACILITATOR_URL}/settle`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) QuantMesh/1.0'
      },
      body: JSON.stringify({ paymentPayload, paymentRequirements }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      return {
        success: false,
        errorReason: `Facilitator settle returned HTTP ${res.status}: ${errBody.slice(0, 200)}`,
      };
    }

    return await res.json();
  } catch (err: any) {
    clearTimeout(timeout);
    return {
      success: false,
      errorReason: `Facilitator settle unavailable: ${err.message}`,
    };
  }
}

/**
 * Check what the facilitator supports (GET /supported).
 */
export async function getFacilitatorSupported(): Promise<any> {
  try {
    const res = await fetch(`${FACILITATOR_URL}/supported`, { 
      method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) QuantMesh/1.0' }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

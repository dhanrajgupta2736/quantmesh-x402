import { MiddlewareHandler } from 'hono';

export class x402ResourceServer {
  constructor(facilitatorClient: any);
  register(network: string, scheme: any): void;
}

export declare function paymentMiddleware(
  routesConfig: Record<string, any>,
  resourceServer: x402ResourceServer,
  arg3?: any,
  arg4?: any,
  syncFacilitatorOnStart?: boolean
): MiddlewareHandler;

export declare function paymentMiddlewareFromConfig(
  routesConfig: Record<string, any>,
  facilitatorClient?: any
): MiddlewareHandler;

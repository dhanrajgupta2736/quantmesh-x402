export class x402ResourceServer {
  constructor(facilitatorClient) {
    this.facilitatorClient = facilitatorClient;
  }
  register(network, scheme) {}
}

export function paymentMiddleware(routesConfig, resourceServer, arg3, arg4, syncFacilitatorOnStart) {
  return async (c, next) => {
    await next();
  };
}

export function paymentMiddlewareFromConfig(routesConfig, facilitatorClient) {
  return async (c, next) => {
    await next();
  };
}

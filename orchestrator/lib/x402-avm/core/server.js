export class HTTPFacilitatorClient {
  constructor(options) {
    this.url = typeof options === 'string' ? options : options?.url;
  }
  async getSupported() {
    return {
      kinds: [{ scheme: 'exact', network: 'algorand:testnet' }]
    };
  }
}

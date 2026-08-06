export class HTTPFacilitatorClient {
  url?: string;
  constructor(options: { url: string });
  getSupported?(): Promise<any>;
}

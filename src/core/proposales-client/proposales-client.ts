import { z } from 'zod';
import {
  ProposalesProduct, CreateProductPayload,
  CreateProductPayloadSchema, CreateProductResponseSchema, GetProductsResponseSchema
} from './proposales-client.schemas';

export class ProposalesClient {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.proposales.com';

  constructor(apiKey: string | undefined) {
    if (!apiKey) throw new Error('API key is missing.');
    this.apiKey = apiKey;
  }

  private async _fetch(endpoint: string, options: RequestInit = {}): Promise<any> {
    const headers = { 'Authorization': `Bearer ${this.apiKey}`, 'Content-Type': 'application/json', 'Accept': 'application/json' };
    const response = await fetch(`${this.baseUrl}${endpoint}`, { ...options, headers });
    if (!response.ok) {
        const errorBody = await response.text();
        console.error(`API request failed: ${response.status}`, errorBody);
        throw new Error(`API request to ${endpoint} failed with status ${response.status}`);
    }
    if (response.status === 204) return null;
    return response.json();
  }

  public async getProducts(): Promise<ProposalesProduct[]> {
    const responseData = await this._fetch('/v3/content');
    const parsedResponse = GetProductsResponseSchema.parse(responseData);
    return parsedResponse.data;
  }
  
  public async createProduct(payload: CreateProductPayload) {
    const validatedPayload = CreateProductPayloadSchema.parse(payload);
    const responseData = await this._fetch('/v3/content', {
      method: 'POST',
      body: JSON.stringify(validatedPayload)
    });
    return CreateProductResponseSchema.parse(responseData);
  }
}
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export interface OrderEvent {
  productCode: string;
  eventTime: string;
  grossAmount: number;
  discount: number;
  netAmount: number;
  partnerId: string;
  sequenceNumber: number;
  receivedTime: string;
  streamOffset: number;
  processedTime: string;
}

export interface MonthlySummary {
  totalGross: number;
  totalDiscount: number;
  totalNet: number;
  orderCount: number;
}

export interface ErrorEvent {
  partnerId: string;
  rawPayload: unknown;
  receivedTime: string;
  validationErrors: string[];
}

export const api = {
  getOrders: async (partnerId?: string, from?: string, to?: string) => {
    const params: Record<string, string> = {};
    if (partnerId) params.partnerId = partnerId;
    if (from) params.from = from;
    if (to) params.to = to;
    
    const response = await client.get('/api/orders', { params });
    return response.data.orders as OrderEvent[];
  },

  getMonthlySummary: async (partnerId: string, month: string) => {
    const response = await client.get('/api/orders/summary/monthly', {
      params: { partnerId, month }
    });
    return response.data as MonthlySummary;
  },

  getErrors: async (partnerId?: string, from?: string, to?: string) => {
    const params: Record<string, string> = {};
    if (partnerId) params.partnerId = partnerId;
    if (from) params.from = from;
    if (to) params.to = to;
    
    const response = await client.get('/api/errors', { params });
    return response.data.errors as ErrorEvent[];
  }
};

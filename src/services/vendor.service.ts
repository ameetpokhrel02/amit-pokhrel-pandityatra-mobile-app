// vendor.service.ts
import { api, publicApi } from './api-client';

// ─── Types ────────────────────────────────────────────────────────

export interface VendorProfile {
  id: number;
  email: string;
  full_name: string;
  shop_name: string;
  business_type: string;
  address: string;
  city: string;
  bank_account_number: string;
  bank_name: string;
  account_holder_name: string;
  is_verified: boolean;
  balance: string;
  bio: string | null;
  created_at: string;
}

export interface VendorStats {
  total_revenue: number;
  total_orders: number;
  total_products: number;
  low_stock_count: number;
  current_balance: string;
  total_withdrawn: number;
}

export interface VendorProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  stock_quantity: number;
  category?: number;
  image?: string;
  is_approved: boolean;
  vendor?: number;
}

export interface VendorOrderItem {
  id: number;
  item_name: string;
  quantity: number;
  price_at_purchase: string;
}

export interface VendorOrder {
  id: number;
  customer_name: string;
  customer_email: string;
  total_amount: string;
  status: string;
  shipping_address: string;
  city: string;
  phone_number: string;
  items: VendorOrderItem[];
  created_at: string;
}

export interface VendorPayout {
  id: number;
  amount: string;
  status: 'PENDING' | 'PAID' | 'REJECTED';
  transaction_id: string | null;
  requested_at: string;
  paid_at: string | null;
}

export interface VendorRegisterPayload {
  email: string;
  password: string;
  full_name: string;
  phone_number: string;
  shop_name: string;
  business_type: string;
  address: string;
  city: string;
  bank_account_number: string;
  bank_name: string;
  account_holder_name: string;
}

// ─── Auth ────────────────────────────────────────────────────────

export const registerVendor = (data: VendorRegisterPayload) =>
  publicApi.post('v-admin/register/', data);

// ─── Profile & Stats ─────────────────────────────────────────────

export const getVendorProfile = () => api.get('v-admin/');
export const getVendorStats = () => api.get('v-admin/stats/');

// ─── Products ────────────────────────────────────────────────────

export const listVendorProducts = () => api.get('v-admin/products/');
export const getVendorProduct = (id: number) => api.get(`v-admin/products/${id}/`);
export const createProduct = (data: FormData | object) =>
  api.post('v-admin/products/', data, {
    headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
  });
export const updateProduct = (id: number, data: FormData | object) =>
  api.patch(`v-admin/products/${id}/`, data, {
    headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
  });
export const deleteProduct = (id: number) => api.delete(`v-admin/products/${id}/`);

// ─── Orders ──────────────────────────────────────────────────────

export const listVendorOrders = () => api.get('v-admin/orders/');
export const getVendorOrder = (id: number) => api.get(`v-admin/orders/${id}/`);
export const updateOrderStatus = (id: number, status: 'SHIPPED' | 'DELIVERED') =>
  api.post(`v-admin/orders/${id}/update_status/`, { status });

// ─── Payouts ─────────────────────────────────────────────────────

export const listPayouts = () => api.get('v-admin/payouts/');
export const requestPayout = (amount: number) => api.post('v-admin/payouts/', { amount });

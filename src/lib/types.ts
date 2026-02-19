export type ProductType = 'single' | 'combo_individual' | 'combo_couple';

export interface Product {
  id: ProductType;
  name: string;
  description: string;
  price: number;
  icon: string;
  popular?: boolean;
}

export interface Seller {
  id: string;
  name: string;
  active: boolean;
  total_sales: number;
  created_at: string;
}

export interface Order {
  id: string;
  order_code: string;
  customer_name: string;
  customer_whatsapp: string;
  seller_id: string | null;
  product_type: ProductType;
  product_name: string;
  price: number;
  status: 'pending' | 'paid' | 'cancelled' | 'used';
  receipt_url: string | null;
  used_at: string | null;
  created_at: string;
}

export interface Settings {
  id: string;
  key: string;
  value: string;
  updated_at: string;
}

export const PRODUCTS: Product[] = [
  {
    id: 'combo_individual',
    name: 'Combo Individual',
    description: 'Ingresso + Pipoca + Refri',
    price: 10.00,
    icon: '🍿',
    popular: true,
  },
];

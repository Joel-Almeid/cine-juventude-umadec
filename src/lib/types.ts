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
    id: 'single',
    name: 'Ingresso Avulso',
    description: '1 Ingresso para o evento',
    price: 5.00,
    icon: '🎟️',
  },
  {
    id: 'combo_individual',
    name: 'Combo Individual',
    description: 'Ingresso + Pipoca + Refrigerante',
    price: 10.00,
    icon: '🍿',
    popular: true,
  },
  {
    id: 'combo_couple',
    name: 'Combo Casal',
    description: '2 Ingressos + Pipoca G + 2 Refrigerantes',
    price: 18.00,
    icon: '💑',
  },
];

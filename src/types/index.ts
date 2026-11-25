export interface StoreSettings {
  store_name: string;
  slogan: string;
  logo_url: string;
  hero_title: string;
  hero_subtitle: string;
  hero_image: string;
  brand_story_title: string;
  brand_story_content: string;
  brand_story_image: string;
  address: string;
  phone: string;
  zalo: string;
  facebook: string;
  map_embed: string;
  opening_hours: Record<string, { open: string; close: string; isOpen: boolean }> | string;
  is_online_ordering_enabled: string;
  is_paused: string;
  allow_pickup: string;
  allow_delivery: string;
  prep_time_min: string;
  prep_time_max: string;
  bank_name: string;
  bank_account: string;
  bank_owner: string;
  vietqr_memo_prefix: string;
  min_order_value: string;
  is_configured: string;
  store_lat?: string;
  store_lng?: string;
  base_shipping_fee?: string;
  base_shipping_km?: string;
  fee_per_km?: string;
  max_delivery_km?: string;
  google_map_url?: string;
  privacy_policy?: string;
  delivery_policy?: string;
  cancel_policy?: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  display_order: number;
  is_active: number;
}

export interface Product {
  id: number;
  category_id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  original_price: number | null;
  image_url: string;
  is_featured: number;
  is_available: number;
  display_order: number;
}

export interface Topping {
  id: number;
  name: string;
  price: number;
  is_available: number;
}

export interface Combo {
  id: number;
  name: string;
  description: string;
  price: number;
  original_price: number | null;
  image_url: string;
  items_json: string;
  is_available: number;
}

export interface Promotion {
  id: number;
  code: string;
  title: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  min_order_value: number;
  max_discount: number | null;
  max_uses: number;
  used_count: number;
  start_date: string | null;
  end_date: string | null;
  is_active: number;
}

export interface DeliveryZone {
  id: number;
  zone_name: string;
  fee: number;
  min_order: number;
  estimated_time: string;
  is_active: number;
}

export interface CartItem {
  id: string; // unique item id in cart (product_id + toppings combo)
  product_id: number;
  name: string;
  price: number;
  base_price: number;
  image_url: string;
  quantity: number;
  toppings: Topping[];
  note: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
  toppings_json: string;
  toppings?: Topping[];
  note: string;
}

export interface OrderHistoryItem {
  id: number;
  order_id: number;
  from_status: string | null;
  to_status: string;
  note: string;
  updated_by: string;
  created_at: string;
}

export interface Order {
  id: number;
  order_code: string;
  tracking_token: string;
  customer_name: string;
  customer_phone: string;
  order_type: 'pickup' | 'delivery';
  address: string | null;
  address_note: string | null;
  distance_km?: number;
  customer_lat?: number;
  customer_lng?: number;
  delivery_zone_id?: number | null;
  pickup_time: string | null;
  order_note: string | null;
  payment_method: 'cod' | 'transfer';
  payment_status: 'unpaid' | 'verified' | 'paid';
  status: 'new' | 'confirmed' | 'preparing' | 'delivering' | 'completed' | 'cancelled';
  cancel_reason: string | null;
  subtotal: number;
  discount_amount: number;
  delivery_fee: number;
  total_amount: number;
  internal_notes: string | null;
  customer_id?: number | null;
  is_prepaid?: number;
  paid_at?: string | null;
  transaction_ref?: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  history?: OrderHistoryItem[];
}

export interface Customer {
  id: number;
  phone: string;
  email: string | null;
  full_name: string;
  default_address?: string | null;
  default_address_note?: string | null;
  is_active: number;
  total_orders?: number;
  total_spent?: number;
  last_order_date?: string | null;
  created_at: string;
}

export interface AiProposal {
  type: string;
  target_id: string | number;
  target_name: string;
  field: string;
  current_value: string;
  proposed_value: string;
  raw_proposed_value: any;
  explanation: string;
}

// types/item.ts

export interface InventoryItem {
  item_id: number;
  item_name: string;
  item_type_id: number; // 1 = Part, 2 = Service
  type_name?: string;
  category?: string;
  price: number | string;
  /** ราคาขาย (ชื่อจริงที่ API ส่งกลับ) */
  selling_price?: number | string;
  cost?: number | string;
  /** ราคาทุน/ต้นทุนอะไหล่ (ชื่อจริงที่ API ส่งกลับ) — ใช้คิดกำไรขั้นต้น */
  cost_price?: number | string;
  unit?: string;
  quantity?: number;
  stock_quantity?: number;
  min_stock?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

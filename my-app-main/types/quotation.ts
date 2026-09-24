// types/quotation.ts

export interface QuotationItem {
  quotation_id: number;
  job_id: number;
  quote_no: string;
  job_no: string;
  quote_status_id: number;
  quote_status_name: string;
  repair_status_id: number;
  repair_status_name: string;
  total_repair_price: string | number;
  total_cancel_price: string | number;
  customer_remark: string | null;
  customer_name: string;
  phone: string;
  email?: string;
  brand?: string;
  model?: string;
  device_type?: string;
  symptom_details?: string;
  actual_symptom?: string;
  total_parts: string | number;
  total_services: string | number;
  item_count: string | number;
  created_at: string;
}

export type QuotationFilter = 'all' | 'rejected' | 'pending' | 'approved' | 'cancelled';

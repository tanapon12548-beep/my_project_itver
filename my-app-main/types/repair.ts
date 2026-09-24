// types/repair.ts

export interface RepairQuotationSummary {
  quotation_id: number;
  quote_no: string;
  total_repair_price: number | string;
  total_cancel_price?: number | string;
  quote_status_id?: number;
  quote_status_name?: string;
  customer_remark?: string | null;
  items?: any[];
  parts?: any[];
  services?: any[];
  total_parts?: number;
  total_services?: number;
}

export interface RepairJob {
  id?: string | number;
  job_id: number;
  job_number?: string;
  job_no?: string;
  device_id?: number;
  device_type?: string;
  brand?: string;
  model?: string;
  serial_number?: string;
  included_accessories?: string | null;
  accessories?: string | null;
  important_software?: string | null;
  important_programs?: string | null;
  device_password?: string | null;
  password?: string | null;
  warranty_year?: string | number | null;
  warranty_end_date?: string | null;
  symptoms?: string;
  symptom_details?: string;
  symptom?: string;
  actual_symptom?: string;
  repair_details?: string;
  status?: string;
  status_name?: string;
  status_id: number;
  customer_id?: string | number;
  customer_name?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
  total_amount?: number;
  quotation_id?: number | null;
  appointment_date?: string | null;
  payment_method_id?: number | null;
  payment_method_name?: string;
  payment_method?: string;
  payment_date?: string | null;
  slip_image?: string | null;
  slip_filename?: string | null;
  payment_verified?: boolean;
  payment_reject_reason?: string | null;
  customer_remark?: string | null;
  signature?: string | null;
  receiver_signature?: string | null;
  customer_receive_signature?: string | null;
  received_by?: string | null;
  inspector_name?: string | null;
  repairer_name?: string | null;
  technician_name?: string | null;
  repairer_id?: string | number | null;
  repaired_at?: string | null;
  return_date?: string | null;
  technician_id?: string | number | null;
  staff_id?: string | number | null;
  created_at: string;
  updated_at?: string;
  action_logs?: any[];
  quotation?: RepairQuotationSummary | null;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  total?: number;
}

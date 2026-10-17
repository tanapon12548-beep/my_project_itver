-- ============================================================
-- IT VERTEX — Mockup Database
-- โครงสร้างตารางทั้งหมด (เหมือน database.sql ทุกประการ)
-- ข้อมูล: เฉพาะ MASTER DATA (ตารางอ้างอิง + แคตตาล็อก)
-- ============================================================
-- ไฟล์นี้สร้างทุกตาราง/วิว/อินเด็กซ์เท่ากับ database.sql
-- แต่ "ไม่ใส่" บัญชีผู้ใช้ (profiles) และข้อมูลธุรกรรม
-- (device, repair_job, repair_job_detail, quotation, quotation_details,
--  slips_records, password_reset_tokens) จึงไม่มีข้อมูลค้างเลย
--
-- ที่มาของข้อมูล
--   - โครงสร้าง (DDL / view / sequence / index) : คัดลอกจาก database.sql
--   - master data : ดึงจากฐานข้อมูลจริงปัจจุบัน (ตัวจริงล่าสุด ครบกว่าลิสต์ใน database.sql)
--
-- วิธีใช้
--   1) สร้างฐานข้อมูลใหม่   :  CREATE DATABASE app_mockup;
--   2) รันไฟล์นี้           :  psql -U postgres -d app_mockup -f mockup.sql
--
-- *** คำเตือน: ไฟล์นี้ DROP ตารางเดิมทั้งหมด ***
--   ใช้กับฐานข้อมูลใหม่/ฐานข้อมูล mockup เท่านั้น
--   ห้ามรันกับฐานข้อมูลที่มีข้อมูลจริง (เช่น app_data) เพราะข้อมูลจะหายทั้งหมด
-- ============================================================

-- ============================================================
-- ส่วนที่ 1: โครงสร้างตารางทั้งหมด (คัดลอกจาก database.sql)
-- ============================================================

-- ============================================================
-- IT VERTEX - Repair Management System
-- Database Schema for PostgreSQL (pgAdmin)
-- ============================================================

-- ============================================================
-- DROP ตารางเก่า (ถ้ามี) เพื่อสร้างใหม่
-- ============================================================
DROP VIEW IF EXISTS public.repair_jobs_view CASCADE;
DROP TABLE IF EXISTS public.password_reset_tokens CASCADE;
DROP TABLE IF EXISTS public.slips_records CASCADE;
DROP TABLE IF EXISTS public.quotation_details CASCADE;
DROP TABLE IF EXISTS public.quotation CASCADE;
DROP TABLE IF EXISTS public.repair_job_detail CASCADE;
DROP TABLE IF EXISTS public.repair_job CASCADE;
DROP TABLE IF EXISTS public.device CASCADE;
DROP TABLE IF EXISTS public.item CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.item_type CASCADE;
DROP TABLE IF EXISTS public.payment_method CASCADE;
DROP TABLE IF EXISTS public.quotation_status CASCADE;
DROP TABLE IF EXISTS public.action_type CASCADE;
DROP TABLE IF EXISTS public.status CASCADE;
DROP TABLE IF EXISTS public.roles CASCADE;
DROP TABLE IF EXISTS public.device_types CASCADE;
DROP TABLE IF EXISTS public.brands CASCADE;
DROP TABLE IF EXISTS public.device_models CASCADE;
DROP TABLE IF EXISTS public.symptoms CASCADE;

-- ============================================================
-- 1. Lookup Tables (ตารางอ้างอิง - Master Data)
-- ============================================================

-- 1.1 บทบาทผู้ใช้
CREATE TABLE IF NOT EXISTS public.roles
(
    id serial NOT NULL,
    name text NOT NULL,
    CONSTRAINT roles_pkey PRIMARY KEY (id)
);

-- 1.2 สถานะงานซ่อม
CREATE TABLE IF NOT EXISTS public.status
(
    status_id serial NOT NULL,
    status_name text NOT NULL,
    CONSTRAINT status_pkey PRIMARY KEY (status_id)
);

-- 1.3 ประเภท action (log ประวัติงาน)
CREATE TABLE IF NOT EXISTS public.action_type
(
    action_type_id serial NOT NULL,
    action_type_name text NOT NULL,
    CONSTRAINT action_type_pkey PRIMARY KEY (action_type_id)
);

-- 1.4 ประเภทอะไหล่/บริการ
CREATE TABLE IF NOT EXISTS public.item_type
(
    item_type_id serial NOT NULL,
    item_type_name text NOT NULL,
    CONSTRAINT item_type_pkey PRIMARY KEY (item_type_id)
);

-- 1.5 วิธีชำระเงิน
CREATE TABLE IF NOT EXISTS public.payment_method
(
    payment_method_id serial NOT NULL,
    payment_method_name text NOT NULL,
    CONSTRAINT payment_method_pkey PRIMARY KEY (payment_method_id)
);

-- 1.6 สถานะใบเสนอราคา
CREATE TABLE IF NOT EXISTS public.quotation_status
(
    quote_status_id serial NOT NULL,
    quote_status_name text NOT NULL,
    CONSTRAINT quotation_status_pkey PRIMARY KEY (quote_status_id)
);

-- 1.7 ประเภทอุปกรณ์ (Master Lookup)
CREATE TABLE IF NOT EXISTS public.device_types
(
    device_type_id serial NOT NULL,
    device_type_name text NOT NULL,
    CONSTRAINT device_types_pkey PRIMARY KEY (device_type_id)
);

-- 1.8 ยี่ห้ออุปกรณ์ (Master Lookup)
CREATE TABLE IF NOT EXISTS public.brands
(
    brand_id serial NOT NULL,
    brand_name text NOT NULL,
    CONSTRAINT brands_pkey PRIMARY KEY (brand_id)
);

-- 1.9 รุ่นอุปกรณ์ (Master Lookup)
CREATE TABLE IF NOT EXISTS public.device_models
(
    model_id serial NOT NULL,
    brand_id integer REFERENCES public.brands(brand_id) ON DELETE CASCADE,
    device_type_id integer REFERENCES public.device_types(device_type_id) ON DELETE SET NULL,
    model_name text NOT NULL,
    CONSTRAINT device_models_pkey PRIMARY KEY (model_id),
    CONSTRAINT uq_brand_model UNIQUE (brand_id, model_name)
);


-- ============================================================
-- 2. Main Tables (ตารางหลัก)
-- ============================================================

-- 2.1 ผู้ใช้งาน
CREATE TABLE IF NOT EXISTS public.profiles
(
    id serial NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    first_name text,
    last_name text,
    phone text,
    role_id integer DEFAULT 4,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT profiles_pkey PRIMARY KEY (id),
    CONSTRAINT profiles_email_key UNIQUE (email)
);

-- 2.2 Token สำหรับลืมรหัสผ่าน
CREATE TABLE IF NOT EXISTS public.password_reset_tokens
(
    id serial NOT NULL,
    user_id integer NOT NULL,
    token text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    used boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id),
    CONSTRAINT password_reset_tokens_token_key UNIQUE (token)
);

-- 2.3 อุปกรณ์ลูกค้า
CREATE TABLE IF NOT EXISTS public.device
(
    device_id serial NOT NULL,
    customer_id integer,
    device_type_id integer,
    brand_id integer,
    model text,
    included_accessories text,
    warranty_year integer DEFAULT 0,
    warranty_end_date date,
    serial_number text,
    important_software text,
    device_password text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT device_pkey PRIMARY KEY (device_id)
);

-- 2.4 อะไหล่ / บริการ
CREATE TABLE IF NOT EXISTS public.item
(
    item_id serial NOT NULL,
    item_name text NOT NULL,
    item_type_id integer,
    selling_price numeric(10, 2) DEFAULT 0,
    -- ราคาทุน (ต้นทุนที่ร้านซื้อมา) ใช้คำนวณกำไรขั้นต้น = รายรับรวม - ต้นทุนอะไหล่
    cost_price numeric(10, 2) DEFAULT 0,
    CONSTRAINT item_pkey PRIMARY KEY (item_id)
);

-- 2.5 งานซ่อม
CREATE TABLE IF NOT EXISTS public.repair_job
(
    job_id serial NOT NULL,
    device_id integer,
    quotation_id integer,
    symptom_details text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    customer_send_signature text,
    customer_receive_signature text,
    staff_receive_signature text,
    tech_inspect_signature text,
    tech_repair_signature text,
    total_amount numeric(10, 2) DEFAULT 0,
    slip_image text,
    payment_date date,
    payment_method_id integer,
    payment_verified boolean DEFAULT false,
    payment_verified_by integer,
    payment_verified_at timestamp with time zone,
    payment_reject_reason text,
    status_id integer DEFAULT 1,
    actual_symptom text,
    repairer_id integer,
    repaired_at timestamp with time zone,
    return_date timestamp with time zone,
    CONSTRAINT repair_job_pkey PRIMARY KEY (job_id)
);

-- 2.6 ประวัติ action ของงานซ่อม
CREATE TABLE IF NOT EXISTS public.repair_job_detail
(
    job_id_detail serial NOT NULL,
    job_id integer,
    user_id integer,
    action_type_id integer,
    action_date date DEFAULT CURRENT_DATE,
    remark text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT repair_job_detail_pkey PRIMARY KEY (job_id_detail)
);

-- 2.7 ใบเสนอราคา
CREATE TABLE IF NOT EXISTS public.quotation
(
    quotation_id serial NOT NULL,
    job_id integer,
    total_repair_price numeric(10, 2) DEFAULT 0,
    total_cancel_price numeric(10, 2) DEFAULT 0,
    quote_status_id integer DEFAULT 1,
    customer_remark text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT quotation_pkey PRIMARY KEY (quotation_id)
);

-- 2.8 รายละเอียดใบเสนอราคา
CREATE TABLE IF NOT EXISTS public.quotation_details
(
    details_id serial NOT NULL,
    quote_id integer,
    item_id integer,
    quantity numeric(10, 2) DEFAULT 1,
    unit_price numeric(10, 2) DEFAULT 0,
    total_price numeric(10, 2) DEFAULT 0,
    -- ต้นทุนต่อหน่วย ณ วันที่เสนอราคา (snapshot) — เก็บไว้เพื่อไม่ให้กำไรย้อนหลังเปลี่ยนตามราคาทุนที่แก้ทีหลัง
    unit_cost numeric(10, 2) DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT quotation_details_pkey PRIMARY KEY (details_id)
);

-- 2.9 บันทึกสลิปการชำระเงิน
CREATE TABLE IF NOT EXISTS public.slips_records
(
    id serial NOT NULL,
    user_id integer,
    image_url text NOT NULL,
    uploaded_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT slips_records_pkey PRIMARY KEY (id)
);


-- ============================================================
-- 3. Foreign Keys (ความสัมพันธ์)
-- ============================================================

ALTER TABLE IF EXISTS public.profiles ADD CONSTRAINT profiles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles (id);
ALTER TABLE IF EXISTS public.password_reset_tokens ADD CONSTRAINT password_reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles (id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.device ADD CONSTRAINT device_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.profiles (id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.device ADD CONSTRAINT device_device_type_id_fkey FOREIGN KEY (device_type_id) REFERENCES public.device_types (device_type_id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.device ADD CONSTRAINT device_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands (brand_id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS public.item ADD CONSTRAINT item_item_type_id_fkey FOREIGN KEY (item_type_id) REFERENCES public.item_type (item_type_id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS public.repair_job ADD CONSTRAINT repair_job_device_id_fkey FOREIGN KEY (device_id) REFERENCES public.device (device_id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS public.repair_job ADD CONSTRAINT fk_repair_job_quotation FOREIGN KEY (quotation_id) REFERENCES public.quotation (quotation_id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.repair_job ADD CONSTRAINT repair_job_payment_method_id_fkey FOREIGN KEY (payment_method_id) REFERENCES public.payment_method (payment_method_id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.repair_job ADD CONSTRAINT repair_job_status_id_fkey FOREIGN KEY (status_id) REFERENCES public.status (status_id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.repair_job ADD CONSTRAINT repair_job_repairer_id_fkey FOREIGN KEY (repairer_id) REFERENCES public.profiles (id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.repair_job ADD CONSTRAINT repair_job_payment_verified_by_fkey FOREIGN KEY (payment_verified_by) REFERENCES public.profiles (id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS public.quotation ADD CONSTRAINT quotation_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.repair_job (job_id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS public.quotation ADD CONSTRAINT quotation_quote_status_id_fkey FOREIGN KEY (quote_status_id) REFERENCES public.quotation_status (quote_status_id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS public.quotation_details ADD CONSTRAINT quotation_details_quote_id_fkey FOREIGN KEY (quote_id) REFERENCES public.quotation (quotation_id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS public.quotation_details ADD CONSTRAINT quotation_details_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.item (item_id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS public.repair_job_detail ADD CONSTRAINT repair_job_detail_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.repair_job (job_id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS public.repair_job_detail ADD CONSTRAINT repair_job_detail_action_type_id_fkey FOREIGN KEY (action_type_id) REFERENCES public.action_type (action_type_id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.repair_job_detail ADD CONSTRAINT repair_job_detail_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles (id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS public.slips_records ADD CONSTRAINT slips_records_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles (id) ON DELETE SET NULL;


-- ============================================================
-- 3.5 Migration: เพิ่มคอลัมน์ต้นทุนอะไหล่ (กันฐานข้อมูลเดิมที่สร้างไปแล้ว)
-- ============================================================
ALTER TABLE IF EXISTS public.item
    ADD COLUMN IF NOT EXISTS cost_price numeric(10, 2) DEFAULT 0;

ALTER TABLE IF EXISTS public.quotation_details
    ADD COLUMN IF NOT EXISTS unit_cost numeric(10, 2) DEFAULT 0;


-- ============================================================
-- 4. View: repair_jobs_view
-- ============================================================

CREATE OR REPLACE VIEW public.repair_jobs_view AS
SELECT
    rj.job_id AS id,
    'REP-' || LPAD(rj.job_id::text, 6, '0') AS job_number,
    COALESCE(p.first_name || ' ' || p.last_name, 'ไม่ระบุ') AS customer_name,
    COALESCE(p.phone, '') AS phone,
    COALESCE(p.email, '') AS email,
    COALESCE(dt.device_type_name, '') AS device_type,
    COALESCE(b.brand_name, '') AS brand,
    COALESCE(d.model, '') AS model,
    COALESCE(d.serial_number, '') AS serial_number,
    COALESCE(d.included_accessories, '') AS accessories,
    COALESCE(d.important_software, '') AS important_programs,
    COALESCE(d.device_password, '') AS password,
    d.warranty_year AS warranty_years,
    d.warranty_end_date,
    COALESCE(rj.symptom_details, 'ไม่ระบุอาการ') AS symptoms,
    COALESCE(rj.symptom_details, 'ไม่ระบุอาการ') AS symptom_details,
    COALESCE(s.status_name, 'ไม่ระบุ') AS status,
    rj.status_id,
    rj.total_amount,
    rj.payment_date,
    rj.slip_image,
    rj.staff_receive_signature,
    rj.tech_inspect_signature,
    rj.tech_repair_signature,
    rj.customer_send_signature,
    rj.customer_receive_signature,
    rj.created_at,
    rj.device_id,
    rj.quotation_id,
    rj.payment_method_id,
    COALESCE(pm.payment_method_name, '') AS payment_method_name,
    d.customer_id,
    q.customer_remark
FROM public.repair_job rj
LEFT JOIN public.device d ON rj.device_id = d.device_id
LEFT JOIN public.device_types dt ON d.device_type_id = dt.device_type_id
LEFT JOIN public.brands b ON d.brand_id = b.brand_id
LEFT JOIN public.profiles p ON d.customer_id = p.id
LEFT JOIN public.status s ON rj.status_id = s.status_id
LEFT JOIN public.payment_method pm ON rj.payment_method_id = pm.payment_method_id
LEFT JOIN public.quotation q ON rj.quotation_id = q.quotation_id;

-- ============================================================
-- ส่วนที่ 2: Master Data (จากฐานข้อมูลจริง — ไม่มีบัญชีผู้ใช้)
-- ============================================================

-- roles (4 แถว)
INSERT INTO public.roles (id, name)
VALUES
  (1, 'Manager'),
  (2, 'Technician'),
  (3, 'Staff'),
  (4, 'Customer');

-- status (9 แถว)
INSERT INTO public.status (status_id, status_name)
VALUES
  (1, 'รอตรวจเช็ค'),
  (2, 'ดำเนินการตรวจเช็ค'),
  (3, 'ดำเนินการเสนอราคา'),
  (4, 'รอการอนุมัติ'),
  (5, 'อนุมัติแล้ว/รอซ่อม'),
  (6, 'รอลูกค้ามารับเครื่อง'),
  (7, 'รอชำระ'),
  (8, 'เสร็จสิ้น'),
  (9, 'ยกเลิกซ่อม');

-- action_type (8 แถว)
INSERT INTO public.action_type (action_type_id, action_type_name)
VALUES
  (1, 'รับเครื่องซ่อม'),
  (2, 'เริ่มตรวจเช็คสภาพเครื่อง'),
  (3, 'ออกใบเสนอราคา'),
  (4, 'เริ่มดำเนินการซ่อม'),
  (5, 'ซ่อมเสร็จสิ้น / ทดสอบเครื่อง'),
  (6, 'รับชำระเงิน'),
  (7, 'ส่งมอบเครื่องให้ลูกค้า'),
  (8, 'ยกเลิกการซ่อม');

-- item_type (2 แถว)
INSERT INTO public.item_type (item_type_id, item_type_name)
VALUES
  (1, 'อะไหล่ (Hardware/Part)'),
  (2, 'ค่าบริการ (Service Fee)');

-- payment_method (2 แถว)
INSERT INTO public.payment_method (payment_method_id, payment_method_name)
VALUES
  (1, 'เงินสด (Cash)'),
  (2, 'โอนเงิน / สแกน QR (Transfer)');

-- quotation_status (5 แถว)
INSERT INTO public.quotation_status (quote_status_id, quote_status_name)
VALUES
  (1, 'รอการอนุมัติ'),
  (2, 'อนุมัติแล้ว'),
  (3, 'ยกเลิก'),
  (4, 'ปรับปรุงใบเสนอราคา'),
  (5, 'ขอแก้ไข/เพิ่มเติมรายการ');

-- device_types (7 แถว)
INSERT INTO public.device_types (device_type_id, device_type_name)
VALUES
  (1, 'Notebook / Laptops'),
  (2, 'Desktop PC'),
  (3, 'All-in-One PC'),
  (4, 'Monitor'),
  (5, 'Printer / Scanner'),
  (6, 'Other'),
  (7, 'Tablet / iPad');

-- brands (30 แถว)
INSERT INTO public.brands (brand_id, brand_name)
VALUES
  (1, 'ASUS'),
  (2, 'Acer'),
  (3, 'Dell'),
  (4, 'HP'),
  (5, 'Lenovo'),
  (6, 'Apple'),
  (7, 'MSI'),
  (8, 'Huawei'),
  (9, 'Microsoft Surface'),
  (10, 'Samsung'),
  (11, 'Gigabyte'),
  (12, 'Alienware'),
  (13, 'Razer'),
  (14, 'ประกอบเอง / Custom PC (ไม่ระบุยี่ห้อ)'),
  (15, 'LG'),
  (16, 'BenQ'),
  (17, 'ViewSonic'),
  (18, 'AOC'),
  (19, 'Philips'),
  (20, 'Epson'),
  (21, 'Canon'),
  (22, 'Brother'),
  (23, 'Pantum'),
  (24, 'Ricoh'),
  (25, 'Fuji Xerox'),
  (26, 'Xiaomi'),
  (27, 'APC'),
  (28, 'Western Digital (WD)'),
  (29, 'Seagate'),
  (30, 'อื่นๆ / ทั่วไป');

-- device_models (188 แถว)
INSERT INTO public.device_models (model_id, brand_id, device_type_id, model_name)
VALUES
  (1, 1, 1, 'ROG Strix G15 / G16'),
  (2, 1, 1, 'TUF Gaming A15 / F15'),
  (3, 1, 1, 'ZenBook 14 OLED'),
  (4, 1, 1, 'VivoBook 15 / S14'),
  (5, 1, 2, 'ROG Strix GT35'),
  (6, 2, 1, 'Nitro 5 / Nitro 16'),
  (7, 2, 1, 'Predator Helios 300 / 16'),
  (9, 2, 1, 'Swift Go 14 / Swift 3'),
  (10, 2, 3, 'Aspire C24 All-in-One'),
  (11, 3, 1, 'Inspiron 15 / 14'),
  (12, 3, 1, 'XPS 13 / 15 / 16'),
  (13, 3, 1, 'G15 / G16 Gaming'),
  (14, 3, 1, 'Latitude 3420 / 5420'),
  (15, 3, 2, 'OptiPlex 7090 Tower'),
  (16, 4, 1, 'Victus 15 / 16'),
  (17, 4, 1, 'OMEN 16 / 17'),
  (18, 4, 1, 'Pavilion 14 / 15'),
  (19, 4, 1, 'Envy x360 14'),
  (20, 4, 3, 'HP 24 All-in-One PC'),
  (21, 5, 1, 'LOQ 15 / 16'),
  (22, 5, 1, 'Legion 5 / Pro 7'),
  (23, 5, 1, 'IdeaPad Gaming 3 / Slim 3'),
  (24, 5, 1, 'ThinkPad E14 / X1 Carbon'),
  (25, 5, 2, 'Legion Tower 5i'),
  (26, 6, 1, 'MacBook Air M1 / M2 / M3'),
  (27, 6, 1, 'MacBook Pro 14 / 16 (M-Series)'),
  (28, 6, 3, 'iMac 24-inch (M-Series)'),
  (29, 6, 2, 'Mac mini (M-Series)'),
  (30, 6, 2, 'Mac Studio'),
  (31, 7, 1, 'Katana 15 / GF63 Thin'),
  (32, 7, 1, 'Stealth 16 / Raider GE78'),
  (33, 7, 1, 'Modern 14 / 15'),
  (36, 1, 1, 'ROG Strix G16 / Scar 18'),
  (37, 1, 1, 'ROG Zephyrus G14 / G16'),
  (38, 1, 1, 'ExpertBook B1 / B5'),
  (39, 2, 1, 'Predator Helios 16 / 18'),
  (40, 2, 1, 'Swift Go 14 / Swift Edge'),
  (41, 2, 1, 'TravelMate P2 / P4'),
  (42, 3, 1, 'Inspiron 14 / 15 / 16'),
  (43, 3, 1, 'Alienware m16 / x16'),
  (44, 3, 1, 'Latitude 3420 / 5420 / 7420'),
  (45, 3, 1, 'Vostro 3510 / 5620'),
  (46, 4, 1, 'OMEN 16 / Transcend 16'),
  (47, 4, 1, 'Envy x360 14 / 16'),
  (48, 4, 1, 'ProBook 440 / 450 G9/G10'),
  (49, 5, 1, 'Legion 5 / Pro 7i'),
  (50, 5, 1, 'IdeaPad Gaming 3 / Slim 3 / Slim 5'),
  (51, 5, 1, 'ThinkPad E14 / T14 / X1 Carbon'),
  (52, 5, 1, 'Yoga 7 / 9i'),
  (53, 6, 1, 'MacBook Air 13" (M1 / M2 / M3)'),
  (54, 6, 1, 'MacBook Air 15" (M2 / M3)'),
  (55, 6, 1, 'MacBook Pro 14" (M1 / M2 / M3 Pro/Max)'),
  (56, 6, 1, 'MacBook Pro 16" (M1 / M2 / M3 Pro/Max)'),
  (57, 7, 1, 'Stealth 14 / 16 Studio'),
  (58, 7, 1, 'Raider GE78 HX'),
  (59, 7, 1, 'Cyborg 15'),
  (60, 8, 1, 'MateBook D14 / D15'),
  (61, 8, 1, 'MateBook 14s'),
  (62, 8, 1, 'MateBook X Pro'),
  (63, 9, 1, 'Surface Laptop 4 / 5'),
  (64, 9, 1, 'Surface Laptop Studio'),
  (65, 11, 1, 'AORUS 15 / 17'),
  (66, 11, 1, 'G5 / G7 Gaming Laptop'),
  (67, 11, 1, 'AERO 14 / 16 OLED'),
  (68, 13, 1, 'Razer Blade 14 / 15 / 16 / 18'),
  (72, 1, 2, 'ROG Strix GT35 / G15DK'),
  (73, 1, 2, 'ExpertCenter D5 / D7 Tower'),
  (74, 2, 2, 'Predator Orion 3000 / 7000'),
  (75, 2, 2, 'Nitro 50 Desktop'),
  (76, 2, 2, 'Aspire TC-1780'),
  (77, 3, 2, 'OptiPlex 3090 / 7090 Tower / SFF'),
  (78, 3, 2, 'Inspiron Desktop 3910'),
  (79, 3, 2, 'Alienware Aurora R15 / R16'),
  (80, 4, 2, 'OMEN 25L / 40L Desktop'),
  (81, 4, 2, 'Victus 15L Gaming Desktop'),
  (82, 4, 2, 'ProDesk 400 / 600 G6 Microtower'),
  (83, 5, 2, 'Legion Tower 5i / 7i'),
  (84, 5, 2, 'IdeaCentre Gaming 5'),
  (85, 5, 2, 'ThinkCentre M70s / M90t'),
  (86, 6, 2, 'Mac mini (M2 / M2 Pro / M4)'),
  (87, 6, 2, 'Mac Studio (M2 Max / M2 Ultra)'),
  (88, 6, 2, 'Mac Pro'),
  (89, 7, 2, 'MAG Infinite S3 / Infinite E1'),
  (90, 6, 3, 'iMac 24-inch (M1 / M3)'),
  (91, 6, 3, 'iMac 27-inch Retina 5K'),
  (92, 4, 3, 'HP 24 All-in-One PC (24-cb / 24-df)'),
  (93, 4, 3, 'HP 27 All-in-One PC'),
  (94, 4, 3, 'HP EliteOne 800 G6/G8 AIO'),
  (95, 2, 3, 'Aspire C27 All-in-One'),
  (96, 1, 3, 'Zen AiO 24 (A5401)'),
  (97, 1, 3, 'ExpertCenter E5 AiO 24'),
  (98, 1, 3, 'Vivo AiO V241'),
  (99, 5, 3, 'IdeaCentre AIO 3 (24" / 27")'),
  (100, 5, 3, 'IdeaCentre AIO 5'),
  (101, 5, 3, 'ThinkCentre Neo 30a / 50a'),
  (102, 3, 3, 'Inspiron 24 All-in-One (5410 / 5420)'),
  (103, 3, 3, 'Inspiron 27 All-in-One (7710 / 7720)'),
  (104, 3, 3, 'OptiPlex 7400 / 7410 AIO'),
  (105, 15, 4, 'UltraGear 27GP850-B (2K Nano IPS 165Hz)'),
  (106, 15, 4, 'UltraGear 24GN600-B (FHD IPS 144Hz)'),
  (107, 15, 4, 'LG 24MP400-B / 27MP400 (IPS 75Hz)'),
  (108, 15, 4, 'LG 27UL500-W (4K UHD HDR)'),
  (109, 15, 4, 'LG DualUp 28MQ780 (16:18 Ergo)'),
  (110, 10, 4, 'Odyssey G3 (24" / 27" 144Hz)'),
  (111, 10, 4, 'Odyssey G5 (27" / 32" Curved 2K 165Hz)'),
  (112, 10, 4, 'Odyssey G7 / G9 (Curved 240Hz)'),
  (113, 10, 4, 'ViewFinity S6 / S8 (4K IPS)'),
  (114, 10, 4, 'Essential Monitor S3 (24" / 27")'),
  (115, 1, 4, 'TUF Gaming VG259QR (24.5" IPS 165Hz)'),
  (116, 1, 4, 'TUF Gaming VG27AQ (27" 2K 165Hz)'),
  (117, 1, 4, 'ROG Swift PG279QM (240Hz 1ms)'),
  (118, 1, 4, 'Eye Care VA24EHE (23.8" IPS 75Hz)'),
  (119, 1, 4, 'ProArt Display PA278CV (Creator 2K)'),
  (120, 3, 4, 'UltraSharp U2723QE (27" 4K IPS Black)'),
  (121, 3, 4, 'Gaming G2724D (27" 2K Fast IPS 165Hz)'),
  (122, 3, 4, 'S2421HS / S2721HS (IPS 75Hz)'),
  (123, 3, 4, 'Alienware AW2524H (500Hz Fast IPS)'),
  (124, 16, 4, 'ZOWIE XL2546K (24.5" 240Hz DyAc+)'),
  (125, 16, 4, 'ZOWIE XL2411K (24" 144Hz)'),
  (126, 16, 4, 'MOBIUZ EX2710S (27" IPS 165Hz)'),
  (127, 16, 4, 'EW2780Q (27" 2K HDRi)'),
  (128, 18, 4, '24G2 / 24G2SP (23.8" IPS 165Hz)'),
  (129, 18, 4, '27G2 / 27G2SP (27" IPS 165Hz)'),
  (130, 18, 4, 'CQ27G2 (27" Curved 2K 144Hz)'),
  (131, 18, 4, '24B2XH (23.8" IPS 75Hz)'),
  (132, 17, 4, 'VX2758-2KP-MHD (27" 2K 144Hz)'),
  (133, 17, 4, 'Omni VX2428 (23.8" Fast IPS 180Hz)'),
  (134, 17, 4, 'VA2432-H (23.8" IPS 75Hz)'),
  (135, 19, 4, '242E1GSJ (23.8" 144Hz 1ms)'),
  (136, 19, 4, '27M1N3200Z (27" IPS 165Hz)'),
  (137, 19, 4, '241V8 (23.8" IPS 75Hz)'),
  (138, 20, 5, 'EcoTank L3210 (All-in-One Ink Tank)'),
  (139, 20, 5, 'EcoTank L3250 (All-in-One Wi-Fi)'),
  (140, 20, 5, 'EcoTank L5290 (All-in-One Wi-Fi Fax ADF)'),
  (141, 20, 5, 'EcoTank L18050 (A3+ 6-Color Photo)'),
  (142, 20, 5, 'Perfection V39II (Photo Scanner)'),
  (143, 21, 5, 'PIXMA G2010 / G2020 (Ink Tank 3-in-1)'),
  (144, 21, 5, 'PIXMA G3010 / G3020 (Ink Tank Wi-Fi)'),
  (145, 21, 5, 'imageCLASS LBP6030 / LBP6030w (Mono Laser)'),
  (146, 21, 5, 'imageCLASS MF3010 (Mono Laser 3-in-1)'),
  (147, 21, 5, 'CanoScan LiDE 300 / 400 (Flatbed Scanner)'),
  (148, 22, 5, 'DCP-T420W / DCP-T520W (Ink Tank Wi-Fi)'),
  (149, 22, 5, 'DCP-T720W / DCP-T820DW (Auto Duplex Wi-Fi)'),
  (150, 22, 5, 'HL-1210W (Compact Mono Laser Wi-Fi)'),
  (151, 22, 5, 'MFC-T920DW (All-in-One Duplex Fax)'),
  (152, 22, 5, 'ADS-1700W (Document Scanner)'),
  (153, 4, 5, 'Smart Tank 515 / 580 (All-in-One Wi-Fi)'),
  (154, 4, 5, 'Smart Tank 615 / 750 (Duplex ADF)'),
  (155, 4, 5, 'LaserJet Pro M12a / M15a (Mono Laser)'),
  (156, 4, 5, 'LaserJet MFP M141w (Laser 3-in-1 Wi-Fi)'),
  (157, 4, 5, 'ScanJet Pro 2600 f1 (Flatbed Scanner)'),
  (158, 24, 5, 'SP 230DNw / SP 230SFNw (Laser Wi-Fi)'),
  (159, 24, 5, 'M 2701 (A3 Monochrome MFP)'),
  (160, 25, 5, 'DocuPrint P285 dw (Laser Duplex Wi-Fi)'),
  (161, 25, 5, 'DocuPrint M285 z (Laser 4-in-1)'),
  (162, 23, 5, 'P2500W (Mono Laser Wi-Fi)'),
  (163, 23, 5, 'M6550NW (Mono Laser MFP)'),
  (164, 27, 6, 'Back-UPS 650VA / 1000VA (BV650I / BX1100LI)'),
  (165, 27, 6, 'Easy UPS SMV 1500VA'),
  (166, 28, 6, 'My Passport 1TB / 2TB / 4TB (External HDD)'),
  (167, 28, 6, 'My Book 4TB / 8TB (Desktop HDD)'),
  (168, 29, 6, 'One Touch 2TB / 4TB (External HDD)'),
  (169, 29, 6, 'Expansion Desktop 4TB / 8TB'),
  (170, 30, 6, 'อุปกรณ์แปลงสัญญาณ / สายเคเบิล / อะแดปเตอร์'),
  (171, 30, 6, 'เครื่องสำรองไฟทั่วไป (UPS Non-Brand)'),
  (172, 6, 7, 'iPad 9th / 10th Gen (10.2" / 10.9")'),
  (173, 6, 7, 'iPad Air (M1 / M2 11" & 13")'),
  (174, 6, 7, 'iPad Pro 11" (M1 / M2 / M4)'),
  (175, 6, 7, 'iPad Pro 12.9" / 13" (M1 / M2 / M4)'),
  (176, 6, 7, 'iPad mini 5 / mini 6'),
  (177, 10, 7, 'Galaxy Tab S9 / S9+ / S9 Ultra'),
  (178, 10, 7, 'Galaxy Tab S9 FE / FE+'),
  (179, 10, 7, 'Galaxy Tab A9 / A9+'),
  (180, 26, 7, 'Xiaomi Pad 6 / 6S Pro'),
  (181, 26, 7, 'Redmi Pad SE / Pad Pro'),
  (182, 8, 7, 'MatePad 11.5 (PaperMatte)'),
  (183, 8, 7, 'MatePad Pro 13.2'),
  (184, 8, 7, 'MatePad SE 10.4'),
  (185, 9, 7, 'Surface Pro 8 / 9 / 10'),
  (186, 9, 7, 'Surface Go 3 / 4'),
  (187, 5, 7, 'Tab P11 Pro / P12'),
  (188, 5, 7, 'Tab M10 / M11 Plus'),
  (193, 14, 2, 'Custom PC (สเปกทั่วไป / ทำงาน Office)'),
  (194, 14, 2, 'Custom Gaming PC (สเปกเล่นเกม / RGB)'),
  (195, 14, 2, 'Custom Workstation PC (งานตัดต่อ / 3D Render)'),
  (196, 14, 2, 'Custom Mini-ITX PC (เคสขนาดเล็ก)'),
  (197, 14, 2, 'Custom Liquid Cooling PC (ชุดน้ำเปิด/ปิด)'),
  (198, 14, 2, 'สเปกประกอบเอง (ระบุรายละเอียดเพิ่มเติม)');

-- item (31 แถว)
INSERT INTO public.item (item_id, item_name, item_type_id, selling_price, cost_price)
VALUES
  (1, 'RAM DDR4 8GB Kingston/Corsair 3200MHz (PC/NB)', 1, 950.00, 740.00),
  (2, 'RAM DDR4 16GB Kingston/Corsair 3200MHz (PC/NB)', 1, 1690.00, 1320.00),
  (3, 'RAM DDR5 16GB Kingston Fury 5600MHz', 1, 2450.00, 1910.00),
  (4, 'SSD M.2 NVMe 500GB PCIe 4.0 (Kingston/WD)', 1, 1550.00, 1210.00),
  (5, 'SSD M.2 NVMe 1TB PCIe 4.0 (Kingston/WD/Samsung)', 1, 2590.00, 2400.00),
  (6, 'SSD SATA III 2.5" 512GB (Kingston/Hikvision)', 1, 1390.00, 1080.00),
  (7, 'พาวเวอร์ซัพพลาย 650W 80+ Bronze (Corsair/Cooler Master)', 1, 1850.00, 1440.00),
  (8, 'พาวเวอร์ซัพพลาย 750W 80+ Gold (Corsair/Thermaltake)', 1, 3190.00, 2490.00),
  (9, 'พัดลมเคสระบายความร้อน 120mm ARGB Pack 3', 1, 790.00, 620.00),
  (10, 'ชุดพัดลมระบายความร้อน CPU Air Cooler (Deepcool/Thermalright)', 1, 890.00, 690.00),
  (11, 'ชุดระบายความร้อนด้วยน้ำ CPU 240mm Liquid Cooler', 1, 2390.00, 1860.00),
  (12, 'จอแสดงผล Notebook 14.0" Full HD IPS 60Hz (Slim 30-Pin)', 1, 1950.00, 1520.00),
  (13, 'จอแสดงผล Notebook 15.6" Full HD IPS 144Hz (Gaming 40-Pin)', 1, 2650.00, 2070.00),
  (14, 'แบตเตอรี่ Notebook OEM Grade A (Asus/Acer/Dell/HP/Lenovo)', 1, 1450.00, 1130.00),
  (15, 'คีย์บอร์ด Notebook (OEM Thai/Eng Backlight)', 1, 850.00, 660.00),
  (16, 'พัดลมระบายความร้อน Notebook (CPU/GPU Fan OEM)', 1, 650.00, 510.00),
  (17, 'อะแดปเตอร์ชาร์จไฟ Notebook 65W Type-C (Universal)', 1, 890.00, 690.00),
  (18, 'อะแดปเตอร์ชาร์จไฟ Notebook 19V 4.74A (Universal)', 1, 690.00, 540.00),
  (19, 'หัวพิมพ์เครื่องพิมพ์ Epson L-Series (Print Head OEM)', 1, 1750.00, 1370.00),
  (20, 'ชุดลูกยางดึงกระดาษ Printer (Pickup Roller Kit)', 1, 350.00, 270.00),
  (21, 'กล่องซับหมึกพร้อมชิปรีเซ็ต (Maintenance Box Epson/Canon)', 1, 490.00, 380.00),
  (22, 'บอร์ดจ่ายไฟจอ Monitor (Power Board / Adapter Monitor)', 1, 750.00, 590.00),
  (23, 'การ์ด Wi-Fi 6 + Bluetooth 5.2 PCIe/M.2 (Intel AX200/AX210)', 1, 790.00, 620.00),
  (25, 'ค่าบริการตรวจเช็คสภาพเครื่องเบื้องต้น (Diagnostic Fee)', 2, 300.00, 0.00),
  (26, 'ค่าบริการติดตั้ง Windows, ไดรเวอร์ และโปรแกรมพื้นฐาน', 2, 500.00, 0.00),
  (27, 'ค่าบริการทำความสะอาดฝุ่นและทาซิลิโคนระบายความร้อน (PC / All-in-One)', 2, 400.00, 0.00),
  (28, 'ค่าบริการทำความสะอาดฝุ่นและทาซิลิโคนระบายความร้อน (Notebook)', 2, 500.00, 0.00),
  (29, 'ค่าบริการเปลี่ยนและติดตั้งอุปกรณ์ (RAM / SSD / Power Supply / GPU)', 2, 200.00, 0.00),
  (30, 'ค่าบริการเปลี่ยนจอภาพ Notebook / All-in-One PC', 2, 500.00, 0.00),
  (31, 'ค่าบริการเปลี่ยนคีย์บอร์ด / ทัชแพด Notebook', 2, 400.00, 0.00),
  (32, 'ค่าบริการซ่อมเมนบอร์ด / ซ่อมระบบไฟ / ยกเปลี่ยนชิปไอซี', 2, 1500.00, 0.00);

-- ============================================================
-- ส่วนที่ 3: Reset Sequence + Performance Indexes (เหมือน database.sql)
-- ============================================================

-- ============================================================
-- 6. ปรับ Reset Sequence ของ Serial PK ให้ถูกต้อง
-- ============================================================
SELECT setval('public.roles_id_seq', COALESCE((SELECT MAX(id) FROM public.roles), 1));
SELECT setval('public.status_status_id_seq', COALESCE((SELECT MAX(status_id) FROM public.status), 1));
SELECT setval('public.quotation_status_quote_status_id_seq', COALESCE((SELECT MAX(quote_status_id) FROM public.quotation_status), 1));
SELECT setval('public.payment_method_payment_method_id_seq', COALESCE((SELECT MAX(payment_method_id) FROM public.payment_method), 1));
SELECT setval('public.action_type_action_type_id_seq', COALESCE((SELECT MAX(action_type_id) FROM public.action_type), 1));
SELECT setval('public.item_type_item_type_id_seq', COALESCE((SELECT MAX(item_type_id) FROM public.item_type), 1));
SELECT setval('public.device_types_device_type_id_seq', COALESCE((SELECT MAX(device_type_id) FROM public.device_types), 1));
SELECT setval('public.brands_brand_id_seq', COALESCE((SELECT MAX(brand_id) FROM public.brands), 1));
SELECT setval('public.device_models_model_id_seq', COALESCE((SELECT MAX(model_id) FROM public.device_models), 1));
SELECT setval('public.item_item_id_seq', COALESCE((SELECT MAX(item_id) FROM public.item), 1));
SELECT setval('public.repair_job_job_id_seq', COALESCE((SELECT MAX(job_id) FROM public.repair_job), 1), (SELECT MAX(job_id) IS NOT NULL FROM public.repair_job));
SELECT setval('public.device_device_id_seq', COALESCE((SELECT MAX(device_id) FROM public.device), 1), (SELECT MAX(device_id) IS NOT NULL FROM public.device));
SELECT setval('public.quotation_quotation_id_seq', COALESCE((SELECT MAX(quotation_id) FROM public.quotation), 1), (SELECT MAX(quotation_id) IS NOT NULL FROM public.quotation));
SELECT setval('public.quotation_details_details_id_seq', COALESCE((SELECT MAX(details_id) FROM public.quotation_details), 1), (SELECT MAX(details_id) IS NOT NULL FROM public.quotation_details));
SELECT setval('public.repair_job_detail_job_id_detail_seq', COALESCE((SELECT MAX(job_id_detail) FROM public.repair_job_detail), 1), (SELECT MAX(job_id_detail) IS NOT NULL FROM public.repair_job_detail));
SELECT setval('public.profiles_id_seq', COALESCE((SELECT MAX(id) FROM public.profiles), 1), (SELECT MAX(id) IS NOT NULL FROM public.profiles));
SELECT setval('public.slips_records_id_seq', COALESCE((SELECT MAX(id) FROM public.slips_records), 1), (SELECT MAX(id) IS NOT NULL FROM public.slips_records));

-- ============================================================
-- 7. ดัชนีประสิทธิภาพ (Performance Indexes)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_repair_job_device_id ON public.repair_job (device_id);
CREATE INDEX IF NOT EXISTS idx_repair_job_status_id ON public.repair_job (status_id);
CREATE INDEX IF NOT EXISTS idx_repair_job_repairer_id ON public.repair_job (repairer_id);
CREATE INDEX IF NOT EXISTS idx_quotation_job_id ON public.quotation (job_id);
CREATE INDEX IF NOT EXISTS idx_quotation_details_quote_id ON public.quotation_details (quote_id);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles (phone);
CREATE INDEX IF NOT EXISTS idx_device_customer_id ON public.device (customer_id);

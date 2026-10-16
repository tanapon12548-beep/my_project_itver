--
-- PostgreSQL database dump
--

\restrict euCRjvz630a54xuT6LbOxx4OyzUF5qpcJSMz1HDFS5C4kvQcnPVCVmViLhlAXjW

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.slips_records DROP CONSTRAINT IF EXISTS slips_records_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.repair_job DROP CONSTRAINT IF EXISTS repair_job_status_id_fkey;
ALTER TABLE IF EXISTS ONLY public.repair_job DROP CONSTRAINT IF EXISTS repair_job_repairer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.repair_job DROP CONSTRAINT IF EXISTS repair_job_payment_verified_by_fkey;
ALTER TABLE IF EXISTS ONLY public.repair_job DROP CONSTRAINT IF EXISTS repair_job_payment_method_id_fkey;
ALTER TABLE IF EXISTS ONLY public.repair_job DROP CONSTRAINT IF EXISTS repair_job_device_id_fkey;
ALTER TABLE IF EXISTS ONLY public.repair_job_detail DROP CONSTRAINT IF EXISTS repair_job_detail_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.repair_job_detail DROP CONSTRAINT IF EXISTS repair_job_detail_job_id_fkey;
ALTER TABLE IF EXISTS ONLY public.repair_job_detail DROP CONSTRAINT IF EXISTS repair_job_detail_action_type_id_fkey;
ALTER TABLE IF EXISTS ONLY public.quotation DROP CONSTRAINT IF EXISTS quotation_quote_status_id_fkey;
ALTER TABLE IF EXISTS ONLY public.quotation DROP CONSTRAINT IF EXISTS quotation_job_id_fkey;
ALTER TABLE IF EXISTS ONLY public.quotation_details DROP CONSTRAINT IF EXISTS quotation_details_quote_id_fkey;
ALTER TABLE IF EXISTS ONLY public.quotation_details DROP CONSTRAINT IF EXISTS quotation_details_item_id_fkey;
ALTER TABLE IF EXISTS ONLY public.profiles DROP CONSTRAINT IF EXISTS profiles_role_id_fkey;
ALTER TABLE IF EXISTS ONLY public.password_reset_tokens DROP CONSTRAINT IF EXISTS password_reset_tokens_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.item DROP CONSTRAINT IF EXISTS item_item_type_id_fkey;
ALTER TABLE IF EXISTS ONLY public.repair_job DROP CONSTRAINT IF EXISTS fk_repair_job_quotation;
ALTER TABLE IF EXISTS ONLY public.device_models DROP CONSTRAINT IF EXISTS device_models_device_type_id_fkey;
ALTER TABLE IF EXISTS ONLY public.device_models DROP CONSTRAINT IF EXISTS device_models_brand_id_fkey;
ALTER TABLE IF EXISTS ONLY public.device DROP CONSTRAINT IF EXISTS device_device_type_id_fkey;
ALTER TABLE IF EXISTS ONLY public.device DROP CONSTRAINT IF EXISTS device_customer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.device DROP CONSTRAINT IF EXISTS device_brand_id_fkey;
ALTER TABLE IF EXISTS ONLY public.brand_device_types DROP CONSTRAINT IF EXISTS brand_device_types_device_type_id_fkey;
ALTER TABLE IF EXISTS ONLY public.brand_device_types DROP CONSTRAINT IF EXISTS brand_device_types_brand_id_fkey;
DROP INDEX IF EXISTS public.idx_repair_job_status_id;
DROP INDEX IF EXISTS public.idx_repair_job_repairer_id;
DROP INDEX IF EXISTS public.idx_repair_job_device_id;
DROP INDEX IF EXISTS public.idx_quotation_job_id;
DROP INDEX IF EXISTS public.idx_quotation_details_quote_id;
DROP INDEX IF EXISTS public.idx_profiles_phone;
DROP INDEX IF EXISTS public.idx_device_customer_id;
ALTER TABLE IF EXISTS ONLY public.device_models DROP CONSTRAINT IF EXISTS uq_brand_model;
ALTER TABLE IF EXISTS ONLY public.status DROP CONSTRAINT IF EXISTS status_pkey;
ALTER TABLE IF EXISTS ONLY public.slips_records DROP CONSTRAINT IF EXISTS slips_records_pkey;
ALTER TABLE IF EXISTS ONLY public.roles DROP CONSTRAINT IF EXISTS roles_pkey;
ALTER TABLE IF EXISTS ONLY public.repair_job DROP CONSTRAINT IF EXISTS repair_job_pkey;
ALTER TABLE IF EXISTS ONLY public.repair_job_detail DROP CONSTRAINT IF EXISTS repair_job_detail_pkey;
ALTER TABLE IF EXISTS ONLY public.quotation_status DROP CONSTRAINT IF EXISTS quotation_status_pkey;
ALTER TABLE IF EXISTS ONLY public.quotation DROP CONSTRAINT IF EXISTS quotation_pkey;
ALTER TABLE IF EXISTS ONLY public.quotation_details DROP CONSTRAINT IF EXISTS quotation_details_pkey;
ALTER TABLE IF EXISTS ONLY public.profiles DROP CONSTRAINT IF EXISTS profiles_pkey;
ALTER TABLE IF EXISTS ONLY public.profiles DROP CONSTRAINT IF EXISTS profiles_email_key;
ALTER TABLE IF EXISTS ONLY public.payment_method DROP CONSTRAINT IF EXISTS payment_method_pkey;
ALTER TABLE IF EXISTS ONLY public.password_reset_tokens DROP CONSTRAINT IF EXISTS password_reset_tokens_token_key;
ALTER TABLE IF EXISTS ONLY public.password_reset_tokens DROP CONSTRAINT IF EXISTS password_reset_tokens_pkey;
ALTER TABLE IF EXISTS ONLY public.item_type DROP CONSTRAINT IF EXISTS item_type_pkey;
ALTER TABLE IF EXISTS ONLY public.item DROP CONSTRAINT IF EXISTS item_pkey;
ALTER TABLE IF EXISTS ONLY public.device_types DROP CONSTRAINT IF EXISTS device_types_pkey;
ALTER TABLE IF EXISTS ONLY public.device DROP CONSTRAINT IF EXISTS device_pkey;
ALTER TABLE IF EXISTS ONLY public.device_models DROP CONSTRAINT IF EXISTS device_models_pkey;
ALTER TABLE IF EXISTS ONLY public.brands DROP CONSTRAINT IF EXISTS brands_pkey;
ALTER TABLE IF EXISTS ONLY public.brand_device_types DROP CONSTRAINT IF EXISTS brand_device_types_pkey;
ALTER TABLE IF EXISTS ONLY public.action_type DROP CONSTRAINT IF EXISTS action_type_pkey;
ALTER TABLE IF EXISTS public.status ALTER COLUMN status_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.slips_records ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.roles ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.repair_job_detail ALTER COLUMN job_id_detail DROP DEFAULT;
ALTER TABLE IF EXISTS public.repair_job ALTER COLUMN job_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.quotation_status ALTER COLUMN quote_status_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.quotation_details ALTER COLUMN details_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.quotation ALTER COLUMN quotation_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.profiles ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.payment_method ALTER COLUMN payment_method_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.password_reset_tokens ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.item_type ALTER COLUMN item_type_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.item ALTER COLUMN item_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.device_types ALTER COLUMN device_type_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.device_models ALTER COLUMN model_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.device ALTER COLUMN device_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.brands ALTER COLUMN brand_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.action_type ALTER COLUMN action_type_id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.status_status_id_seq;
DROP SEQUENCE IF EXISTS public.slips_records_new_id_seq;
DROP TABLE IF EXISTS public.slips_records;
DROP SEQUENCE IF EXISTS public.roles_id_seq;
DROP TABLE IF EXISTS public.roles;
DROP VIEW IF EXISTS public.repair_jobs_view;
DROP TABLE IF EXISTS public.status;
DROP SEQUENCE IF EXISTS public.repair_job_job_id_seq;
DROP SEQUENCE IF EXISTS public.repair_job_detail_job_id_detail_seq;
DROP TABLE IF EXISTS public.repair_job_detail;
DROP TABLE IF EXISTS public.repair_job;
DROP SEQUENCE IF EXISTS public.quotation_status_quote_status_id_seq;
DROP TABLE IF EXISTS public.quotation_status;
DROP SEQUENCE IF EXISTS public.quotation_quotation_id_seq;
DROP SEQUENCE IF EXISTS public.quotation_details_details_id_seq;
DROP TABLE IF EXISTS public.quotation_details;
DROP TABLE IF EXISTS public.quotation;
DROP SEQUENCE IF EXISTS public.profiles_new_id_seq;
DROP TABLE IF EXISTS public.profiles;
DROP SEQUENCE IF EXISTS public.payment_method_payment_method_id_seq;
DROP TABLE IF EXISTS public.payment_method;
DROP SEQUENCE IF EXISTS public.password_reset_tokens_id_seq;
DROP TABLE IF EXISTS public.password_reset_tokens;
DROP SEQUENCE IF EXISTS public.item_type_item_type_id_seq;
DROP TABLE IF EXISTS public.item_type;
DROP SEQUENCE IF EXISTS public.item_item_id_seq;
DROP TABLE IF EXISTS public.item;
DROP SEQUENCE IF EXISTS public.device_types_device_type_id_seq;
DROP TABLE IF EXISTS public.device_types;
DROP SEQUENCE IF EXISTS public.device_models_model_id_seq;
DROP TABLE IF EXISTS public.device_models;
DROP SEQUENCE IF EXISTS public.device_device_id_seq;
DROP TABLE IF EXISTS public.device;
DROP SEQUENCE IF EXISTS public.brands_brand_id_seq;
DROP TABLE IF EXISTS public.brands;
DROP TABLE IF EXISTS public.brand_device_types;
DROP SEQUENCE IF EXISTS public.action_type_action_type_id_seq;
DROP TABLE IF EXISTS public.action_type;
DROP EXTENSION IF EXISTS pgcrypto;
--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: action_type; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.action_type (
    action_type_id integer NOT NULL,
    action_type_name text NOT NULL
);


--
-- Name: action_type_action_type_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.action_type_action_type_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: action_type_action_type_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.action_type_action_type_id_seq OWNED BY public.action_type.action_type_id;


--
-- Name: brand_device_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.brand_device_types (
    brand_id integer NOT NULL,
    device_type_id integer NOT NULL
);


--
-- Name: brands; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.brands (
    brand_id integer NOT NULL,
    brand_name text NOT NULL
);


--
-- Name: brands_brand_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.brands_brand_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: brands_brand_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.brands_brand_id_seq OWNED BY public.brands.brand_id;


--
-- Name: device; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.device (
    device_id integer NOT NULL,
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
    customer_id integer
);


--
-- Name: device_device_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.device_device_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: device_device_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.device_device_id_seq OWNED BY public.device.device_id;


--
-- Name: device_models; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.device_models (
    model_id integer NOT NULL,
    brand_id integer,
    device_type_id integer,
    model_name text NOT NULL
);


--
-- Name: device_models_model_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.device_models_model_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: device_models_model_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.device_models_model_id_seq OWNED BY public.device_models.model_id;


--
-- Name: device_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.device_types (
    device_type_id integer NOT NULL,
    device_type_name text NOT NULL
);


--
-- Name: device_types_device_type_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.device_types_device_type_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: device_types_device_type_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.device_types_device_type_id_seq OWNED BY public.device_types.device_type_id;


--
-- Name: item; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.item (
    item_id integer NOT NULL,
    item_name text NOT NULL,
    item_type_id integer,
    selling_price numeric(10,2) DEFAULT 0,
    cost_price numeric(10,2) DEFAULT 0
);


--
-- Name: item_item_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.item_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: item_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.item_item_id_seq OWNED BY public.item.item_id;


--
-- Name: item_type; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.item_type (
    item_type_id integer NOT NULL,
    item_type_name text NOT NULL
);


--
-- Name: item_type_item_type_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.item_type_item_type_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: item_type_item_type_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.item_type_item_type_id_seq OWNED BY public.item_type.item_type_id;


--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_reset_tokens (
    id integer NOT NULL,
    token text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    used boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    user_id integer
);


--
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.password_reset_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.password_reset_tokens_id_seq OWNED BY public.password_reset_tokens.id;


--
-- Name: payment_method; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_method (
    payment_method_id integer NOT NULL,
    payment_method_name text NOT NULL
);


--
-- Name: payment_method_payment_method_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.payment_method_payment_method_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: payment_method_payment_method_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.payment_method_payment_method_id_seq OWNED BY public.payment_method.payment_method_id;


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    email text NOT NULL,
    password text NOT NULL,
    first_name text,
    last_name text,
    phone text,
    role_id integer DEFAULT 4,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    id integer CONSTRAINT profiles_new_id_not_null NOT NULL
);


--
-- Name: profiles_new_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.profiles_new_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: profiles_new_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.profiles_new_id_seq OWNED BY public.profiles.id;


--
-- Name: quotation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quotation (
    quotation_id integer NOT NULL,
    job_id integer,
    total_repair_price numeric(10,2) DEFAULT 0,
    total_cancel_price numeric(10,2) DEFAULT 0,
    quote_status_id integer DEFAULT 1,
    customer_remark text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: quotation_details; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quotation_details (
    details_id integer NOT NULL,
    quote_id integer,
    item_id integer,
    quantity numeric(10,2) DEFAULT 1,
    unit_price numeric(10,2) DEFAULT 0,
    total_price numeric(10,2) DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    unit_cost numeric(10,2) DEFAULT 0
);


--
-- Name: quotation_details_details_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.quotation_details_details_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: quotation_details_details_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.quotation_details_details_id_seq OWNED BY public.quotation_details.details_id;


--
-- Name: quotation_quotation_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.quotation_quotation_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: quotation_quotation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.quotation_quotation_id_seq OWNED BY public.quotation.quotation_id;


--
-- Name: quotation_status; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quotation_status (
    quote_status_id integer NOT NULL,
    quote_status_name text NOT NULL
);


--
-- Name: quotation_status_quote_status_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.quotation_status_quote_status_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: quotation_status_quote_status_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.quotation_status_quote_status_id_seq OWNED BY public.quotation_status.quote_status_id;


--
-- Name: repair_job; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.repair_job (
    job_id integer NOT NULL,
    device_id integer,
    quotation_id integer,
    symptom_details text,
    appointment_date date,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    customer_receive_signature text,
    total_amount numeric(10,2) DEFAULT 0,
    slip_image text,
    payment_date date,
    payment_method_id integer,
    status_id integer DEFAULT 1,
    actual_symptom text,
    payment_verified boolean DEFAULT false,
    payment_verified_at timestamp with time zone,
    payment_reject_reason text,
    repaired_at timestamp with time zone,
    return_date timestamp without time zone,
    repairer_id integer,
    payment_verified_by integer
);


--
-- Name: repair_job_detail; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.repair_job_detail (
    job_id_detail integer NOT NULL,
    job_id integer,
    action_type_id integer,
    action_date date DEFAULT CURRENT_DATE,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    remark text,
    user_id integer
);


--
-- Name: repair_job_detail_job_id_detail_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.repair_job_detail_job_id_detail_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: repair_job_detail_job_id_detail_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.repair_job_detail_job_id_detail_seq OWNED BY public.repair_job_detail.job_id_detail;


--
-- Name: repair_job_job_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.repair_job_job_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: repair_job_job_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.repair_job_job_id_seq OWNED BY public.repair_job.job_id;


--
-- Name: status; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.status (
    status_id integer NOT NULL,
    status_name text NOT NULL
);


--
-- Name: repair_jobs_view; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.repair_jobs_view AS
 SELECT rj.job_id AS id,
    ('REP-'::text || lpad((rj.job_id)::text, 6, '0'::text)) AS job_number,
    COALESCE(((p.first_name || ' '::text) || p.last_name), 'ไม่ระบุ'::text) AS customer_name,
    COALESCE(p.phone, ''::text) AS phone,
    COALESCE(p.email, ''::text) AS email,
    COALESCE(dt.device_type_name, ''::text) AS device_type,
    COALESCE(b.brand_name, ''::text) AS brand,
    COALESCE(d.model, ''::text) AS model,
    COALESCE(d.serial_number, ''::text) AS serial_number,
    COALESCE(d.included_accessories, ''::text) AS accessories,
    COALESCE(d.important_software, ''::text) AS important_programs,
    COALESCE(d.device_password, ''::text) AS password,
    d.warranty_year AS warranty_years,
    d.warranty_end_date,
    COALESCE(rj.symptom_details, 'ไม่ระบุอาการ'::text) AS symptoms,
    COALESCE(rj.symptom_details, 'ไม่ระบุอาการ'::text) AS symptom_details,
    COALESCE(rj.actual_symptom, rj.symptom_details, 'ไม่ระบุอาการ'::text) AS actual_symptom,
    COALESCE(s.status_name, 'ไม่ระบุ'::text) AS status,
    rj.status_id,
    rj.total_amount,
    rj.payment_date,
    rj.slip_image,
    rj.customer_receive_signature,
    rj.appointment_date,
    rj.created_at,
    rj.device_id,
    rj.quotation_id,
    rj.payment_method_id,
    COALESCE(pm.payment_method_name, ''::text) AS payment_method_name,
    d.customer_id,
    q.customer_remark
   FROM (((((((public.repair_job rj
     LEFT JOIN public.device d ON ((rj.device_id = d.device_id)))
     LEFT JOIN public.device_types dt ON ((d.device_type_id = dt.device_type_id)))
     LEFT JOIN public.brands b ON ((d.brand_id = b.brand_id)))
     LEFT JOIN public.profiles p ON ((d.customer_id = p.id)))
     LEFT JOIN public.status s ON ((rj.status_id = s.status_id)))
     LEFT JOIN public.payment_method pm ON ((rj.payment_method_id = pm.payment_method_id)))
     LEFT JOIN public.quotation q ON ((rj.quotation_id = q.quotation_id)));


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    name text NOT NULL
);


--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: slips_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.slips_records (
    image_url text NOT NULL,
    uploaded_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    id integer CONSTRAINT slips_records_new_id_not_null NOT NULL,
    user_id integer
);


--
-- Name: slips_records_new_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.slips_records_new_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: slips_records_new_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.slips_records_new_id_seq OWNED BY public.slips_records.id;


--
-- Name: status_status_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.status_status_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: status_status_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.status_status_id_seq OWNED BY public.status.status_id;


--
-- Name: action_type action_type_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.action_type ALTER COLUMN action_type_id SET DEFAULT nextval('public.action_type_action_type_id_seq'::regclass);


--
-- Name: brands brand_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brands ALTER COLUMN brand_id SET DEFAULT nextval('public.brands_brand_id_seq'::regclass);


--
-- Name: device device_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.device ALTER COLUMN device_id SET DEFAULT nextval('public.device_device_id_seq'::regclass);


--
-- Name: device_models model_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.device_models ALTER COLUMN model_id SET DEFAULT nextval('public.device_models_model_id_seq'::regclass);


--
-- Name: device_types device_type_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.device_types ALTER COLUMN device_type_id SET DEFAULT nextval('public.device_types_device_type_id_seq'::regclass);


--
-- Name: item item_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item ALTER COLUMN item_id SET DEFAULT nextval('public.item_item_id_seq'::regclass);


--
-- Name: item_type item_type_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_type ALTER COLUMN item_type_id SET DEFAULT nextval('public.item_type_item_type_id_seq'::regclass);


--
-- Name: password_reset_tokens id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens ALTER COLUMN id SET DEFAULT nextval('public.password_reset_tokens_id_seq'::regclass);


--
-- Name: payment_method payment_method_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_method ALTER COLUMN payment_method_id SET DEFAULT nextval('public.payment_method_payment_method_id_seq'::regclass);


--
-- Name: profiles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles ALTER COLUMN id SET DEFAULT nextval('public.profiles_new_id_seq'::regclass);


--
-- Name: quotation quotation_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotation ALTER COLUMN quotation_id SET DEFAULT nextval('public.quotation_quotation_id_seq'::regclass);


--
-- Name: quotation_details details_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotation_details ALTER COLUMN details_id SET DEFAULT nextval('public.quotation_details_details_id_seq'::regclass);


--
-- Name: quotation_status quote_status_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotation_status ALTER COLUMN quote_status_id SET DEFAULT nextval('public.quotation_status_quote_status_id_seq'::regclass);


--
-- Name: repair_job job_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repair_job ALTER COLUMN job_id SET DEFAULT nextval('public.repair_job_job_id_seq'::regclass);


--
-- Name: repair_job_detail job_id_detail; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repair_job_detail ALTER COLUMN job_id_detail SET DEFAULT nextval('public.repair_job_detail_job_id_detail_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: slips_records id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.slips_records ALTER COLUMN id SET DEFAULT nextval('public.slips_records_new_id_seq'::regclass);


--
-- Name: status status_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.status ALTER COLUMN status_id SET DEFAULT nextval('public.status_status_id_seq'::regclass);


--
-- Data for Name: action_type; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.action_type (action_type_id, action_type_name) FROM stdin;
1	รับเครื่องซ่อม
2	เริ่มตรวจเช็คสภาพเครื่อง
3	ออกใบเสนอราคา
4	เริ่มดำเนินการซ่อม
5	ซ่อมเสร็จสิ้น / ทดสอบเครื่อง
6	รับชำระเงิน
7	ส่งมอบเครื่องให้ลูกค้า
8	ยกเลิกการซ่อม
\.


--
-- Data for Name: brand_device_types; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.brand_device_types (brand_id, device_type_id) FROM stdin;
1	1
1	2
1	3
1	4
2	1
2	2
2	3
2	4
3	1
3	2
3	3
3	4
4	1
4	2
4	3
4	5
5	1
5	2
5	3
6	1
6	2
6	3
7	1
7	2
7	4
8	1
9	1
10	4
11	1
11	2
11	4
12	1
12	2
12	4
13	1
15	3
15	4
16	4
17	4
18	4
19	4
20	5
21	5
22	5
23	5
24	5
25	5
26	4
27	6
28	6
29	6
30	6
5	7
6	7
8	7
9	7
10	7
26	7
14	2
14	3
14	6
\.


--
-- Data for Name: brands; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.brands (brand_id, brand_name) FROM stdin;
1	ASUS
2	Acer
3	Dell
4	HP
5	Lenovo
6	Apple
7	MSI
8	Huawei
9	Microsoft Surface
10	Samsung
11	Gigabyte
12	Alienware
13	Razer
15	LG
16	BenQ
17	ViewSonic
18	AOC
19	Philips
20	Epson
21	Canon
22	Brother
23	Pantum
24	Ricoh
25	Fuji Xerox
26	Xiaomi
27	APC
28	Western Digital (WD)
29	Seagate
30	อื่นๆ / ทั่วไป
14	ประกอบเอง / Custom PC (ไม่ระบุยี่ห้อ)
\.


--
-- Data for Name: device; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.device (device_id, device_type_id, brand_id, model, included_accessories, warranty_year, warranty_end_date, serial_number, important_software, device_password, created_at, customer_id) FROM stdin;
5	1	1	Tuf	สายชาร์จไม่มี	1	\N	515151616	-	1234	2026-09-13 02:02:59.460224-01	\N
2	1	1	TUFGAMING	Adapter	0	\N	ไม่มี	-	-	2026-09-03 13:18:10.042055-01	4
3	5	21	9886123315	ไม่มี	0	\N	9886123315561	-	-	2026-09-10 10:47:00.193493-01	4
4	5	22	Printing 15	Adapter	0	\N	251161515	-	-	2026-09-10 14:58:15.191561-01	4
6	1	1	TUF Gaming A15 / F15	Adapter	0	\N	315216515615	-	-	2026-09-15 15:32:21.317348-01	4
7	2	26	ไม่มี	Adapter	0	\N	ไม่มี	-	-	2026-09-17 11:24:07.021701-01	6
8	1	1	TUF Gaming A15 / F15	adapter	0	\N	123426516	-	-	2026-09-17 11:30:06.044213-01	6
9	1	1	ROG Strix G15 / G16	adapter	0	\N	ฟไกฟหก	-	-	2026-09-17 11:36:33.15777-01	6
10	1	4	OMEN 16 / 17	สายชาร์จ	0	2026-09-25	321564645	-	-	2026-09-25 12:42:41.796173-01	6
11	1	3	XPS 13 / 15 / 16	สายชาร์จ	0	\N	6810205	-	-	2026-09-25 12:49:48.966236-01	6
13	2	14	สเปกประกอบเอง (ระบุรายละเอียดเพิ่มเติม)	-	0	\N	-	-	-	2026-10-05 13:24:29.184907-01	4
14	2	14	สเปกประกอบเอง (ระบุรายละเอียดเพิ่มเติม)	-	0	\N	-	-	-	2026-10-05 13:42:20.090893-01	4
15	1	2	Predator Helios 16 / 18	สายชาร์จ	0	\N	-	-	-	2026-10-05 14:08:46.245561-01	4
16	1	1	TUF Gaming A15 / F15	สายชาร์จ	0	\N	156523231	-	-	2026-10-08 11:22:50.277648-01	6
17	2	14	สเปกประกอบเอง (ระบุรายละเอียดเพิ่มเติม)	-	1	\N	-	-	-	2026-10-08 12:32:05.701675-01	6
\.


--
-- Data for Name: device_models; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.device_models (model_id, brand_id, device_type_id, model_name) FROM stdin;
1	1	1	ROG Strix G15 / G16
2	1	1	TUF Gaming A15 / F15
3	1	1	ZenBook 14 OLED
4	1	1	VivoBook 15 / S14
5	1	2	ROG Strix GT35
6	2	1	Nitro 5 / Nitro 16
7	2	1	Predator Helios 300 / 16
9	2	1	Swift Go 14 / Swift 3
10	2	3	Aspire C24 All-in-One
11	3	1	Inspiron 15 / 14
12	3	1	XPS 13 / 15 / 16
13	3	1	G15 / G16 Gaming
14	3	1	Latitude 3420 / 5420
15	3	2	OptiPlex 7090 Tower
16	4	1	Victus 15 / 16
17	4	1	OMEN 16 / 17
18	4	1	Pavilion 14 / 15
19	4	1	Envy x360 14
20	4	3	HP 24 All-in-One PC
21	5	1	LOQ 15 / 16
22	5	1	Legion 5 / Pro 7
23	5	1	IdeaPad Gaming 3 / Slim 3
24	5	1	ThinkPad E14 / X1 Carbon
25	5	2	Legion Tower 5i
26	6	1	MacBook Air M1 / M2 / M3
27	6	1	MacBook Pro 14 / 16 (M-Series)
28	6	3	iMac 24-inch (M-Series)
29	6	2	Mac mini (M-Series)
30	6	2	Mac Studio
31	7	1	Katana 15 / GF63 Thin
32	7	1	Stealth 16 / Raider GE78
33	7	1	Modern 14 / 15
36	1	1	ROG Strix G16 / Scar 18
37	1	1	ROG Zephyrus G14 / G16
38	1	1	ExpertBook B1 / B5
39	2	1	Predator Helios 16 / 18
40	2	1	Swift Go 14 / Swift Edge
41	2	1	TravelMate P2 / P4
42	3	1	Inspiron 14 / 15 / 16
43	3	1	Alienware m16 / x16
44	3	1	Latitude 3420 / 5420 / 7420
45	3	1	Vostro 3510 / 5620
46	4	1	OMEN 16 / Transcend 16
47	4	1	Envy x360 14 / 16
48	4	1	ProBook 440 / 450 G9/G10
49	5	1	Legion 5 / Pro 7i
50	5	1	IdeaPad Gaming 3 / Slim 3 / Slim 5
51	5	1	ThinkPad E14 / T14 / X1 Carbon
52	5	1	Yoga 7 / 9i
53	6	1	MacBook Air 13" (M1 / M2 / M3)
54	6	1	MacBook Air 15" (M2 / M3)
55	6	1	MacBook Pro 14" (M1 / M2 / M3 Pro/Max)
56	6	1	MacBook Pro 16" (M1 / M2 / M3 Pro/Max)
57	7	1	Stealth 14 / 16 Studio
58	7	1	Raider GE78 HX
59	7	1	Cyborg 15
60	8	1	MateBook D14 / D15
61	8	1	MateBook 14s
62	8	1	MateBook X Pro
63	9	1	Surface Laptop 4 / 5
64	9	1	Surface Laptop Studio
65	11	1	AORUS 15 / 17
66	11	1	G5 / G7 Gaming Laptop
67	11	1	AERO 14 / 16 OLED
68	13	1	Razer Blade 14 / 15 / 16 / 18
72	1	2	ROG Strix GT35 / G15DK
73	1	2	ExpertCenter D5 / D7 Tower
74	2	2	Predator Orion 3000 / 7000
75	2	2	Nitro 50 Desktop
76	2	2	Aspire TC-1780
77	3	2	OptiPlex 3090 / 7090 Tower / SFF
78	3	2	Inspiron Desktop 3910
79	3	2	Alienware Aurora R15 / R16
80	4	2	OMEN 25L / 40L Desktop
81	4	2	Victus 15L Gaming Desktop
82	4	2	ProDesk 400 / 600 G6 Microtower
83	5	2	Legion Tower 5i / 7i
84	5	2	IdeaCentre Gaming 5
85	5	2	ThinkCentre M70s / M90t
86	6	2	Mac mini (M2 / M2 Pro / M4)
87	6	2	Mac Studio (M2 Max / M2 Ultra)
88	6	2	Mac Pro
89	7	2	MAG Infinite S3 / Infinite E1
90	6	3	iMac 24-inch (M1 / M3)
91	6	3	iMac 27-inch Retina 5K
92	4	3	HP 24 All-in-One PC (24-cb / 24-df)
93	4	3	HP 27 All-in-One PC
94	4	3	HP EliteOne 800 G6/G8 AIO
95	2	3	Aspire C27 All-in-One
96	1	3	Zen AiO 24 (A5401)
97	1	3	ExpertCenter E5 AiO 24
98	1	3	Vivo AiO V241
99	5	3	IdeaCentre AIO 3 (24" / 27")
100	5	3	IdeaCentre AIO 5
101	5	3	ThinkCentre Neo 30a / 50a
102	3	3	Inspiron 24 All-in-One (5410 / 5420)
103	3	3	Inspiron 27 All-in-One (7710 / 7720)
104	3	3	OptiPlex 7400 / 7410 AIO
105	15	4	UltraGear 27GP850-B (2K Nano IPS 165Hz)
106	15	4	UltraGear 24GN600-B (FHD IPS 144Hz)
107	15	4	LG 24MP400-B / 27MP400 (IPS 75Hz)
108	15	4	LG 27UL500-W (4K UHD HDR)
109	15	4	LG DualUp 28MQ780 (16:18 Ergo)
110	10	4	Odyssey G3 (24" / 27" 144Hz)
111	10	4	Odyssey G5 (27" / 32" Curved 2K 165Hz)
112	10	4	Odyssey G7 / G9 (Curved 240Hz)
113	10	4	ViewFinity S6 / S8 (4K IPS)
114	10	4	Essential Monitor S3 (24" / 27")
115	1	4	TUF Gaming VG259QR (24.5" IPS 165Hz)
116	1	4	TUF Gaming VG27AQ (27" 2K 165Hz)
117	1	4	ROG Swift PG279QM (240Hz 1ms)
118	1	4	Eye Care VA24EHE (23.8" IPS 75Hz)
119	1	4	ProArt Display PA278CV (Creator 2K)
120	3	4	UltraSharp U2723QE (27" 4K IPS Black)
121	3	4	Gaming G2724D (27" 2K Fast IPS 165Hz)
122	3	4	S2421HS / S2721HS (IPS 75Hz)
123	3	4	Alienware AW2524H (500Hz Fast IPS)
124	16	4	ZOWIE XL2546K (24.5" 240Hz DyAc+)
125	16	4	ZOWIE XL2411K (24" 144Hz)
126	16	4	MOBIUZ EX2710S (27" IPS 165Hz)
127	16	4	EW2780Q (27" 2K HDRi)
128	18	4	24G2 / 24G2SP (23.8" IPS 165Hz)
129	18	4	27G2 / 27G2SP (27" IPS 165Hz)
130	18	4	CQ27G2 (27" Curved 2K 144Hz)
131	18	4	24B2XH (23.8" IPS 75Hz)
132	17	4	VX2758-2KP-MHD (27" 2K 144Hz)
133	17	4	Omni VX2428 (23.8" Fast IPS 180Hz)
134	17	4	VA2432-H (23.8" IPS 75Hz)
135	19	4	242E1GSJ (23.8" 144Hz 1ms)
136	19	4	27M1N3200Z (27" IPS 165Hz)
137	19	4	241V8 (23.8" IPS 75Hz)
138	20	5	EcoTank L3210 (All-in-One Ink Tank)
139	20	5	EcoTank L3250 (All-in-One Wi-Fi)
140	20	5	EcoTank L5290 (All-in-One Wi-Fi Fax ADF)
141	20	5	EcoTank L18050 (A3+ 6-Color Photo)
142	20	5	Perfection V39II (Photo Scanner)
143	21	5	PIXMA G2010 / G2020 (Ink Tank 3-in-1)
144	21	5	PIXMA G3010 / G3020 (Ink Tank Wi-Fi)
145	21	5	imageCLASS LBP6030 / LBP6030w (Mono Laser)
146	21	5	imageCLASS MF3010 (Mono Laser 3-in-1)
147	21	5	CanoScan LiDE 300 / 400 (Flatbed Scanner)
148	22	5	DCP-T420W / DCP-T520W (Ink Tank Wi-Fi)
149	22	5	DCP-T720W / DCP-T820DW (Auto Duplex Wi-Fi)
150	22	5	HL-1210W (Compact Mono Laser Wi-Fi)
151	22	5	MFC-T920DW (All-in-One Duplex Fax)
152	22	5	ADS-1700W (Document Scanner)
153	4	5	Smart Tank 515 / 580 (All-in-One Wi-Fi)
154	4	5	Smart Tank 615 / 750 (Duplex ADF)
155	4	5	LaserJet Pro M12a / M15a (Mono Laser)
156	4	5	LaserJet MFP M141w (Laser 3-in-1 Wi-Fi)
157	4	5	ScanJet Pro 2600 f1 (Flatbed Scanner)
158	24	5	SP 230DNw / SP 230SFNw (Laser Wi-Fi)
159	24	5	M 2701 (A3 Monochrome MFP)
160	25	5	DocuPrint P285 dw (Laser Duplex Wi-Fi)
161	25	5	DocuPrint M285 z (Laser 4-in-1)
162	23	5	P2500W (Mono Laser Wi-Fi)
163	23	5	M6550NW (Mono Laser MFP)
164	27	6	Back-UPS 650VA / 1000VA (BV650I / BX1100LI)
165	27	6	Easy UPS SMV 1500VA
166	28	6	My Passport 1TB / 2TB / 4TB (External HDD)
167	28	6	My Book 4TB / 8TB (Desktop HDD)
168	29	6	One Touch 2TB / 4TB (External HDD)
169	29	6	Expansion Desktop 4TB / 8TB
170	30	6	อุปกรณ์แปลงสัญญาณ / สายเคเบิล / อะแดปเตอร์
171	30	6	เครื่องสำรองไฟทั่วไป (UPS Non-Brand)
193	14	2	Custom PC (สเปกทั่วไป / ทำงาน Office)
194	14	2	Custom Gaming PC (สเปกเล่นเกม / RGB)
195	14	2	Custom Workstation PC (งานตัดต่อ / 3D Render)
196	14	2	Custom Mini-ITX PC (เคสขนาดเล็ก)
197	14	2	Custom Liquid Cooling PC (ชุดน้ำเปิด/ปิด)
198	14	2	สเปกประกอบเอง (ระบุรายละเอียดเพิ่มเติม)
172	6	7	iPad 9th / 10th Gen (10.2" / 10.9")
177	10	7	Galaxy Tab S9 / S9+ / S9 Ultra
182	8	7	MatePad 11.5 (PaperMatte)
183	8	7	MatePad Pro 13.2
184	8	7	MatePad SE 10.4
185	9	7	Surface Pro 8 / 9 / 10
186	9	7	Surface Go 3 / 4
187	5	7	Tab P11 Pro / P12
188	5	7	Tab M10 / M11 Plus
173	6	7	iPad Air (M1 / M2 11" & 13")
174	6	7	iPad Pro 11" (M1 / M2 / M4)
175	6	7	iPad Pro 12.9" / 13" (M1 / M2 / M4)
176	6	7	iPad mini 5 / mini 6
178	10	7	Galaxy Tab S9 FE / FE+
179	10	7	Galaxy Tab A9 / A9+
180	26	7	Xiaomi Pad 6 / 6S Pro
181	26	7	Redmi Pad SE / Pad Pro
\.


--
-- Data for Name: device_types; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.device_types (device_type_id, device_type_name) FROM stdin;
1	Notebook / Laptop
2	Desktop PC
3	All-in-One PC
4	Monitor
5	Printer / Scanner
7	Tablet / iPad
6	Other
\.


--
-- Data for Name: item; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.item (item_id, item_name, item_type_id, selling_price, cost_price) FROM stdin;
25	ค่าบริการตรวจเช็คสภาพเครื่องเบื้องต้น (Diagnostic Fee)	2	300.00	0.00
26	ค่าบริการติดตั้ง Windows, ไดรเวอร์ และโปรแกรมพื้นฐาน	2	500.00	0.00
27	ค่าบริการทำความสะอาดฝุ่นและทาซิลิโคนระบายความร้อน (PC / All-in-One)	2	400.00	0.00
28	ค่าบริการทำความสะอาดฝุ่นและทาซิลิโคนระบายความร้อน (Notebook)	2	500.00	0.00
29	ค่าบริการเปลี่ยนและติดตั้งอุปกรณ์ (RAM / SSD / Power Supply / GPU)	2	200.00	0.00
30	ค่าบริการเปลี่ยนจอภาพ Notebook / All-in-One PC	2	500.00	0.00
31	ค่าบริการเปลี่ยนคีย์บอร์ด / ทัชแพด Notebook	2	400.00	0.00
32	ค่าบริการซ่อมเมนบอร์ด / ซ่อมระบบไฟ / ยกเปลี่ยนชิปไอซี	2	1500.00	0.00
44	Test Service A	2	600.00	0.00
5	SSD M.2 NVMe 1TB PCIe 4.0 (Kingston/WD/Samsung)	1	2590.00	2400.00
1	RAM DDR4 8GB Kingston/Corsair 3200MHz (PC/NB)	1	950.00	740.00
2	RAM DDR4 16GB Kingston/Corsair 3200MHz (PC/NB)	1	1690.00	1320.00
3	RAM DDR5 16GB Kingston Fury 5600MHz	1	2450.00	1910.00
4	SSD M.2 NVMe 500GB PCIe 4.0 (Kingston/WD)	1	1550.00	1210.00
6	SSD SATA III 2.5" 512GB (Kingston/Hikvision)	1	1390.00	1080.00
7	พาวเวอร์ซัพพลาย 650W 80+ Bronze (Corsair/Cooler Master)	1	1850.00	1440.00
8	พาวเวอร์ซัพพลาย 750W 80+ Gold (Corsair/Thermaltake)	1	3190.00	2490.00
9	พัดลมเคสระบายความร้อน 120mm ARGB Pack 3	1	790.00	620.00
10	ชุดพัดลมระบายความร้อน CPU Air Cooler (Deepcool/Thermalright)	1	890.00	690.00
11	ชุดระบายความร้อนด้วยน้ำ CPU 240mm Liquid Cooler	1	2390.00	1860.00
12	จอแสดงผล Notebook 14.0" Full HD IPS 60Hz (Slim 30-Pin)	1	1950.00	1520.00
13	จอแสดงผล Notebook 15.6" Full HD IPS 144Hz (Gaming 40-Pin)	1	2650.00	2070.00
14	แบตเตอรี่ Notebook OEM Grade A (Asus/Acer/Dell/HP/Lenovo)	1	1450.00	1130.00
15	คีย์บอร์ด Notebook (OEM Thai/Eng Backlight)	1	850.00	660.00
16	พัดลมระบายความร้อน Notebook (CPU/GPU Fan OEM)	1	650.00	510.00
17	อะแดปเตอร์ชาร์จไฟ Notebook 65W Type-C (Universal)	1	890.00	690.00
18	อะแดปเตอร์ชาร์จไฟ Notebook 19V 4.74A (Universal)	1	690.00	540.00
19	หัวพิมพ์เครื่องพิมพ์ Epson L-Series (Print Head OEM)	1	1750.00	1370.00
20	ชุดลูกยางดึงกระดาษ Printer (Pickup Roller Kit)	1	350.00	270.00
22	บอร์ดจ่ายไฟจอ Monitor (Power Board / Adapter Monitor)	1	750.00	590.00
23	การ์ด Wi-Fi 6 + Bluetooth 5.2 PCIe/M.2 (Intel AX200/AX210)	1	790.00	620.00
21	กล่องซับหมึกพร้อมชิปรีเซ็ต (Maintenance Box Epson/Canon)	1	490.00	380.00
45	Test Part A	1	600.00	470.00
\.


--
-- Data for Name: item_type; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.item_type (item_type_id, item_type_name) FROM stdin;
1	อะไหล่ (Hardware/Part)
2	ค่าบริการ (Service Fee)
\.


--
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.password_reset_tokens (id, token, expires_at, used, created_at, user_id) FROM stdin;
1	ab4d0645e2e764fb789e470893aeba9f11fa1ab40b1424b343654f45f44baa76	2026-09-03 12:46:40.01-01	t	2026-09-03 12:31:40.011162-01	4
2	c4e7d709740dd0c4579b54ec320b3a6f7c87346ee34932c6c97d89c19905e7c4	2026-09-03 12:48:23.561-01	t	2026-09-03 12:33:23.562-01	2
3	3848683e74a53928cc041751214f7e9dec49220480d9a93e3e5cc85c71ccd569	2026-09-17 11:28:09.316-01	t	2026-09-17 11:13:09.317787-01	6
4	8fdd8f58b21489a8f65613d0849a46d7202a39396b4ef5c2c271434299181eab	2026-10-04 13:36:08.462-01	f	2026-10-04 13:21:08.46574-01	9
\.


--
-- Data for Name: payment_method; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payment_method (payment_method_id, payment_method_name) FROM stdin;
1	เงินสด (Cash)
2	โอนเงิน / สแกน QR (Transfer)
\.


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.profiles (email, password, first_name, last_name, phone, role_id, created_at, id) FROM stdin;
staff1@gmail.com	$2a$10$kWjXpL33HCwL52bb5HQcN.6hEQFMRLy3fJBOrwJz89xftFfwJyZYS	เสมียน	ใจดีมาก	0698512699	3	2026-09-03 12:30:01.384434-01	2
cus1@gmail.com	$2a$10$Yllgh222rcqyyNY.0yinHOJwJa.Z1FZ8TSxWMAX.39YQIFQN1SBlC	ลูกค้า	ใจดีที่สุด	0896513688	4	2026-09-03 12:31:12.003946-01	4
technician1@gmail.com	$2a$10$KiTnNlS41FgAXp7RbZ5SGeASDmZCvhUAQHPriwY2249ROtvm18AVC	ช่างs	ใจดี	0896513032	2	2026-09-03 12:29:23.140321-01	3
maneger2@gmail.com	$2a$10$cZkIjhznbnlXaMTxDqF8DOASVEGXzJp8F76P9BNYdsLy/Anmd3fNG	Thanapon	Sujitapan	0654983111	1	2026-10-04 12:48:40.088949-01	9
staff2@gmail.com	$2a$10$ipP5ObVO.JEm9wXpNOKOHu8SjYXVJ0c48dzrvZzNzUkdBlomRA406	สมหญิง	พบโชค	065987111	3	2026-10-05 13:10:12.463492-01	12
technician2@gmail.com	$2a$10$XJg2ONvjDvTULywwdPjZheZKJBrT6rUzXiToejUkJTOX5PmgqYdsi	สมโชค	พบลัก	064599866	2	2026-10-05 13:08:11.623135-01	11
Manager1234@gmail.com	$2a$10$5cseq1UHtfgMQ.jbD.zTRe//MBxSOJYKtQkMLykyukyfirlVZYUam	ธนพล	สุจิตะพันธ์	0698516971	1	2026-09-03 12:30:40.12024-01	1
customer1@gamill.com	$2a$10$90K6qsrQE5pq/OtgsdpmxeET3FH8/fu9dcyYuXuUwWuEbMG4IT7fS	สมชาย	ใจดี	0654987100	4	2026-09-17 11:10:33.733673-01	6
\.


--
-- Data for Name: quotation; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.quotation (quotation_id, job_id, total_repair_price, total_cancel_price, quote_status_id, customer_remark, created_at) FROM stdin;
3	3	840.00	300.00	2	\N	2026-09-10 15:01:24.808641-01
6	6	4240.00	300.00	3	ลง windows เพิ่มให้ด้วย	2026-09-15 15:37:35.430616-01
8	7	2790.00	300.00	3	\N	2026-09-17 11:25:23.145395-01
4	4	790.00	300.00	2	\N	2026-09-10 15:33:17.806734-01
16	13	2790.00	300.00	2	\N	2026-10-05 13:47:30.340745-01
17	15	2100.00	300.00	3	ลงวินโดร์	2026-10-05 14:10:05.006429-01
18	16	2290.00	300.00	3	\N	2026-10-08 11:28:49.289457-01
19	17	1650.00	300.00	2	ลงโปรแกรทเพิ่ม	2026-10-08 12:32:50.291192-01
9	8	1200.00	300.00	1	เปลี่ยนแรมด้วย	2026-09-17 11:32:16.049161-01
15	10	1200.00	300.00	1	\N	2026-10-02 11:53:37.039014-01
11	9	1200.00	300.00	1	\N	2026-09-17 11:39:33.480523-01
\.


--
-- Data for Name: quotation_details; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.quotation_details (details_id, quote_id, item_id, quantity, unit_price, total_price, created_at, unit_cost) FROM stdin;
3	3	21	1.00	490.00	490.00	2026-09-10 15:01:24.829403-01	0.00
4	4	21	1.00	490.00	490.00	2026-09-10 15:33:17.846496-01	0.00
5	4	25	1.00	300.00	300.00	2026-09-10 15:33:17.852475-01	0.00
15	6	5	1.00	2590.00	2590.00	2026-09-16 12:05:46.079161-01	0.00
16	6	14	1.00	1450.00	1450.00	2026-09-16 12:05:46.086312-01	0.00
17	6	29	1.00	200.00	200.00	2026-09-16 12:05:46.087673-01	0.00
18	8	5	1.00	2590.00	2590.00	2026-09-17 11:25:23.162121-01	0.00
19	8	29	1.00	200.00	200.00	2026-09-17 11:25:23.168103-01	0.00
2	3	\N	1.00	350.00	350.00	2026-09-10 15:01:24.822486-01	0.00
55	16	5	1.00	2590.00	2590.00	2026-10-05 13:47:30.340745-01	0.00
56	16	29	1.00	200.00	200.00	2026-10-05 13:47:30.340745-01	0.00
59	17	4	1.00	1550.00	1550.00	2026-10-05 14:11:09.619936-01	0.00
60	17	20	1.00	350.00	350.00	2026-10-05 14:11:09.619936-01	0.00
61	17	29	1.00	200.00	200.00	2026-10-05 14:11:09.619936-01	0.00
62	18	23	1.00	790.00	790.00	2026-10-08 11:28:49.289457-01	0.00
63	18	32	1.00	1500.00	1500.00	2026-10-08 11:28:49.289457-01	0.00
66	19	22	1.00	750.00	750.00	2026-10-08 12:34:00.773546-01	0.00
67	19	31	1.00	400.00	400.00	2026-10-08 12:34:00.773546-01	0.00
68	19	28	1.00	500.00	500.00	2026-10-08 12:34:00.773546-01	0.00
69	9	45	1.00	600.00	600.00	2026-10-09 13:33:57.831626-01	0.00
70	9	44	1.00	600.00	600.00	2026-10-09 13:33:57.831626-01	0.00
71	15	45	1.00	600.00	600.00	2026-10-09 13:58:00.664131-01	0.00
72	15	44	1.00	600.00	600.00	2026-10-09 13:58:00.664131-01	0.00
73	11	45	1.00	600.00	600.00	2026-10-09 14:16:20.191797-01	0.00
74	11	44	1.00	600.00	600.00	2026-10-09 14:16:20.191797-01	0.00
\.


--
-- Data for Name: quotation_status; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.quotation_status (quote_status_id, quote_status_name) FROM stdin;
1	รอการอนุมัติ
2	อนุมัติแล้ว
3	ยกเลิก
4	ปรับปรุงใบเสนอราคา
5	ขอแก้ไข/เพิ่มเติมรายการ
\.


--
-- Data for Name: repair_job; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.repair_job (job_id, device_id, quotation_id, symptom_details, appointment_date, created_at, customer_receive_signature, total_amount, slip_image, payment_date, payment_method_id, status_id, actual_symptom, payment_verified, payment_verified_at, payment_reject_reason, repaired_at, return_date, repairer_id, payment_verified_by) FROM stdin;
10	10	15	จอพัง	2026-09-25	2026-09-25 12:42:41.830702-01	\N	1200.00	\N	\N	\N	4	\N	f	\N	\N	\N	\N	\N	\N
11	11	\N	พัง	2026-09-25	2026-09-25 12:49:48.990968-01	\N	0.00	\N	\N	\N	1	\N	f	\N	\N	\N	\N	\N	\N
9	9	11	พัง	2026-09-17	2026-09-17 11:36:33.203286-01	\N	1200.00	\N	\N	\N	4	\N	f	\N	\N	\N	\N	\N	\N
13	13	16	พัง	2026-10-04	2026-10-05 13:24:29.299942-01	signatures/signature_REP-000013_20261005_220117.png	2790.00	slips/slip_REP-000013_20261005_220012.png	2026-10-05	2	8	แรมพีง	t	2026-10-05 14:01:17.626782-01	\N	2026-10-05 13:58:54.99042-01	2026-10-05 14:01:17.558621	11	12
2	2	\N	เปิดติดไม่ขึ้นจอ	2026-08-29	2026-09-03 13:18:10.086224-01	signatures/signature_REP-000002_20260916_000901.png	0.00	\N	2026-09-11	1	2	แรมพัง	f	\N	\N	\N	2026-09-15 16:09:01.276325	\N	\N
15	15	17	จอฟ้า	2026-10-05	2026-10-05 14:08:46.299146-01	signatures/signature_REP-000015_20261005_221858.png	300.00	\N	2026-10-05	1	8	แรมพัง	t	2026-10-05 14:18:58.402818-01	\N	\N	2026-10-05 14:18:58.324137	\N	12
6	6	6	ไม่รู้สาเหตุ	2026-09-14	2026-09-15 15:32:21.362304-01	signatures/signature_REP-000006_20260916_204534.png	300.00	\N	2026-09-16	1	8	แรมพัง	t	2026-09-16 12:45:25.3817-01	\N	\N	2026-09-16 12:45:34.59184	\N	2
3	3	3	ปริ้นไม่ออกสี	2026-09-08	2026-09-10 10:47:00.227407-01	signatures/signature_REP-000003_20260926_183307.png	840.00	slips/slip_REP-000003_20260916_002627.jpg	2026-09-15	2	8	ซับหมึกหมด	t	2026-09-26 10:33:08.041666-01	\N	2026-09-15 16:10:41.883042-01	2026-09-26 10:33:07.976114	3	2
7	7	8	เปิดดติดไม่ขึ้นจอ	2026-09-16	2026-09-17 11:24:07.052454-01	signatures/signature_REP-000007_20260917_192641.png	300.00	\N	2026-09-17	1	8	แรมเสีย	t	2026-09-17 11:26:34.144921-01	\N	\N	2026-09-17 11:26:41.965979	\N	2
5	5	\N	ล้อไม่หมุน	2026-09-13	2026-09-13 02:02:59.483856-01	\N	0.00	\N	\N	\N	2	10โมงล้อหมุน	f	\N	\N	\N	\N	\N	\N
14	14	\N	จอฟ้า	2026-10-05	2026-10-05 13:42:20.183804-01	\N	0.00	\N	\N	\N	1	\N	f	\N	\N	\N	\N	\N	\N
4	4	4	แสกนเนอร์ พัง	2026-09-07	2026-09-10 14:58:15.218409-01	signature_REP-000004_20260915_230637.png	790.00	\N	2026-09-11	1	5	พัง	t	\N	\N	\N	2026-09-15 15:04:12.713606	\N	\N
16	16	18	จอฟ้า	2026-10-07	2026-10-08 11:22:50.316202-01	signatures/signature_REP-000016_20261008_193008.png	300.00	slips/slip_REP-000016_20261008_192937.jpeg	2026-10-08	2	8	แรมเสีย	t	2026-10-08 11:30:08.457534-01	\N	\N	2026-10-08 11:30:08.414664	\N	12
8	8	9	พัง	2026-09-17	2026-09-17 11:30:06.158794-01	\N	1200.00	\N	\N	\N	4	\N	f	\N	\N	\N	\N	\N	\N
17	17	19	จอฟ้า	2026-10-16	2026-10-08 12:32:05.746317-01	signatures/signature_REP-000017_20261016_145049.png	1650.00	\N	2026-10-16	1	8	แรมพัง	t	2026-10-16 06:50:49.857413-01	\N	2026-10-08 12:35:59.446431-01	2026-10-16 06:50:49.749283	11	2
\.


--
-- Data for Name: repair_job_detail; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.repair_job_detail (job_id_detail, job_id, action_type_id, action_date, created_at, remark, user_id) FROM stdin;
103	10	3	2026-10-02	2026-10-02 11:53:01.278926-01	\N	3
104	10	2	2026-10-02	2026-10-02 11:53:17.617358-01	ช่างลบใบเสนอราคา ถอยสถานะกลับเป็นดำเนินการตรวจเช็ค	3
108	10	3	2026-10-02	2026-10-02 12:27:21.906106-01	ช่างปรับปรุงใบเสนอราคาใหม่ รอลูกค้าอนุมัติ	3
109	10	3	2026-10-02	2026-10-02 12:27:21.942593-01	\N	3
113	13	1	2026-10-05	2026-10-05 13:24:29.377123-01	\N	12
117	4	4	2026-10-05	2026-10-05 13:45:27.428214-01	ลูกค้าอนุมัติการซ่อม	6
120	13	5	2026-10-05	2026-10-05 13:58:54.999604-01	ช่างซ่อมเสร็จสิ้น / ทดสอบเครื่อง เปลี่ยนสถานะเป็นรอชำระ	11
121	13	5	2026-10-05	2026-10-05 13:58:55.032219-01	ช่างซ่อมเสร็จสิ้น / ทดสอบเครื่อง เปลี่ยนสถานะเป็นรอชำระ	11
122	13	6	2026-10-05	2026-10-05 14:00:12.461875-01	\N	4
123	13	6	2026-10-05	2026-10-05 14:00:54.824118-01	พนักงานยืนยันการชำระเงินถูกต้อง	12
124	13	7	2026-10-05	2026-10-05 14:01:17.589812-01	\N	12
125	13	6	2026-10-05	2026-10-05 14:01:17.627705-01	พนักงานยืนยันการชำระเงินถูกต้อง	12
126	13	7	2026-10-05	2026-10-05 14:01:17.659717-01	ลูกค้าลงชื่อรับเครื่องและส่งมอบเครื่องเสร็จสิ้น	12
135	15	8	2026-10-05	2026-10-05 14:11:21.587492-01	ลูกค้ายกเลิกการซ่อม	4
136	15	6	2026-10-05	2026-10-05 14:11:45.916604-01	\N	4
142	16	1	2026-10-08	2026-10-08 11:22:50.343964-01	\N	12
145	16	3	2026-10-08	2026-10-08 11:28:49.335518-01	\N	11
155	17	2	2026-10-08	2026-10-08 12:32:32.910331-01	ช่างเริ่มดำเนินการตรวจเช็คสภาพเครื่อง	11
156	17	3	2026-10-08	2026-10-08 12:32:50.381475-01	\N	11
157	17	3	2026-10-08	2026-10-08 12:33:39.195159-01	ลูกค้าขอแก้ไข/ตีกลับใบเสนอราคา: ลงโปรแกรทเพิ่ม	6
158	17	3	2026-10-08	2026-10-08 12:34:00.773546-01	ช่างปรับปรุงใบเสนอราคาใหม่ รอลูกค้าอนุมัติ	11
159	17	3	2026-10-08	2026-10-08 12:34:00.825378-01	\N	11
160	17	4	2026-10-08	2026-10-08 12:35:17.969648-01	ลูกค้าอนุมัติการซ่อม	6
161	17	5	2026-10-08	2026-10-08 12:35:59.461879-01	ช่างซ่อมเสร็จสิ้น / ทดสอบเครื่อง เปลี่ยนสถานะเป็นรอชำระ	11
162	17	5	2026-10-08	2026-10-08 12:35:59.565414-01	ช่างซ่อมเสร็จสิ้น / ทดสอบเครื่อง เปลี่ยนสถานะเป็นรอชำระ	11
163	8	3	2026-10-09	2026-10-09 13:33:57.831626-01	ช่างปรับปรุงใบเสนอราคาใหม่ รอลูกค้าอนุมัติ	1
164	10	3	2026-10-09	2026-10-09 13:58:00.664131-01	ช่างปรับปรุงใบเสนอราคาใหม่ รอลูกค้าอนุมัติ	1
165	9	3	2026-10-09	2026-10-09 14:16:20.191797-01	ช่างปรับปรุงใบเสนอราคาใหม่ รอลูกค้าอนุมัติ	1
168	17	6	2026-10-16	2026-10-16 06:44:48.935879-01	พนักงานยืนยันการชำระเงินถูกต้อง	2
169	17	7	2026-10-16	2026-10-16 06:50:49.789073-01	\N	2
170	17	6	2026-10-16	2026-10-16 06:50:49.859018-01	พนักงานยืนยันการชำระเงินถูกต้อง	2
171	17	7	2026-10-16	2026-10-16 06:50:49.892343-01	ลูกค้าลงชื่อรับเครื่องและส่งมอบเครื่องเสร็จสิ้น	2
2	2	1	2026-09-03	2026-09-03 13:18:10.123857-01	\N	2
105	10	3	2026-10-02	2026-10-02 11:53:37.106445-01	\N	3
110	10	3	2026-10-02	2026-10-02 12:58:17.181026-01	ช่างปรับปรุงใบเสนอราคาใหม่ รอลูกค้าอนุมัติ	3
111	10	3	2026-10-02	2026-10-02 12:58:17.2712-01	\N	3
114	13	2	2026-10-05	2026-10-05 13:30:24.880236-01	ช่างเริ่มดำเนินการตรวจเช็คสภาพเครื่อง	11
115	13	2	2026-10-05	2026-10-05 13:30:24.89861-01	ช่างเริ่มดำเนินการตรวจเช็คสภาพเครื่อง	11
118	13	3	2026-10-05	2026-10-05 13:47:30.408779-01	\N	11
127	15	1	2026-10-05	2026-10-05 14:08:46.337131-01	\N	12
137	15	6	2026-10-05	2026-10-05 14:18:51.924257-01	\N	12
138	15	6	2026-10-05	2026-10-05 14:18:52.013227-01	พนักงานยืนยันการชำระเงินถูกต้อง	12
139	15	7	2026-10-05	2026-10-05 14:18:58.360488-01	\N	12
140	15	6	2026-10-05	2026-10-05 14:18:58.404633-01	พนักงานยืนยันการชำระเงินถูกต้อง	12
141	15	7	2026-10-05	2026-10-05 14:18:58.444369-01	ลูกค้าลงชื่อรับเครื่องและส่งมอบเครื่องเสร็จสิ้น	12
143	16	2	2026-10-08	2026-10-08 11:28:16.506545-01	ช่างเริ่มดำเนินการตรวจเช็คสภาพเครื่อง	11
144	16	2	2026-10-08	2026-10-08 11:28:16.540403-01	ช่างเริ่มดำเนินการตรวจเช็คสภาพเครื่อง	11
146	16	8	2026-10-08	2026-10-08 11:29:27.681208-01	ลูกค้ายกเลิกซ่อม: ไม่ระบุ	6
147	16	8	2026-10-08	2026-10-08 11:29:27.71847-01	ลูกค้ายกเลิกการซ่อม	6
148	16	6	2026-10-08	2026-10-08 11:29:37.869015-01	\N	6
149	16	6	2026-10-08	2026-10-08 11:29:57.054495-01	พนักงานยืนยันการชำระเงินถูกต้อง	12
150	16	7	2026-10-08	2026-10-08 11:30:08.432917-01	\N	12
151	16	6	2026-10-08	2026-10-08 11:30:08.459094-01	พนักงานยืนยันการชำระเงินถูกต้อง	12
152	16	7	2026-10-08	2026-10-08 11:30:08.476185-01	ลูกค้าลงชื่อรับเครื่องและส่งมอบเครื่องเสร็จสิ้น	12
3	2	2	2026-09-10	2026-09-10 10:31:04.453681-01	\N	3
4	3	1	2026-09-10	2026-09-10 10:47:00.249616-01	\N	2
5	2	4	2026-09-10	2026-09-10 13:45:54.720669-01	\N	3
6	2	4	2026-09-10	2026-09-10 13:46:26.350437-01	\N	2
7	2	4	2026-09-10	2026-09-10 14:29:49.903011-01	\N	3
8	2	5	2026-09-10	2026-09-10 14:30:11.549436-01	\N	3
9	3	2	2026-09-10	2026-09-10 14:56:00.500843-01	\N	3
10	4	1	2026-09-10	2026-09-10 14:58:15.234494-01	\N	2
11	3	4	2026-09-10	2026-09-10 15:01:24.984372-01	\N	3
12	3	4	2026-09-10	2026-09-10 15:03:49.324575-01	\N	2
13	3	5	2026-09-10	2026-09-10 15:08:15.078347-01	\N	2
14	4	2	2026-09-10	2026-09-10 15:24:54.084889-01	\N	3
15	4	4	2026-09-10	2026-09-10 15:33:17.880157-01	\N	3
16	4	4	2026-09-10	2026-09-10 15:33:26.087035-01	\N	2
17	2	6	2026-09-11	2026-09-11 14:51:42.786562-01	\N	4
18	2	6	2026-09-11	2026-09-11 15:03:20.859264-01	\N	4
19	2	6	2026-09-11	2026-09-11 15:16:30.475214-01	\N	4
20	2	6	2026-09-11	2026-09-11 15:16:35.685524-01	\N	4
21	2	6	2026-09-11	2026-09-11 15:40:46.046519-01	\N	4
22	2	6	2026-09-11	2026-09-11 15:46:25.122086-01	\N	4
23	4	6	2026-09-11	2026-09-11 15:46:52.571487-01	\N	4
24	4	6	2026-09-11	2026-09-11 16:08:40.284351-01	\N	4
25	4	6	2026-09-11	2026-09-11 16:14:58.590183-01	\N	4
26	5	1	2026-09-13	2026-09-13 02:02:59.506061-01	\N	2
27	5	2	2026-09-13	2026-09-13 02:08:00.310251-01	\N	3
28	5	4	2026-09-13	2026-09-13 02:11:53.941084-01	\N	3
29	5	4	2026-09-13	2026-09-13 02:13:59.005137-01	\N	2
30	4	7	2026-09-15	2026-09-15 15:04:12.713606-01	\N	2
31	6	1	2026-09-15	2026-09-15 15:32:21.391325-01	\N	2
32	6	2	2026-09-15	2026-09-15 15:32:55.063476-01	\N	3
33	6	4	2026-09-15	2026-09-15 15:37:35.494678-01	\N	3
34	6	4	2026-09-15	2026-09-15 15:38:14.940702-01	\N	2
35	2	7	2026-09-15	2026-09-15 16:09:01.276325-01	\N	2
36	3	5	2026-09-15	2026-09-15 16:10:41.883042-01	\N	3
37	3	6	2026-09-15	2026-09-15 16:11:05.45909-01	\N	4
38	3	6	2026-09-15	2026-09-15 16:26:00.931717-01	พนักงานปฏิเสธการชำระเงิน: ไม่ชัด	2
39	3	6	2026-09-15	2026-09-15 16:26:27.358855-01	\N	4
40	6	8	2026-09-16	2026-09-16 11:46:33.16978-01	\N	4
41	6	3	2026-09-16	2026-09-16 11:55:35.784234-01	ลูกค้าขอแก้ไข/ตีกลับใบเสนอราคา: ลง window	1
42	6	8	2026-09-16	2026-09-16 12:00:25.005868-01	ลูกค้ายกเลิกซ่อม: ไม่ระบุ	4
43	6	3	2026-09-16	2026-09-16 12:01:32.499991-01	ลูกค้าขอแก้ไข/ตีกลับใบเสนอราคา: ลง windows 11 pro	1
44	5	2	2026-09-16	2026-09-16 12:01:44.069945-01	ช่างลบใบเสนอราคา ถอยสถานะกลับเป็นดำเนินการตรวจเช็ค	1
45	6	3	2026-09-16	2026-09-16 12:04:27.108515-01	ลูกค้าขอแก้ไข/ตีกลับใบเสนอราคา: ลง windows เพิ่มให้ด้วย	4
47	6	4	2026-09-16	2026-09-16 12:05:46.111493-01	\N	3
48	6	8	2026-09-16	2026-09-16 12:05:55.593119-01	ลูกค้ายกเลิกซ่อม: ไม่ระบุ	4
49	6	6	2026-09-16	2026-09-16 12:06:02.64466-01	\N	4
50	2	2	2026-09-16	2026-09-16 12:08:16.987583-01	ช่างลบใบเสนอราคา ถอยสถานะกลับเป็นดำเนินการตรวจเช็ค	3
46	6	3	2026-09-16	2026-09-16 12:05:46.071288-01	ช่างปรับปรุงใบเสนอราคาใหม่ รอลูกค้าอนุมัติ	3
51	6	6	2026-09-16	2026-09-16 12:45:25.405268-01	พนักงานยืนยันการชำระเงินถูกต้อง	2
52	6	7	2026-09-16	2026-09-16 12:45:34.551249-01	\N	2
53	6	7	2026-09-16	2026-09-16 12:45:34.59184-01	ส่งมอบเครื่องให้ลูกค้าเสร็จสิ้น	2
54	7	1	2026-09-17	2026-09-17 11:24:07.084917-01	\N	2
153	17	1	2026-10-08	2026-10-08 12:32:05.77405-01	\N	12
154	17	2	2026-10-08	2026-10-08 12:32:32.860686-01	ช่างเริ่มดำเนินการตรวจเช็คสภาพเครื่อง	11
167	17	6	2026-10-16	2026-10-16 06:44:48.829857-01	\N	2
55	7	2	2026-09-17	2026-09-17 11:24:31.150549-01	ช่างเริ่มดำเนินการตรวจเช็คสภาพเครื่อง	3
56	7	2	2026-09-17	2026-09-17 11:24:31.179115-01	\N	3
57	7	3	2026-09-17	2026-09-17 11:25:23.187604-01	\N	3
58	7	4	2026-09-17	2026-09-17 11:25:43.708938-01	\N	2
59	7	8	2026-09-17	2026-09-17 11:26:01.169752-01	ลูกค้ายกเลิกซ่อม: ไม่ระบุ	6
60	7	8	2026-09-17	2026-09-17 11:26:01.192662-01	ลูกค้ายกเลิกการซ่อม	6
61	7	6	2026-09-17	2026-09-17 11:26:13.025929-01	\N	6
62	7	6	2026-09-17	2026-09-17 11:26:34.147319-01	พนักงานยืนยันการชำระเงินถูกต้อง	2
63	7	7	2026-09-17	2026-09-17 11:26:42.001045-01	\N	2
64	7	7	2026-09-17	2026-09-17 11:26:42.039799-01	ส่งมอบเครื่องให้ลูกค้าเสร็จสิ้น	2
65	8	1	2026-09-17	2026-09-17 11:30:06.215622-01	\N	2
66	8	2	2026-09-17	2026-09-17 11:31:02.689364-01	ช่างเริ่มดำเนินการตรวจเช็คสภาพเครื่อง	3
67	8	2	2026-09-17	2026-09-17 11:31:02.716427-01	\N	3
68	8	3	2026-09-17	2026-09-17 11:32:16.090902-01	\N	3
69	8	3	2026-09-17	2026-09-17 11:32:47.005803-01	ลูกค้าขอแก้ไข/ตีกลับใบเสนอราคา: เปลี่ยนแรมด้วย	6
70	8	3	2026-09-17	2026-09-17 11:33:44.692933-01	ช่างปรับปรุงใบเสนอราคาใหม่ รอลูกค้าอนุมัติ	3
71	8	3	2026-09-17	2026-09-17 11:33:44.726472-01	\N	3
72	8	4	2026-09-17	2026-09-17 11:33:57.682653-01	ลูกค้าอนุมัติการซ่อม	6
73	5	2	2026-09-17	2026-09-17 11:35:29.970333-01	ช่างลบใบเสนอราคา ถอยสถานะกลับเป็นดำเนินการตรวจเช็ค	3
74	9	1	2026-09-17	2026-09-17 11:36:33.243784-01	\N	2
75	9	2	2026-09-17	2026-09-17 11:36:56.190401-01	ช่างเริ่มดำเนินการตรวจเช็คสภาพเครื่อง	3
76	9	2	2026-09-17	2026-09-17 11:36:56.221484-01	\N	3
77	9	3	2026-09-17	2026-09-17 11:37:28.45328-01	\N	3
78	9	2	2026-09-17	2026-09-17 11:38:19.072766-01	ช่างลบใบเสนอราคา ถอยสถานะกลับเป็นดำเนินการตรวจเช็ค	3
79	9	3	2026-09-17	2026-09-17 11:39:33.515934-01	\N	3
80	10	1	2026-09-25	2026-09-25 12:42:41.843107-01	\N	2
81	10	2	2026-09-25	2026-09-25 12:46:07.998819-01	ช่างเริ่มดำเนินการตรวจเช็คสภาพเครื่อง	3
82	10	2	2026-09-25	2026-09-25 12:46:08.028198-01	ช่างเริ่มดำเนินการตรวจเช็คสภาพเครื่อง	3
83	11	1	2026-09-25	2026-09-25 12:49:49.005678-01	\N	2
84	3	5	2026-09-26	2026-09-26 09:38:11.25273-01	ช่างซ่อมเสร็จสิ้น / ทดสอบเครื่อง เปลี่ยนสถานะเป็นรอชำระ	2
85	3	6	2026-09-26	2026-09-26 10:32:45.016835-01	พนักงานยืนยันการชำระเงินถูกต้อง	2
86	3	7	2026-09-26	2026-09-26 10:33:07.999743-01	\N	2
87	3	6	2026-09-26	2026-09-26 10:33:08.042718-01	พนักงานยืนยันการชำระเงินถูกต้อง	2
88	3	7	2026-09-26	2026-09-26 10:33:08.113437-01	ส่งมอบเครื่องให้ลูกค้าเสร็จสิ้น	2
89	9	3	2026-09-27	2026-09-27 01:24:15.107819-01	ช่างปรับปรุงใบเสนอราคาใหม่ รอลูกค้าอนุมัติ	3
90	9	3	2026-09-27	2026-09-27 01:24:15.197792-01	\N	3
91	8	3	2026-09-27	2026-09-27 01:53:39.819907-01	ช่างปรับปรุงใบเสนอราคาใหม่ รอลูกค้าอนุมัติ	3
92	8	3	2026-09-27	2026-09-27 01:53:39.909294-01	\N	3
93	10	3	2026-09-27	2026-09-27 02:26:17.089807-01	\N	3
94	10	3	2026-09-27	2026-09-27 02:27:08.79746-01	ช่างปรับปรุงใบเสนอราคาใหม่ รอลูกค้าอนุมัติ	3
95	10	3	2026-09-27	2026-09-27 02:27:08.861424-01	\N	3
96	10	3	2026-09-27	2026-09-27 02:27:29.117738-01	ช่างปรับปรุงใบเสนอราคาใหม่ รอลูกค้าอนุมัติ	3
97	10	3	2026-09-27	2026-09-27 02:27:29.213749-01	\N	3
98	2	3	2026-09-27	2026-09-27 02:32:20.851944-01	\N	3
99	2	3	2026-09-27	2026-09-27 02:36:52.06083-01	ช่างปรับปรุงใบเสนอราคาใหม่ รอลูกค้าอนุมัติ	3
100	2	3	2026-09-27	2026-09-27 02:36:52.168068-01	\N	3
101	2	2	2026-09-27	2026-09-27 02:56:48.420924-01	ช่างลบใบเสนอราคา ถอยสถานะกลับเป็นดำเนินการตรวจเช็ค	3
102	10	2	2026-09-27	2026-09-27 02:57:32.660823-01	ช่างลบใบเสนอราคา ถอยสถานะกลับเป็นดำเนินการตรวจเช็ค	3
106	10	3	2026-10-02	2026-10-02 12:27:11.452539-01	ช่างปรับปรุงใบเสนอราคาใหม่ รอลูกค้าอนุมัติ	3
107	10	3	2026-10-02	2026-10-02 12:27:11.549873-01	\N	3
112	9	3	2026-10-02	2026-10-02 13:11:55.509578-01	ช่างปรับปรุงใบเสนอราคาใหม่ รอลูกค้าอนุมัติ	1
116	14	1	2026-10-05	2026-10-05 13:42:20.249215-01	\N	12
119	13	4	2026-10-05	2026-10-05 13:57:51.606867-01	ลูกค้าอนุมัติการซ่อม	4
128	15	2	2026-10-05	2026-10-05 14:09:26.763296-01	ช่างเริ่มดำเนินการตรวจเช็คสภาพเครื่อง	11
129	15	2	2026-10-05	2026-10-05 14:09:26.785-01	ช่างเริ่มดำเนินการตรวจเช็คสภาพเครื่อง	11
130	15	3	2026-10-05	2026-10-05 14:10:05.035686-01	\N	11
131	15	3	2026-10-05	2026-10-05 14:10:25.075732-01	ลูกค้าขอแก้ไข/ตีกลับใบเสนอราคา: ลงวินโดร์	4
132	15	3	2026-10-05	2026-10-05 14:11:09.619936-01	ช่างปรับปรุงใบเสนอราคาใหม่ รอลูกค้าอนุมัติ	11
133	15	3	2026-10-05	2026-10-05 14:11:09.642119-01	\N	11
134	15	8	2026-10-05	2026-10-05 14:11:21.554519-01	ลูกค้ายกเลิกซ่อม: ไม่ระบุ	4
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.roles (id, name) FROM stdin;
1	Manager
2	Technician
3	Staff
4	Customer
\.


--
-- Data for Name: slips_records; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.slips_records (image_url, uploaded_at, id, user_id) FROM stdin;
slips/slip_REP-000003_20260916_002627.jpg	2026-09-15 16:26:27.363396-01	2	4
slips/slip_REP-000003_20260916_001105.jpg	2026-09-15 16:11:05.46057-01	1	4
slips/slip_REP-000013_20261005_220012.png	2026-10-05 14:00:12.464271-01	3	4
slips/slip_REP-000016_20261008_192937.jpeg	2026-10-08 11:29:37.870091-01	4	6
\.


--
-- Data for Name: status; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.status (status_id, status_name) FROM stdin;
1	รอตรวจเช็ค
2	ดำเนินการตรวจเช็ค
3	ดำเนินการเสนอราคา
4	รอการอนุมัติ
5	อนุมัติแล้ว/รอซ่อม
7	รอชำระ
8	เสร็จสิ้น
9	ยกเลิกซ่อม
6	รอลูกค้ามารับเครื่อง
\.


--
-- Name: action_type_action_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.action_type_action_type_id_seq', 8, true);


--
-- Name: brands_brand_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.brands_brand_id_seq', 32, true);


--
-- Name: device_device_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.device_device_id_seq', 17, true);


--
-- Name: device_models_model_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.device_models_model_id_seq', 198, true);


--
-- Name: device_types_device_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.device_types_device_type_id_seq', 7, true);


--
-- Name: item_item_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.item_item_id_seq', 50, true);


--
-- Name: item_type_item_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.item_type_item_type_id_seq', 2, true);


--
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.password_reset_tokens_id_seq', 4, true);


--
-- Name: payment_method_payment_method_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.payment_method_payment_method_id_seq', 2, true);


--
-- Name: profiles_new_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.profiles_new_id_seq', 12, true);


--
-- Name: quotation_details_details_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.quotation_details_details_id_seq', 81, true);


--
-- Name: quotation_quotation_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.quotation_quotation_id_seq', 21, true);


--
-- Name: quotation_status_quote_status_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.quotation_status_quote_status_id_seq', 4, true);


--
-- Name: repair_job_detail_job_id_detail_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.repair_job_detail_job_id_detail_seq', 173, true);


--
-- Name: repair_job_job_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.repair_job_job_id_seq', 21, true);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.roles_id_seq', 4, true);


--
-- Name: slips_records_new_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.slips_records_new_id_seq', 4, true);


--
-- Name: status_status_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.status_status_id_seq', 9, true);


--
-- Name: action_type action_type_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.action_type
    ADD CONSTRAINT action_type_pkey PRIMARY KEY (action_type_id);


--
-- Name: brand_device_types brand_device_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brand_device_types
    ADD CONSTRAINT brand_device_types_pkey PRIMARY KEY (brand_id, device_type_id);


--
-- Name: brands brands_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT brands_pkey PRIMARY KEY (brand_id);


--
-- Name: device_models device_models_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.device_models
    ADD CONSTRAINT device_models_pkey PRIMARY KEY (model_id);


--
-- Name: device device_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.device
    ADD CONSTRAINT device_pkey PRIMARY KEY (device_id);


--
-- Name: device_types device_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.device_types
    ADD CONSTRAINT device_types_pkey PRIMARY KEY (device_type_id);


--
-- Name: item item_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item
    ADD CONSTRAINT item_pkey PRIMARY KEY (item_id);


--
-- Name: item_type item_type_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_type
    ADD CONSTRAINT item_type_pkey PRIMARY KEY (item_type_id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_token_key UNIQUE (token);


--
-- Name: payment_method payment_method_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_method
    ADD CONSTRAINT payment_method_pkey PRIMARY KEY (payment_method_id);


--
-- Name: profiles profiles_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_email_key UNIQUE (email);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: quotation_details quotation_details_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotation_details
    ADD CONSTRAINT quotation_details_pkey PRIMARY KEY (details_id);


--
-- Name: quotation quotation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotation
    ADD CONSTRAINT quotation_pkey PRIMARY KEY (quotation_id);


--
-- Name: quotation_status quotation_status_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotation_status
    ADD CONSTRAINT quotation_status_pkey PRIMARY KEY (quote_status_id);


--
-- Name: repair_job_detail repair_job_detail_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repair_job_detail
    ADD CONSTRAINT repair_job_detail_pkey PRIMARY KEY (job_id_detail);


--
-- Name: repair_job repair_job_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repair_job
    ADD CONSTRAINT repair_job_pkey PRIMARY KEY (job_id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: slips_records slips_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.slips_records
    ADD CONSTRAINT slips_records_pkey PRIMARY KEY (id);


--
-- Name: status status_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.status
    ADD CONSTRAINT status_pkey PRIMARY KEY (status_id);


--
-- Name: device_models uq_brand_model; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.device_models
    ADD CONSTRAINT uq_brand_model UNIQUE (brand_id, model_name);


--
-- Name: idx_device_customer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_device_customer_id ON public.device USING btree (customer_id);


--
-- Name: idx_profiles_phone; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_phone ON public.profiles USING btree (phone);


--
-- Name: idx_quotation_details_quote_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_quotation_details_quote_id ON public.quotation_details USING btree (quote_id);


--
-- Name: idx_quotation_job_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_quotation_job_id ON public.quotation USING btree (job_id);


--
-- Name: idx_repair_job_device_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_repair_job_device_id ON public.repair_job USING btree (device_id);


--
-- Name: idx_repair_job_repairer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_repair_job_repairer_id ON public.repair_job USING btree (repairer_id);


--
-- Name: idx_repair_job_status_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_repair_job_status_id ON public.repair_job USING btree (status_id);


--
-- Name: brand_device_types brand_device_types_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brand_device_types
    ADD CONSTRAINT brand_device_types_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(brand_id) ON DELETE CASCADE;


--
-- Name: brand_device_types brand_device_types_device_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brand_device_types
    ADD CONSTRAINT brand_device_types_device_type_id_fkey FOREIGN KEY (device_type_id) REFERENCES public.device_types(device_type_id) ON DELETE CASCADE;


--
-- Name: device device_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.device
    ADD CONSTRAINT device_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(brand_id) ON DELETE SET NULL;


--
-- Name: device device_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.device
    ADD CONSTRAINT device_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: device device_device_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.device
    ADD CONSTRAINT device_device_type_id_fkey FOREIGN KEY (device_type_id) REFERENCES public.device_types(device_type_id) ON DELETE SET NULL;


--
-- Name: device_models device_models_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.device_models
    ADD CONSTRAINT device_models_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(brand_id) ON DELETE CASCADE;


--
-- Name: device_models device_models_device_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.device_models
    ADD CONSTRAINT device_models_device_type_id_fkey FOREIGN KEY (device_type_id) REFERENCES public.device_types(device_type_id) ON DELETE SET NULL;


--
-- Name: repair_job fk_repair_job_quotation; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repair_job
    ADD CONSTRAINT fk_repair_job_quotation FOREIGN KEY (quotation_id) REFERENCES public.quotation(quotation_id) ON DELETE SET NULL;


--
-- Name: item item_item_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item
    ADD CONSTRAINT item_item_type_id_fkey FOREIGN KEY (item_type_id) REFERENCES public.item_type(item_type_id) ON DELETE SET NULL;


--
-- Name: password_reset_tokens password_reset_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- Name: quotation_details quotation_details_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotation_details
    ADD CONSTRAINT quotation_details_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.item(item_id) ON DELETE SET NULL;


--
-- Name: quotation_details quotation_details_quote_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotation_details
    ADD CONSTRAINT quotation_details_quote_id_fkey FOREIGN KEY (quote_id) REFERENCES public.quotation(quotation_id) ON DELETE CASCADE;


--
-- Name: quotation quotation_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotation
    ADD CONSTRAINT quotation_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.repair_job(job_id) ON DELETE CASCADE;


--
-- Name: quotation quotation_quote_status_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotation
    ADD CONSTRAINT quotation_quote_status_id_fkey FOREIGN KEY (quote_status_id) REFERENCES public.quotation_status(quote_status_id) ON DELETE SET NULL;


--
-- Name: repair_job_detail repair_job_detail_action_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repair_job_detail
    ADD CONSTRAINT repair_job_detail_action_type_id_fkey FOREIGN KEY (action_type_id) REFERENCES public.action_type(action_type_id) ON DELETE SET NULL;


--
-- Name: repair_job_detail repair_job_detail_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repair_job_detail
    ADD CONSTRAINT repair_job_detail_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.repair_job(job_id) ON DELETE CASCADE;


--
-- Name: repair_job_detail repair_job_detail_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repair_job_detail
    ADD CONSTRAINT repair_job_detail_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: repair_job repair_job_device_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repair_job
    ADD CONSTRAINT repair_job_device_id_fkey FOREIGN KEY (device_id) REFERENCES public.device(device_id) ON DELETE CASCADE;


--
-- Name: repair_job repair_job_payment_method_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repair_job
    ADD CONSTRAINT repair_job_payment_method_id_fkey FOREIGN KEY (payment_method_id) REFERENCES public.payment_method(payment_method_id) ON DELETE SET NULL;


--
-- Name: repair_job repair_job_payment_verified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repair_job
    ADD CONSTRAINT repair_job_payment_verified_by_fkey FOREIGN KEY (payment_verified_by) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: repair_job repair_job_repairer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repair_job
    ADD CONSTRAINT repair_job_repairer_id_fkey FOREIGN KEY (repairer_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: repair_job repair_job_status_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repair_job
    ADD CONSTRAINT repair_job_status_id_fkey FOREIGN KEY (status_id) REFERENCES public.status(status_id) ON DELETE SET NULL;


--
-- Name: slips_records slips_records_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.slips_records
    ADD CONSTRAINT slips_records_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict euCRjvz630a54xuT6LbOxx4OyzUF5qpcJSMz1HDFS5C4kvQcnPVCVmViLhlAXjW


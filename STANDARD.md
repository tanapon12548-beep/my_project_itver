# 🧭 IT VERTEX — มาตรฐานโลจิกกลาง (Single Logic Standard)

> **เอกสารอ้างอิงเดียว** สำหรับ "โลจิกทั้งหมด" ของระบบ ทั้ง **Front-end** และ **Back-end**
> กติกา: **ถ้าโค้ดไม่ตรงกับเอกสารนี้ ให้ปรับโค้ด** (เอกสารนี้คือมาตรฐาน ไม่ใช่โค้ดคือมาตรฐาน)
>
> ไฟล์ที่เกี่ยวข้อง: [`README.md`](./README.md) (ติดตั้ง/ใช้งาน) · [`DESIGN.md`](./DESIGN.md) · [`PRODUCT.md`](./PRODUCT.md)

---

## 0. สถานะการปรับใช้ (Migration Status)

| เฟส | ขอบเขต | สถานะ |
|---|---|---|
| **Phase 1** | Back-end — แก้ค่าคงที่/สิทธิ์/รหัสตอบกลับ/ชื่อฟังก์ชันให้ตรงมาตรฐาน | ✅ ทำแล้ว |
| **Phase 2a** | Front-end — รวมระบบแจ้งเตือนเป็น hook กลาง `useAlert()` ตัวเดียวทั้งโปรเจกต์ | ✅ ทำแล้ว |
| **Phase 2b** | Front-end — ย้ายสีที่ hardcode (`#DC2626`/`#D32F2F`/`#D62828`) ให้มาจาก `theme.ts` + โทเคน Tailwind | ✅ ทำแล้ว |
| **Phase 3** | Front-end — แก้ชื่อโฟลเดอร์/กลุ่มเส้นทางที่สะกดผิด (`Meneger_*`/`(meneger)` → `Manager_*`/`(manager)`, `Technicain_*`/`(technicain)` → `Technician_*`/`(technician)`) | ✅ ทำแล้ว |
| **Phase 4** | เอกสาร — ซิงก์ `README.md` / `AGENTS.md` / `handoff.md` / `eas.json` ให้ตรงความจริง | ✅ ทำแล้ว |

**หลักการสำคัญ:** การปรับทุกเฟส **ห้ามเปลี่ยนพฤติกรรมที่ผู้ใช้เห็น** ยกเว้นรายการที่ระบุว่าเป็น "แก้บั๊ก/ปิดช่องโหว่" ไว้ชัดเจน

---

## 1. สถาปัตยกรรมและการไหลของข้อมูล

```
[Expo App]
   หน้าจอ (app/**)  ──เรียก──▶  lib/api.ts (fetchWithAuth)
                                      │  แนบ Bearer JWT (SecureStore/localStorage)
                                      ▼
[Express API]  server.js → routes/*.routes.js
                                      │  middleware/auth.js  (ตรวจ JWT → req.user)
                                      │  middleware/role.js  (ตรวจสิทธิ์ตามบทบาท)
                                      ▼
                              controllers/*.controller.js   (โลจิก/validation/สถานะ)
                                      │  queries/*.queries.js  (SQL แบบมีชื่อ) หรือ pool.query ตรง
                                      ▼
                              [PostgreSQL app_data]
```

**ข้อกำหนด**
- **FR-API-01**: แอปต้องคุยกับ Backend ผ่าน `lib/api.ts` **เท่านั้น** — ห้ามเรียก `fetch`/Supabase ตรงจากหน้าจอ
  *(ตรวจแล้ว: ปัจจุบันไม่มี `supabase.from(...)` ในโค้ดแอปเลย — ที่เขียนใน `AGENTS.md` เป็นข้อมูลเก่า)*
- **FR-API-02**: ทุก endpoint (ยกเว้น login/register/forgot/reset) ต้องผ่าน `auth` ก่อนเสมอ
- **BE-ARC-01**: ลำดับชั้น = `routes → controller → queries`. ถ้า SQL ยาว/ใช้ซ้ำ ให้ย้ายไป `queries/*.queries.js`

---

## 2. มาตรฐาน Back-end

### 2.1 โครงสร้างレスponse (Response Envelope)

```jsonc
// สำเร็จ
{ "success": true, "data": <object|array>, "message": "ข้อความไทย (ไม่บังคับ)" }

// ล้มเหลว
{ "success": false, "message": "ข้อความไทยที่ผู้ใช้อ่านรู้เรื่อง" }
```

- **BE-RES-01**: ห้ามใส่ฟิลด์อื่นปนระดับบนสุดของ response (เช่น `filename`) ให้ใส่ใน `data` แทน
- **BE-RES-02**: ข้อความ `message` ต้องเป็นภาษาไทยและบอกสิ่งที่ผู้ใช้ต้องทำต่อ

### 2.2 รหัสสถานะ HTTP

| การกระทำ | รหัส | หมายเหตุ |
|---|---|---|
| อ่านสำเร็จ (GET) | `200` | |
| **สร้างสำเร็จ (POST)** | **`201`** | ใช้เหมือนกันทุก resource |
| อัปเดต/เปลี่ยนสถานะสำเร็จ (PUT/PATCH) | `200` | |
| ลบสำเร็จ (DELETE) | `200` + `{success:true, message}` | |
| ข้อมูลไม่ครบ/ผิดรูปแบบ/ผิดกฎธุรกิจ | `400` | |
| ไม่ได้ล็อกอิน / token หมดอายุ | `401` | |
| ล็อกอินแล้วแต่สิทธิ์ไม่พอ | `403` | |
| ไม่พบข้อมูล | `404` | |
| ยิงถี่เกินกำหนด | `429` | rate limit |
| เซิร์ฟเวอร์พัง | `500` | ผ่าน `next(err)` |

### 2.3 การตรวจสิทธิ์ (Role Guard)

- **BE-AUTH-01**: สิทธิ์ตามบทบาทต้องประกาศที่ **route** ด้วย `role(...)` เสมอ ไม่พึ่งการซ่อนปุ่มบนหน้าจอ
- **BE-AUTH-02**: ถ้าเป็นการตรวจ "เจ้าของข้อมูล" (ลูกค้าดูงานตัวเอง) ให้ตรวจใน controller แล้วตอบ `403`
- **BE-AUTH-03**: `role_id` ต้องอ้างจาก `constants/index.js` (`ROLES`) ที่ตรงกับตาราง `roles` เท่านั้น

**ตารางสิทธิ์มาตรฐาน (ตรงกับ route จริง)**

| กลุ่ม API | Manager | Technician | Staff | Customer | หมายเหตุ |
|---|:--:|:--:|:--:|:--:|---|
| `auth/me`, `auth/profile` | ✅ | ✅ | ✅ | ✅ | ทุกบทบาทที่ล็อกอิน |
| `devices` (GET/POST/PUT) | ✅ | ✅ | ✅ | ✅ | ใช้ตอนรับเครื่อง |
| `repairs` (GET/POST/PUT/status/detail/signature) | ✅ | ✅ | ✅ | ✅ | ตรวจเจ้าของใน controller |
| `repairs` (DELETE) | ✅ | — | — | — | ลบงานที่ยังไม่มีใบเสนอราคา/การชำระ |
| `quotations` (GET) | ✅ | ✅ | ✅ | ✅ | |
| `quotations` (POST/PUT/DELETE) | ✅ | ✅ | — | — | ช่างเป็นผู้ออกใบเสนอราคา |
| `quotations` (PATCH status) | ✅ | ✅ | ✅ | ✅ | ลูกค้าเจ้าของงานอนุมัติ/ขอแก้ไข/ยกเลิก |
| `payments` (POST) | ✅ | ✅ | ✅ | ✅ | ลูกค้าแจ้งชำระ |
| `payments` (verify/reject) | ✅ | — | ✅ | — | หน้าร้านตรวจสลิป |
| `items` (GET) | ✅ | ✅ | ✅ | ✅ | |
| `items` (POST/PUT/DELETE) | ✅ | — | — | — | **Phase 1 เปลี่ยนจากเดิม (เดิมใครก็ได้)** |
| `staff` (GET/PUT/DELETE) | ✅ | — | — | — | |
| `catalog` (GET) | ✅ | ✅ | ✅ | ✅ | |
| `catalog` (POST/PUT/DELETE) | ✅ | — | — | — | Master Data |
| `dashboard/*` | ✅ | — | ✅ | — | Staff เห็นแบบไม่มีตัวเลขเงิน |
| `lookup/*` | ✅ | ✅ | ✅ | ✅ | |

### 2.4 การจัดการ Error

- **BE-ERR-01**: ทุก handler ใช้รูปแบบเดียว: `try { ... } catch (err) { next(err); }`
- **BE-ERR-02**: งานที่ไม่ใช่หัวใจ (เช่น บันทึก log/สลิป) ถ้าล้มเหลวให้ `console.warn` แล้วทำงานต่อ **ห้าม throw**
  → ระบุคอมเมนต์ว่าเป็น *soft-fail* เสมอ
- **BE-ERR-03**: ห้าม `console.error` แล้วกลืน error โดยไม่ตอบ response

### 2.5 Validation

- **BE-VAL-01**: ตรวจ `parseInt` / ค่าบังคับ / ช่วงค่าที่ controller ก่อนแตะ DB เสมอ
- **BE-VAL-02**: ข้อความ validation ต้องตรงกับที่แอปแสดง (ภาษาไทย, บอกวิธีแก้)
- **BE-VAL-03**: กฎธุรกิจที่สำคัญต้องอยู่ที่ server (เช่น อะไหล่ต้องมาจากแคตตาล็อก, ต้องมีค่าบริการคู่กับอะไหล่)

### 2.6 การตั้งชื่อ (Naming)

- **BE-NAME-01**: ชื่อฟังก์ชันใน controller ใช้ชุดเดียว: `getAll / getById / create / update / remove / updateStatus / ...`
  → **ห้ามมี alias** เช่น `exports.delete = exports.remove`
- **BE-NAME-02**: ชื่อคอลัมน์ใน DB และ payload เป็น `snake_case` เสมอ (`job_id`, `quotation_id`, `payment_method_id`)
- **BE-NAME-03**: ในตาราง `quotation_details` ใช้ชื่อคอลัมน์ `quote_id` (มีอยู่จริง) — โค้ดต้องอ้างชื่อจริง ไม่ตั้งชื่อเล่นใหม่
- **BE-NAME-04**: ไฟล์ `queries/*.queries.js` ต้องขึ้นต้นด้วยคำกริยาเช่นเดิม: `SELECT_*`, `INSERT_*`, `UPDATE_*`, `DELETE_*`

### 2.7 Transaction

- **BE-TX-01**: งานที่เขียนหลายตาราง (ใบเสนอราคา + รายการ, ชำระเงิน + สลิป + log) ต้องใช้ `pool.connect()` + `BEGIN/COMMIT/ROLLBACK`
- **BE-TX-02**: ต้อง `client.release()` ใน `finally` เสมอ

---

## 3. มาตรฐาน Front-end

### 3.1 การเรียก API
- **FE-API-01**: ทุกการเรียกผ่านฟังก์ชันใน `lib/api.ts` (1 ฟังก์ชัน = 1 endpoint) ห้ามประกอบ URL เองในหน้าจอ
- **FE-API-02**: `fetchWithAuth` โยน error เมื่อ response ไม่ใช่ 2xx → หน้าจอต้อง `try/catch` และโชว์ข้อความจาก `error.message`
- **FE-API-03**: **ห้ามยิง API ที่ผู้ใช้ไม่มีสิทธิ์** เพราะจะได้ `403` และทำให้ `Promise.all` ทั้งชุดพัง

### 3.2 โทเคน
- **FE-TOK-01**: ใช้ `getToken()` / `saveToken()` / `removeToken()` จาก `lib/api.ts` เท่านั้น (native = SecureStore, web = localStorage)

### 3.3 การแจ้งเตือน (Feedback) — ✅ มาตรฐานนี้ถูกบังคับใช้แล้ว (Phase 2a)
- **FE-UI-01**: ทุกหน้าจอใช้ hook กลาง **`hooks/use-alert.tsx`** เท่านั้น — ห้าม `<CustomAlert>` ตรง ๆ และห้ามประกาศ `alertConfig`/`showAlert`/`showPopup` ซ้ำในไฟล์หน้าจอ
  ```tsx
  const { showAlert, showConfirm, alertElement } = useAlert();
  ```
  - `showAlert(title, message, type?, onConfirm?)` — ปุ่มเดียว (ค่า `type` default = `'info'`; **ให้ระบุ `type` ทุกครั้งเพื่อความอ่านง่าย**)
  - `showConfirm({ title, message, type?, confirmText?, cancelText?, onConfirm?, onCancel? })` — กล่องยืนยัน (`type` default = `'warning'`, `confirmText` default = `'ตกลง'`)
    - **ใส่ `cancelText` = สองปุ่ม** (เช่น `'ยกเลิก'`) / **ไม่ใส่ = ปุ่มเดียว** (พฤติกรรมเดียวกับ `CustomAlert` เดิม)
  - `alertElement` — นำไปวางใน JSX (ที่เดิมเคยเป็น `<CustomAlert .../>`) ที่เดียวต่อหน้าจอ
  - **ลำดับใน callback:** hook จะปิดกล่องให้ก่อน แล้วจึงเรียก `onConfirm`/`onCancel` → ห้ามเรียกปิดกล่องเอง (ไม่มี `hideAlert()` แล้ว)
- **FE-UI-02**: `type` มีแค่ 4 ค่า: `'success' | 'warning' | 'danger' | 'info'` — ค่า `'error'` (ที่ `slips.tsx` เคยใช้) ถือเป็น `'danger'` (แก้แล้ว)
- **FE-UI-03**: ใช้ `ConfirmDeleteModal` / `ConfirmLogoutModal` / `ConfirmSendModal` เมื่อต้องมี UI ยืนยันเฉพาะทาง (มีปุ่ม/รายละเอียดของตัวเอง) — ส่วนการยืนยันทั่วไปใช้ `showConfirm`

### 3.4 ธีมและสี — *ทำแล้ว (Phase 2b)*
- **FE-THM-01**: สีต้องมาจากที่เดียว — ฝั่ง JS/TSX ใช้ `Colors` จาก `constants/theme.ts` (`Colors.primary = '#DC2626'`, `Colors.status.*`) ส่วนคลาส Tailwind ใช้โทเคน `primary` ที่ประกาศใน `tailwind.config.js` (ค่าเดียวกันคือ `#DC2626`)
- **FE-THM-02**: ห้าม hardcode รหัสสีแบรนด์ (`#DC2626` / `#D32F2F` / `#D62828`) ในหน้าจอ/คอมโพเนนต์ → ใช้ `Colors.primary` หรือคลาส `bg-primary` / `text-primary` / `border-primary` แทน (ยกเว้น 2 ไฟล์ต้นทาง: `constants/theme.ts`, `tailwind.config.js`)
- **FE-THM-03**: ฟอนต์ใช้คลาส `font-heading` / `font-body` เท่านั้น

### 3.5 โครงสร้างไฟล์/โฟลเดอร์
- **FE-STR-01**: หน้าจอใน `app/<group>/` ใช้ `<group>` = `(auth)` | `(customer)` | `(staff)` | `(technician)` | `(manager)`
- **FE-STR-02**: คอมโพเนนต์แยกตามโดเมน: `Staff_*`, `Technician_*`, `Manager_*`, `Customer*`, `Shared_*`
  → ชื่อที่สะกดผิด (`Meneger`, `Technicain`) แก้แล้วใน **Phase 3** (โฟลเดอร์ + import ทั้งโปรเจกต์)
- **FE-STR-03**: ไฟล์ `.tsx` = มี JSX, `.ts` = ไม่มี JSX (types/โลจิก)

### 3.6 สถานะหน้าจอ
- **FE-ST-01**: โหลดครั้งแรกใช้ `ActivityIndicator`, รีเฟรชใช้ `RefreshControl` (สีจาก theme)
- **FE-ST-02**: กลับเข้าหน้าจอต้องรีเฟรชข้อมูลด้วย `useFocusEffect` (ไม่ใช่ `useEffect` อย่างเดียว)
- **FE-ST-03**: ตอน submit ปุ่มต้อง `disabled` + แสดงสถานะกำลังทำงาน กันกดซ้ำ

---

## 4. ทะเบียนค่าคงที่ (Single Source of Truth)

> ค่าอ้างอิงเดียวกับ `back-end/constants/index.js` และตารางใน `database.sql`

| ชุดค่า | ค่า | ความหมาย |
|---|---|---|
| **Roles** (`roles.id`) | `1` Manager · `2` Technician · `3` Staff · `4` Customer | **ต้องตรงกับตาราง `roles`** |
| **สถานะงาน** (`status_id`) | `1` รอตรวจเช็ค · `2` ดำเนินการตรวจเช็ค · `3` ดำเนินการเสนอราคา · `4` รอการอนุมัติ · `5` อนุมัติแล้ว/รอซ่อม · `6` รอลูกค้ามารับเครื่อง · `7` รอชำระ · `8` เสร็จสิ้น · `9` ยกเลิกซ่อม | ลำดับจริง: 1→2→3→4→5→7→6→8 หรือ →9 |
| **สถานะใบเสนอราคา** (`quote_status_id`) | `1` รออนุมัติ · `2` อนุมัติ · `3` ยกเลิก · `4` ขอแก้ไข/เพิ่มเติมรายการ | `5` มีใน DB แต่ไม่มีใน constants |
| **ประเภทเครื่อง** (`device_types`) | ดึงจาก DB ผ่าน `GET /api/catalog/device-types` | ห้าม hardcode ในโค้ด |
| **ประเภทรายการ** (`item_type_id`) | `1` อะไหล่ · `2` ค่าบริการ | |
| **วิธีชำระเงิน** (`payment_method_id`) | `1` เงินสด · `2` โอนเงิน | |
| **Log การทำงาน** (`action_type_id`) | `1` รับเครื่อง · `2` เริ่มตรวจเช็ค · `3` ออกใบเสนอราคา · `4` เริ่มซ่อม · `5` ซ่อมเสร็จ · `6` ชำระเงิน · `7` ส่งมอบ · `8` ลูกค้ายกเลิก | |
| **ค่าตรวจเช็คกรณียกเลิก** | `300` บาท (`DEFAULTS.CANCEL_INSPECTION_FEE`) | |
| **วันของระบบ** | "วันรับเครื่องมา" = `created_at` · "วันรับเครื่องคืน" = `return_date` | ไม่มี "วันนัดรับเครื่อง" |
| **วันรับรู้รายได้** | `return_date` → `repaired_at` → `payment_date` → `created_at` (เขตเวลา `Asia/Bangkok`) | |
| **กำไรขั้นต้น** | รายรับรวม − ต้นทุนอะไหล่ (เฉพาะใบเสนอราคาที่ **อนุมัติ**) | |

---

## 5. แผนผังโลจิกทุก Flow (Front ↔ Back)

รูปแบบเดียวกันทุก flow: **ขั้น → หน้าจอ (ไฟล์) → ฟังก์ชัน `lib/api.ts` → API → Controller → ตาราง → กฎ/สถานะ**

### FLOW-01 ยืนยันตัวตนและบัญชี
| ขั้น | หน้าจอ | lib/api.ts | API | Controller | ตาราง | กฎ/สถานะ |
|---|---|---|---|---|---|---|
| สมัครลูกค้า | `(auth)/register.tsx` | `lib/auth.ts: register()` | `POST /api/auth/register` | `auth.register` | `profiles` | role = Customer(4), รหัสผ่าน ≥8 มี A-Z/a-z/0-9 |
| เข้าสู่ระบบ | `(auth)/login.tsx` | `lib/auth.ts: login()` | `POST /api/auth/login` | `auth.login` | `profiles` | คืน JWT + user, rate limit 50/15 นาที |
| แยกเส้นทางตามบทบาท | `app/index.tsx` | `getMe()` | `GET /api/auth/me` | `auth.getMe` | `profiles`, `roles` | Manager → `(manager)`, อื่น ๆ → `(tabs)` |
| ลืมรหัสผ่าน | `(auth)/forgot-password.tsx` | `lib/auth.ts: forgotPassword()` | `POST /api/auth/forgot-password` | `auth.forgotPassword` | `password_reset_tokens` | ยืนยัน **อีเมล+เบอร์โทร** ต้องตรง, token อายุ 15 นาที |
| ตั้งรหัสใหม่ | `(auth)/reset-password.tsx` | `lib/auth.ts: resetPassword()` | `POST /api/auth/reset-password` | `auth.resetPassword` | `password_reset_tokens`, `profiles` | token ต้อง `used=false` และไม่หมดอายุ → แล้วปิด `used=true` |
| แก้ข้อมูลส่วนตัว | `profile.tsx` (ทุกกลุ่ม) | `updateProfile()` | `PUT /api/auth/profile` | `auth.updateProfile` | `profiles` | |

### FLOW-02 รับเครื่อง / เปิดใบรับซ่อม
| ขั้น | หน้าจอ | lib/api.ts | API | Controller | ตาราง | กฎ/สถานะ |
|---|---|---|---|---|---|---|
| ค้นหาลูกค้าเดิม | `(staff)/receive.tsx` | `searchProfiles()` | `GET /api/lookup/profiles` | `lookup.searchProfiles` | `profiles` | ค้นด้วยชื่อ/เบอร์/อีเมล, เฉพาะ role Customer |
| บันทึกเครื่อง | `(staff)/receive.tsx` + `Staff_receive/DeviceFormCard` | `createDevice()` | `POST /api/devices` | `device.create` | `device` | ต้องมี `device_type_id`; ยี่ห้อใหม่สร้างอัตโนมัติ |
| เปิดใบซ่อม | `(staff)/receive.tsx` | `createRepairJob()` | `POST /api/repairs` | `repair.create` | `repair_job` | **201**, สถานะ = **1 รอตรวจเช็ค** |
| บันทึก log รับเครื่อง | `(staff)/receive.tsx` | `logRepairJobDetail()` | `POST /api/repairs/:id/detail` | `repair.addDetail` | `repair_job_detail` | `action_type_id = 1` |

### FLOW-03 ตรวจเช็คและวินิจฉัย
| ขั้น | หน้าจอ | lib/api.ts | API | Controller | ตาราง | กฎ/สถานะ |
|---|---|---|---|---|---|---|
| เริ่มตรวจเช็ค | `(technician)/checking.tsx` | `updateRepairStatus()` | `PATCH /api/repairs/:id/status` | `repair.updateStatus` | `repair_job`, `repair_job_detail` | 1 → **2** |
| บันทึกอาการที่ตรวจพบ | `make-quote.tsx` / `job-detail.tsx` | `updateRepair()` | `PUT /api/repairs/:id` | `repair.update` | `repair_job.actual_symptom` | |

### FLOW-04 ออก/แก้ไขใบเสนอราคา
| ขั้น | หน้าจอ | lib/api.ts | API | Controller | ตาราง | กฎ/สถานะ |
|---|---|---|---|---|---|---|
| เลือกอะไหล่/ค่าบริการ | `make-quote.tsx` + `Technician_make_quote/*` | `getItems()` | `GET /api/items` | `item.getAll` | `item` | ดึงจากแคตตาล็อกเท่านั้น |
| ส่งใบเสนอราคา | `make-quote.tsx` | `createQuotation()` | `POST /api/quotations` | `quotation.create` | `quotation`, `quotation_details` | **201**; snapshot `unit_cost` = `item.cost_price`; มีค่าบริการอย่างน้อย 1 รายการถ้ามีอะไหล่; งาน → **4 รออนุมัติ** |
| แก้ไขใบเสนอราคา | `make-quote.tsx` | `updateQuotation()` | `PUT /api/quotations/:id` | `quotation.update` | `quotation`, `quotation_details` | แทนรายการเดิมทั้งชุด |
| ลบใบเสนอราคา | `(technician)/repairing.tsx` | `deleteQuotation()` | `DELETE /api/quotations/:id` | `quotation.remove` | `quotation` | งานถอยกลับเป็น **3 กำลังทำใบเสนอราคา** |

### FLOW-05 อนุมัติ / ขอแก้ไข / ยกเลิกใบเสนอราคา (ลูกค้า)
| ขั้น | หน้าจอ | lib/api.ts | API | Controller | ตาราง | กฎ/สถานะ |
|---|---|---|---|---|---|---|
| อนุมัติ | `verify-quote.tsx` | `updateQuotationStatus(id, 2)` | `PATCH /api/quotations/:id/status` | `quotation.updateStatus` | `quotation`, `repair_job` | งาน → **5 อนุมัติแล้ว/รอซ่อม** |
| ขอแก้ไข | `verify-quote.tsx` | `updateQuotationStatus(id, 4/5, remark)` | เดียวกัน | เดียวกัน | `quotation.customer_remark` | งาน → **3 กำลังทำใบเสนอราคา** |
| ยกเลิกซ่อม | `verify-quote.tsx` | `updateQuotationStatus(id, 3)` | เดียวกัน | เดียวกัน | `quotation`, `repair_job` | งาน → **9 ยกเลิก**, เก็บค่าตรวจเช็ค 300 |
| ตรวจเจ้าของ | — | — | — | `quotation.updateStatus` | `device.customer_id` | ไม่ใช่เจ้าของ → **403** |

### FLOW-06 ซ่อมและส่งต่อรอชำระ
| ขั้น | หน้าจอ | lib/api.ts | API | Controller | ตาราง | กฎ/สถานะ |
|---|---|---|---|---|---|---|
| เริ่มซ่อม | `(technician)/repairing.tsx` | `logRepairJobDetail()` | `POST /api/repairs/:id/detail` | `repair.addDetail` | `repair_job_detail` | `action_type_id = 4` |
| ซ่อมเสร็จ | `(technician)/repairing.tsx` | `updateRepairStatus(7)` | `PATCH /api/repairs/:id/status` | `repair.updateStatus` | `repair_job` | 5 → **7 รอชำระ** + บันทึก `repaired_at` |

### FLOW-07 ชำระเงินและตรวจสอบ (สำคัญ: ทุกอย่างต้องยืนยันได้)
| ขั้น | หน้าจอ | lib/api.ts | API | Controller | ตาราง | กฎ/สถานะ |
|---|---|---|---|---|---|---|
| แจ้งชำระ (+สลิป) | `(customer)/index.tsx`, `slips.tsx` | `createPayment()` | `POST /api/payments` | `payment.create` | `repair_job`, `slips_records` | **201** (Phase 1 แก้จาก 200); โอนต้องมีสลิป; เขียน `payment_method_id`, `payment_date` |
| ตีกลับสลิป | `verify-payment.tsx` | `rejectPayment()` | `PATCH /api/payments/:jobId/reject` | `payment.reject` | `repair_job` | รีเซ็ตข้อมูลชำระ ให้ส่งใหม่ได้ |
| ยืนยันการชำระ | `verify-payment.tsx` | `verifyPayment()` | `PATCH /api/payments/:jobId/verify` | `payment.verify` | `repair_job` | `payment_verified = true`, งาน → **6 รอลูกค้ามารับเครื่อง** |

### FLOW-08 ส่งมอบ + ลายเซ็น + ปิดงาน + ใบเสร็จ
| ขั้น | หน้าจอ | lib/api.ts | API | Controller | ตาราง | กฎ/สถานะ |
|---|---|---|---|---|---|---|
| เซ็นรับเครื่อง | `deliver-handover.tsx` | `updateRepairSignature()` | `PATCH /api/repairs/:id/signature` | `repair.updateSignature` | `repair_job.customer_receive_signature` | บันทึกไฟล์ลายเซ็น + ตั้ง `return_date` |
| ปิดงาน | `deliver-handover.tsx` | `updateRepairStatus(8)` | `PATCH /api/repairs/:id/status` | `repair.updateStatus` | `repair_job` | 6 → **8 เสร็จสิ้น** = เริ่มนับรายได้ |
| พิมพ์ใบเสร็จ | `receipt.tsx` | (ใช้ข้อมูลงานที่มี) | — | — | — | PDF ผ่าน `expo-print` |

### FLOW-09 ติดตามงานและแจ้งเตือน (ลูกค้า)
| ขั้น | หน้าจอ | lib/api.ts | API | Controller | ตาราง | กฎ/สถานะ |
|---|---|---|---|---|---|---|
| ดูงานของตนเอง | `(customer)/index.tsx` | `getRepairs()` | `GET /api/repairs` | `repair.getAll` | `repair_jobs_view` | ลูกค้าเห็นเฉพาะงานตัวเอง |
| รายละเอียดงาน | `detail.tsx`, `job-detail.tsx` | `getRepair(id)` | `GET /api/repairs/:id` | `repair.getById` | `repair_job`, `repair_job_detail` | รวม log/ลายเซ็น/การชำระ |
| แจ้งเตือน | `(customer)/notifications.tsx` | — | — | — | — | อ่านจากรายการงาน + badge บนแท็บ |

### FLOW-10 แดชบอร์ดและรายงาน
| ขั้น | หน้าจอ | lib/api.ts | API | Controller | ตาราง | กฎ/สถานะ |
|---|---|---|---|---|---|---|
| การ์ดสรุป | `Shared_Dashboard/MetricCards.tsx` | `getDashboardMetrics()` | `GET /api/dashboard/metrics` | `dashboard.getMetrics` | `repair_job`, `quotation_details` | Manager เห็นเงิน / Staff เห็นแค่จำนวนงาน |
| แนวโน้ม | `RepairTrendChart`, `RevenueTrendChart` | `getDashboardTrend()` | `GET /api/dashboard/trend` | `dashboard.getTrend` | `repair_job` | `metric_type=revenue` + Staff → **403** |
| สัดส่วนประเภทเครื่อง | `CategoryChart` | `getDashboardCategory()` | `GET /api/dashboard/category` | `dashboard.getCategory` | `repair_jobs_view` | **หมวดจริงจาก DB** (ไม่ยุบเป็น 4 หมวดตายตัว) + ตัวกรองดึงจาก DB |
| การใช้อะไหล่ | `PartsUsageChart` | `getDashboardPartsUsage()` | `GET /api/dashboard/parts-usage` | `dashboard.getPartsUsage` | `quotation_details`, `item` | Staff ได้ `total_cost = 0` |
| ผลงานช่าง/กิจกรรม | `WorkActivityChart` | `getDashboardWorkActivity()` | `GET /api/dashboard/work-activity` | `dashboard.getWorkActivity` | `repair_job_detail` | |
| อาการเสียที่พบบ่อย | `SymptomsChart` | `getDashboardSymptoms()` | `GET /api/dashboard/symptoms` | `dashboard.getSymptoms` | `repair_job` | |

### FLOW-11 จัดการข้อมูล (Manager)
| ขั้น | หน้าจอ | lib/api.ts | API | Controller | ตาราง | กฎ/สถานะ |
|---|---|---|---|---|---|---|
| อะไหล่/ค่าบริการ | `(manager)/item.tsx`, `Manager_item/*` | `getItems/createItem/updateItem/deleteItem` | `/api/items` | `item.*` | `item` | CRUD; ต้องมี `cost_price` เพื่อคิดกำไร; **Phase 1 ปิดสิทธิ์เป็น Manager** |
| ประเภทเครื่อง/ยี่ห้อ/รุ่น | `(manager)/devices.tsx`, `Manager_devices/*` | `*CatalogDeviceType/Brand/Model` | `/api/catalog/*` | `catalog.*` | `device_types`, `brands`, `device_models` | ลบไม่ได้ถ้ามีเครื่อง/รุ่นผูกอยู่ |
| พนักงาน | `(manager)/staff.tsx`, `Manager_staff/*` | `getStaff/updateStaff/deleteStaff` | `/api/staff` | `staff.*` | `profiles` | ลบพนักงาน → ลบ token รีเซ็ตรหัสด้วย |
| รายการงานซ่อม | `(manager)/repairs.tsx` | `getRepairs()` | `GET /api/repairs` | `repair.getAll` | `repair_jobs_view` | อ่านเท่านั้น (ไม่มีปุ่มลบงานบนหน้าจอ) |

### FLOW-12 ความปลอดภัย (ทุกคำขอ)
| ขั้น | ที่ทำงาน | กฎ |
|---|---|---|
| 1 | `server.js` | helmet, cors, rate limit (`/api/` ทั่วไป + auth 50/15 นาที) |
| 2 | `middleware/auth.js` | ตรวจ `Bearer` JWT → โหลด user สดจาก DB → `req.user = {id, role_id, role_name}` |
| 3 | `middleware/role.js` | เทียบชื่อบทบาทที่ route กำหนด |
| 4 | controller | ตรวจเจ้าของข้อมูล/กฎธุรกิจ → `403` |
| 5 | front-end | แสดงผลตาม `role` แต่ **ไม่ใช่** กลไกความปลอดภัย |

---

## 6. รายการไม่สอดคล้องที่พบ และสถานะการแก้

| ID | อาการที่พบ | มาตรฐานที่ควรเป็น | สถานะ |
|---|---|---|---|
| ISS-01 | `constants.ROLES` = STAFF 2 / TECHNICIAN 3 **สลับกับตาราง `roles` จริง** (2=Technician, 3=Staff) → `staff.controller.js:211` เช็คผิดคน | ต้องตรงกับตาราง `roles` | ✅ **แก้แล้ว (Phase 1)** |
| ISS-02 | `POST/PUT/DELETE /api/items` ไม่มี `role(...)` → บทบาทใดก็ลบอะไหล่ได้ | จำกัด Manager | ✅ **แก้แล้ว (Phase 1)** |
| ISS-03 | `POST /api/payments` ตอบ `200` ขณะที่ create อื่นตอบ `201` | create = `201` ทุกที่ | ✅ **แก้แล้ว (Phase 1)** |
| ISS-04 | `quotation.controller` ใช้ชื่อ `delete` แต่ `repair/item/staff/slip` ใช้ `remove` | ใช้ `remove` ทั้งหมด | ✅ **แก้แล้ว (Phase 1)** |
| ISS-05 | `repair.controller` + `staff.controller` มี alias ตายตัว `exports.delete = exports.remove` (ไม่มีใครเรียก) | ห้ามมี alias — ใช้ `remove` ชื่อเดียว | ✅ **แก้แล้ว (Phase 1)** |
| ISS-06 | `showAlert` ถูกประกาศซ้ำ **14 ไฟล์** + `setAlertConfig` ตรง ๆ อีก 6 ไฟล์ + popup เขียนเองใน `slips.tsx` (รวม 20 ไฟล์, 4 signature, มี `'error'` ที่ไม่ใช่ค่ามาตรฐาน) | ใช้ hook กลาง `useAlert()` ตัวเดียว | ✅ **แก้แล้ว (Phase 2a)** — เหลือ `CustomAlert` ที่เดียวในระบบ (ใน hook) |
| ISS-07 | สีแดง hardcode ปนกัน **3 เฉด** (`#DC2626`, `#D32F2F`, `#D62828`) ทั้งที่ `theme.ts` มี `Colors.primary` | อ้างจาก theme | ✅ **แก้แล้ว (Phase 2b)** — 279 จุดใน 84 ไฟล์ เหลือต้นทางที่ `theme.ts` + `tailwind.config.js` |
| ISS-08 | โฟลเดอร์ + กลุ่มเส้นทางสะกดผิด `Meneger_*`, `Technicain_*`, `(meneger)`, `(technicain)` | `Manager_*`, `Technician_*`, `(manager)`, `(technician)` | ✅ **แก้แล้ว (Phase 3)** — 8 โฟลเดอร์ + 64 จุดอ้างอิงใน 13 ไฟล์ |
| ISS-09 | SQL อยู่inline ใน 8 controller แต่แยก `queries/` แค่ 4 | งานยาว/ซ้ำ → ย้ายเข้า `queries/` | ⏳ รอพิจารณา |
| ISS-10 | `AGENTS.md` บอกว่าแอปใช้ Supabase query ตรง + route group `(tabs)` + realtime tab badge + `.env` แบบ Supabase (ไม่มีจริงในโค้ด) และ `eas.json` ยังฝังตัวแปร `EXPO_PUBLIC_SUPABASE_*` ที่ไม่มีใครใช้ | ตัดออก/แก้ให้ตรงจริง | ✅ **แก้แล้ว (Phase 4)** — เขียน `AGENTS.md` ใหม่ทั้งไฟล์ + ลบตัวแปรใน `eas.json`; `handoff.md` ติดป้าย "เอกสารรุ่นเก่า" |
| ISS-11 | `quotation_status` มี id 5 ในฐานข้อมูล แต่ `constants.QUOTE_STATUS` ไม่มี → ทำให้ controller ต้อง **ฝังเลข `5` ดิบ 2 จุด** (`quotation.controller.js:608, 672`) | เพิ่มให้ครบ + ตรงชื่อกับตารางจริง | ✅ **แก้แล้ว (Follow-up)** — กำหนดตรงกับตาราง `quotation_status`: 4 = `REVISING` (ปรับปรุงใบเสนอราคา), 5 = `CHANGE_REQUEST` (ขอแก้ไข/เพิ่มเติมรายการ) ทั้งฝั่งแอปและ API + ลบเลขดิบและคงรายการที่ลูกค้าแก้ได้เป็น `[2,3,4,5]` เท่าเดิม |
| ISS-12 | ฝั่งแอปเปรียบเทียบสถานะด้วยเลขดิบ **ทั้งผ่านชื่อฟิลด์และผ่านตัวแปร** (`quote_status_id === 5`, `statusId === 9`, `quoteStatusId === 4`, `stId === 9`) กระจายหลายไฟล์ | ใช้ `QUOTE_STATUS.*` / `REPAIR_STATUS.*` | ✅ **แก้แล้ว (Follow-up)** — **146 จุด ใน 22 ไฟล์** (ค่าคงที่ให้ค่าเท่าเดิมทุกจุด) · *วิธีทำ:* codemod ที่คงชื่อฟิลด์/ตัวดำเนินการเดิมไว้ 100% + dry-run ตรวจก่อนเขียน · *จุดที่ตั้งใจไม่แตะ:* `response.status === 401` (HTTP status), `item_type_id` (ชนิดอะไหล่ ไม่ใช่สถานะ) |
| ISS-13 | `constants/status.ts` ฝั่งแอป มี `ROLES` **สลับ 2/3** (STAFF 2 / TECHNICIAN 3) เหมือนบั๊กเดิมของฝั่ง API | ต้องตรงกับตาราง `roles` | ✅ **แก้แล้ว (Follow-up)** — ตรวจแล้วไม่มีโค้ดใดอ้างถึง `ROLES` ฝั่งแอป จึงไม่กระทบพฤติกรรม แต่ปิดกับดักไว้ |

---

## 7. ขั้นตอนปรับใช้ (Migration Plan)

**Phase 1 — Back-end (ทำแล้วรอบนี้)**
1. `constants/index.js` → แก้ `ROLES` ให้ตรง DB (ISS-01)
2. `routes/item.routes.js` → เพิ่ม `role('Manager')` (ISS-02)
3. `controllers/payment.controller.js` → create ตอบ `201` (ISS-03)
4. `controllers/quotation.controller.js` + `routes/quotation.routes.js` → `delete` → `remove` (ISS-04)
5. `controllers/repair.controller.js` → ลบ alias (ISS-05)
6. ตรวจผล: `node --check` ทุกไฟล์ + ทดสอบ flow จริงผ่าน HTTP (รับเครื่อง → ใบเสนอราคา → อนุมัติ → ชำระ → ยืนยัน → ส่งมอบ)

**Phase 2a — Front-end: การแจ้งเตือน (ทำแล้วรอบนี้)**
1. สร้าง `hooks/use-alert.tsx` → `useAlert()` เปิด `showAlert` / `showConfirm` / `closeAlert` / `alertElement` (ห่อ `components/ui/CustomAlert.tsx` ที่เดียว)
2. ย้าย **20 หน้าจอ** มาใช้ hook: `item`, `staff`, `devices`, `login`, `register`, `forgot-password`, `reset-password`, `report-error`, `receipt`, `CustomerFormCard`, `AddPartModal`, `detail`, `make-quote`, `job-detail`, `deliver-handover`, `repairing`, `verify-quote`, `verify-payment`, `receive`, `slips`
3. แปลง `'error'` → `'danger'` (4 จุดใน `slips.tsx`) และเติม `type` ให้ชัดเจนทุกจุดที่เดิมพึ่งค่า default (`'danger'` ในกลุ่ม auth/manager)
4. จุดที่เดิมเช็ค `alertConfig.type` ใน JSX เพื่อตัดสินใจนำทาง (เช่น `verify-quote`, `deliver-handover`) → ย้าย logic นั้นไปเป็น `onConfirm` ของแต่ละจุดแทน (พฤติกรรมเหมือนเดิม ไม่มี `hideAlert()` แล้ว)
5. ตรวจผล: `tsc --noEmit` ผ่าน (exit 0) + `eslint` ไม่เพิ่ม error (เหลือ 4 error เดิมใน `app/receipt.tsx` ที่ไม่เกี่ยวกับงานนี้)

**Phase 2b — Front-end: ธีมและสี (ทำแล้วรอบนี้)**
1. รัน codemod **279 จุด ใน 84 ไฟล์**: คลาส Tailwind `bg-[#DC2626]` → `bg-primary` (137 จุด), JSX prop `color="#D32F2F"` → `color={Colors.primary}` (92 จุด), สตริง `'#DC2626'` → `Colors.primary` (37 จุด) + เติม `import { Colors } from '@/constants/theme'` ให้ครบทุกไฟล์ที่ต้องใช้
2. `app/receipt.tsx` — สีใน HTML template (ใบรับซ่อม/ใบเสร็จ) 13 จุด → `${Colors.primary}` (พร้อมแก้สตริงที่เป็น `'...'` ให้เป็น backtick 1 จุด เพื่อให้ `${}` interpolate ได้ — ค่าที่ออกมาเท่าเดิม)
3. `tailwind.config.js` — โทเคน `primary` จาก `#D62828` → `#DC2626` ให้ตรงกับ `Colors.primary` (เป็น "รวมเฉดแดง 3 → 1" ตามเจตนาของ ISS-07)
4. ตรวจผล: `tsc --noEmit` = exit 0 · `eslint` = 4 error / 30 warning เท่าเดิม · grep ยืนยันไม่เหลือรหัสสีแบรนด์นอก `constants/theme.ts` และ `tailwind.config.js`

**Phase 3 — Naming (ทำแล้วรอบนี้)**
1. `git mv` 8 โฟลเดอร์: `app/(meneger)` → `app/(manager)`, `app/(technicain)` → `app/(technician)`, `components/Meneger_{devices,item,staff}` → `Manager_*`, `components/Technicain_{detail,make_quote,quotation}` → `Technician_*`
2. แก้จุดอ้างอิง **64 จุด ใน 13 ไฟล์**: import `@/components/Meneger_*|Technicain_*`, เส้นทาง `router.push/replace('/(meneger)/…' | '/(technicain)/…')`, `<Stack.Screen name="(meneger)|(technicain)">` ใน `app/_layout.tsx`, ค่าปลายทางใน `lib/auth.ts`, และคอมเมนต์
3. ตรวจผล: `tsc --noEmit` = exit 0 · `eslint` = 4 error / 30 warning เท่าเดิม · grep ไม่เหลือคำสะกดผิดในโค้ด
   *หมายเหตุ:* `.expo/types/router.d.ts` เป็นไฟล์ generate (gitignored) ที่ค้างสถานะระหว่างการ rename จึงลบทิ้ง — `expo start` ครั้งถัดไปจะสร้างใหม่ให้ตรง route ปัจจุบัน (ไม่มีผลต่อการรัน)

**Phase 4 — เอกสาร (ทำแล้วรอบนี้)**
1. `my-app-main/AGENTS.md` — เขียนใหม่ทั้งไฟล์: ตัดสิ่งที่ไม่มีจริง (Supabase, `lib/supabase.ts`, `supabase/migrations`, realtime tab badge, route group `(tabs)`, `react-native-url-polyfill`, `lodash`) แล้วระบุ 5 กลุ่มเส้นทาง + tab จริงของแต่ละบทบาท, auth gate/role guard ผ่าน `lib/api.ts` + SecureStore, แหล่งสีเดียว และรายการ dependency ตาม `package.json` จริง
2. `README.md` (root) — แก้ชื่อกลุ่มเส้นทางในผังโปรเจกต์ (`(meneger)`/`(technicain)` → `(manager)`/`(technician)`), แก้ชื่อโฟลเดอร์ `Technicain_detail`, แก้ลิงก์บัญชี Manager ใน Simulation Guide และเพิ่ม What's New ข้อ 6 (มาตรฐานโค้ด + สีแบรนด์เหลือเฉดเดียว)
3. `my-app-main/README.md` — แก้ชื่อกลุ่มเส้นทาง + เพิ่มหมายเหตุอีเมล Manager ที่พิมพ์คลาดเคลื่อน (ยืนยันด้วยการล็อกอินจริงทั้ง 4 บทบาท → `200` ทุกบัญชี)
4. `my-app-main/handoff.md` — ติดป้าย "เอกสารส่งมอบรุ่นเก่า" พร้อมชี้ไปเอกสารปัจจุบัน (คงเนื้อหาเดิมไว้เป็นบันทึกประวัติศาสตร์)
5. `my-app-main/eas.json` — ลบตัวแปร `EXPO_PUBLIC_SUPABASE_*` ที่ไม่มีโค้ดใช้งานแล้ว
6. ตรวจผล: ไม่เหลือคำว่า `supabase` ในโค้ด/config (เหลือเฉพาะในเอกสารที่ระบุว่าเป็นของเก่าหรือเป็นข้อห้าม) · `tsc --noEmit` = exit 0 · `eslint` = 4 error / 30 warning เท่าเดิม

**Follow-up — ปิดค่าคงที่ที่ไม่ตรงฐานข้อมูล (ทำแล้วรอบนี้)**
1. `my-app-main/constants/status.ts` — `ROLES` ฝั่งแอปยังเป็นค่าเก่าที่ **สลับ 2/3** (STAFF 2 / TECHNICIAN 3) ตรงข้ามกับตาราง `roles` จริง → แก้เป็น 1 Manager / 2 Technician / 3 Staff / 4 Customer (ตรวจแล้วไม่มีโค้ดไหนอ้างถึง `ROLES` ฝั่งแอป จึงไม่กระทบพฤติกรรม) = **ISS-13**
2. `constants/status.ts` + `back-end/constants/index.js` — `QUOTE_STATUS` ขาด id 5 และตั้งชื่อ 4 ไม่ตรงความหมาย → ทำตรงกับตาราง `quotation_status`: 4 = `REVISING` (ปรับปรุงใบเสนอราคา), 5 = `CHANGE_REQUEST` (ขอแก้ไข/เพิ่มเติมรายการ) = **ISS-11**
3. `back-end/controllers/quotation.controller.js` — ลบ **magic number `5`** ที่ฝังไว้ 2 จุด (มีเพราะค่าคงที่ขาด) → ใช้ `QUOTE_STATUS.CHANGE_REQUEST`; และเพิ่ม `REVISING` เข้ารายการที่ลูกค้าเปลี่ยนสถานะได้ เพื่อคงพฤติกรรมเดิมครบ `[2,3,4,5]`
4. `app/job-detail.tsx` — จุดที่ *เขียน* สถานะเปลี่ยนจาก `5` / `3` ดิบ → `QUOTE_STATUS.CHANGE_REQUEST` / `REPAIR_STATUS.MAKING_QUOTE`
5. ยังเหลือ: การย้าย SQL ที่ฝังใน controller เข้า `queries/` (= **ISS-09**)
6. `app/(staff)/_layout.tsx` — ลบแท็บ `signing` ที่ประกาศไว้แต่ **ไม่มีไฟล์จริง** (`href: null` จึงไม่เคยแสดงและไม่เคยเข้าได้ — ของค้างจาก flow ที่ถูกลบไปแล้ว)

**Follow-up — กราฟสัดส่วนอุปกรณ์ดึงหมวดจากฐานข้อมูลจริง (ทำแล้วรอบนี้)**
1. เดิม `dashboard.getCategory` ยุบหมวดจากตาราง `device_types` เหลือ **4 หมวดตายตัว** (`pc`/`laptop`/`printer`/`other`) ด้วยการจับคำในชื่อ → ประเภทที่มีจริงแต่ไม่ตรงคำ (เช่น `Monitor`, `Tablet / iPad`) จะถูกนับเป็น "อื่นๆ" เงียบ ๆ
2. เปลี่ยนเป็นส่งหมวดจริงทั้งชุด: `data: { total, types: [{ name, count }] }` เรียงมาก→น้อย (จำนวนเท่ากันเรียงตามชื่อ)
3. `CategoryChart` รับ `types`/`total` แล้ววาดตามข้อมูลจริง — ไอคอน/สีจับคู่จาก **ชื่อประเภท** ถ้าชื่อใหม่ยังไม่รู้จักจะใช้ไอคอนกลาง + สีสำรองตามลำดับ → **เพิ่มประเภทอุปกรณ์ใหม่ในฐานข้อมูลได้โดยไม่ต้องแก้โค้ดกราฟ**
4. ลบ prop ที่ไม่ได้ใช้ (`pcPercent`/`laptopPercent`/`printerPercent`/`otherCount`/`timeFilter`) และตัด 4 หมวดตายตัวออกจาก `DashboardScreen`
5. ตรวจผลจริงผ่าน HTTP: `total 9 = Desktop PC 4 + Notebook / Laptops 4 + Printer / Scanner 1` (ตรงกับ DB) · กรอง `device_type="Notebook / Laptops"` → เหลือ 1 หมวด 4 เครื่อง · Staff ยังดูได้ (ไม่ใช่ข้อมูลการเงิน) · ไม่เหลือฟิลด์เก่า

---

*เอกสารนี้เป็นมาตรฐานกลาง — แก้โค้ดให้ตรงเอกสาร ไม่ใช่แก้เอกสารให้ตรงโค้ด*

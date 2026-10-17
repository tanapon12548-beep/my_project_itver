# 📱 IT VERTEX — Frontend Application (Expo & React Native)

แอปพลิเคชันมือถือและเว็บสำหรับระบบบริหารจัดการงานซ่อม **IT VERTEX** พัฒนาด้วย **Expo SDK 54**, **React Native**, **Expo Router v6** และ **NativeWind (Tailwind CSS)**

> 📖 **คู่มือติดตั้งฉบับเต็มและสคริปต์ฐานข้อมูล:**  
> กรุณาอ่านคู่มือหลักของโปรเจกต์ที่ไฟล์ [../README.md](../README.md) เพื่อดูขั้นตอนการเซ็ตอัพฐานข้อมูล PostgreSQL, รัน Backend และขั้นตอนการจำลอง Flow ทั้งหมด
>
> 🆕 **สิ่งที่เพิ่ม/ปรับปรุงล่าสุด** (มาตรฐานโค้ดทั้งระบบ/`useAlert`, กราฟรายได้–กำไรขั้นต้น, ซ่อนรายได้ตามบทบาท, แจ้งเตือนลูกค้าครบทุกเหตุการณ์, ยกเลิกการสร้างลูกค้าโดยพนักงาน, ลบแนวคิด "วันนัดรับเครื่อง") ดูสรุปได้ที่หัวข้อ [What's New](../README.md#-อัปเดตล่าสุด-whats-new) ในคู่มือหลัก
>
> 📏 **มาตรฐานการเขียนโค้ดฝั่ง Frontend** (การเรียก API ผ่าน `lib/api.ts`, การใช้ `useAlert()`, สีจาก `constants/theme.ts`, สถานะจาก `constants/status.ts`) ดูได้ที่ [STANDARD.md](../STANDARD.md) และ [AGENTS.md](./AGENTS.md)

---

## 🚀 เริ่มต้นใช้งานด่วน (Quick Start)

### 1. ติดตั้ง Dependencies
```bash
npm install
```

### 2. ตั้งค่าการเชื่อมต่อ API (Environment Variables)
ระบบเลือกที่อยู่ API ให้อัตโนมัติ — บนเว็บใช้ `http://localhost:3002/api` และบนมือถือ (Expo Go / dev build) จะใช้ IP ของเครื่องที่รัน Expo Dev Server ให้เอง  
หากต้องการระบุเอง ให้สร้างไฟล์ `.env` ที่โฟลเดอร์นี้:
```env
EXPO_PUBLIC_API_URL=http://localhost:3002/api
```

### 3. รันโปรเจกต์
```bash
# รันโหมด Web Browser
npm run web

# หรือเปิด Expo Dev Menu (ล้างแคช)
npm start -- --clear
```
เข้าใช้งานผ่านเบราว์เซอร์ที่: **`http://localhost:8081`**

---

## 🔑 บัญชีทดสอบระบบ (Test Accounts)

| บทบาท (Role) | อีเมล (Email) | รหัสผ่าน (Password) |
|---|---|---|
| **Manager (ผู้จัดการ)** | `Manager1234@gmail.com` | `Manager1234@gmai.comZ` |
| **Technician (ช่างซ่อม)** | `technician1@gmail.com` | `technician1@gmail.comZ` |
| **Staff (พนักงานหน้าร้าน)** | `staff1@gmail.com` | `staff1@gmail.comZ` |
| **Customer (ลูกค้า)** | `cus1@gmail.com` | `cus1@gmail.comZ` |

*(ทุกรหัสผ่านลงท้ายด้วยตัวอักษร `Z` ตัวใหญ่)*

> ℹ️ **หมายเหตุ:** อีเมล Manager คือ `Manager1234@gmail.com` แต่ **รหัสผ่าน** สะกดเป็น `Manager1234@gmai.comZ` (ขาด `l`) ตามที่บันทึกไว้จริงในฐานข้อมูล — ห้ามแก้เป็น `gmail` จะทำให้ล็อกอินไม่ได้
> บัญชีทั้ง 4 บทบาทนี้ถูกทดสอบล็อกอินผ่าน `POST /api/auth/login` แล้วได้ `200` ทุกบัญชี

---

## 📂 โครงสร้างหน้าจอ (App Routes)

- `app/(auth)/` — หน้าล็อกอิน, ลงทะเบียน, ลืมรหัสผ่าน
- `app/(staff)/` — พนักงานหน้าร้าน (ภาพรวม `/`, รับเครื่อง `/receive`, ส่งมอบ `/deliver`, รายการซ่อม `/repairs`)
- `app/(technician)/` — ช่างซ่อม (รายการซ่อม, ตรวจเช็ค `/checking`, ใบเสนอราคา `/repairing`)
- `app/(manager)/` — ผู้จัดการร้าน (ภาพรวม/แดชบอร์ด, รายการซ่อม, อะไหล่ `/item`, อุปกรณ์ `/devices`, พนักงาน `/staff`)
- `app/(customer)/` — ลูกค้า (รายการซ่อม `/`, **แจ้งเตือน `/notifications`**, โปรไฟล์, ตรวจสอบและอนุมัติ/ตีกลับใบเสนอราคา)
- `app/make-quote.tsx` — หน้าออกใบเสนอราคาของช่าง
- `app/deliver-handover.tsx` — หน้าส่งมอบเครื่องพร้อมเซ็นชื่อรับเครื่องแบบดิจิทัล
- `app/verify-payment.tsx` — หน้าจอยืนยัน/ปฏิเสธการชำระเงิน (ปฏิเสธแล้วกลับหน้าก่อนหน้าเพื่อรอสลิปใหม่)
- `app/receipt.tsx` — หน้าใบเสร็จรับเงิน (พิมพ์/แชร์ผ่าน `expo-print` + `expo-sharing`)
- `app/detail.tsx` — หน้ารายละเอียดงานซ่อมฉบับเต็ม

---

### 📁 โฟลเดอร์ที่สำคัญ

- `components/` — UI Components แยกตามโมดูล (`Shared_Repairs`, `Staff_receive`, `Technician_make_quote`, `Manager_*`, `ui`, ...)
- `constants/` — `status.ts` (สถานะงาน/สถานะใบเสนอราคา/บทบาท) และ `theme.ts` (สีและฟอนต์กลาง)
- `hooks/` — `use-alert.tsx` (กล่องแจ้งเตือน/ยืนยันกลางที่ใช้ทุกหน้าจอ), `use-password-strength`, `use-color-scheme`
- `lib/` — `api.ts` (REST API + JWT), `auth.ts` (login/register/logout/redirect ตามบทบาท), `deviceTypeLabel.ts`
- `types/` — Type ของข้อมูล (`repair`, `quotation`, `device`, `item`, `payment`, `user`)

# 📱 IT VERTEX — Frontend Application (Expo & React Native)

แอปพลิเคชันมือถือและเว็บสำหรับระบบบริหารจัดการงานซ่อม **IT VERTEX** พัฒนาด้วย **Expo SDK 54**, **React Native**, **Expo Router v6** และ **NativeWind (Tailwind CSS)**

> 📖 **คู่มือติดตั้งฉบับเต็มและสคริปต์ฐานข้อมูล:**  
> กรุณาอ่านคู่มือหลักของโปรเจกต์ที่ไฟล์ [../README.md](../README.md) เพื่อดูขั้นตอนการเซ็ตอัพฐานข้อมูล PostgreSQL, รัน Backend และขั้นตอนการจำลอง Flow ทั้งหมด
>
> 🆕 **สิ่งที่เพิ่ม/ปรับปรุงล่าสุด** (กราฟรายได้–กำไรขั้นต้น, ซ่อนรายได้ตามบทบาท, ตัวกรองประเภทอุปกรณ์จากฐานข้อมูล, ลบแนวคิด "วันนัดรับเครื่อง") ดูสรุปได้ที่หัวข้อ [What's New](../README.md#-สิ่งที่เพิ่มปรับปรุงล่าสุด-whats-new) ในคู่มือหลัก

---

## 🚀 เริ่มต้นใช้งานด่วน (Quick Start)

### 1. ติดตั้ง Dependencies
```bash
npm install
```

### 2. ตั้งค่าการเชื่อมต่อ API (Environment Variables)
ระบบเชื่อมต่อ API อัตโนมัติไปที่ `http://localhost:3002/api` เป็นค่าเริ่มต้น  
หากต้องการแก้ไข สามารถสร้างไฟล์ `.env` ที่โฟลเดอร์นี้:
```env
EXPO_PUBLIC_API_URL=http://localhost:3002/api
```

### 3. รันโปรเจกต์
```bash
# รันโหมด Web Browser
npm run web

# หรือเปิด Expo Dev Menu
npx expo start -c
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

> ℹ️ **หมายเหตุจากฐานข้อมูลจริง:** อีเมล Manager คือ `Manager1234@gmail.com` (เอกสารเดิมพิมพ์คลาดเคลื่อนเป็น `gmai.com`)
> แต่ **รหัสผ่าน** ของ Manager สะกดเป็น `Manager1234@gmai.comZ` (ขาด `l`) ตามที่บันทึกไว้จริงในฐานข้อมูล — ห้ามแก้เป็น `gmail` จะทำให้ล็อกอินไม่ได้
> บัญชีทั้ง 4 บทบาทนี้ถูกทดสอบล็อกอินผ่าน `POST /api/auth/login` แล้วได้ `200` ทุกบัญชี

---

## 📂 โครงสร้างหน้าจอ (App Routes)

- `app/(auth)/` — หน้าล็อกอิน, ลงทะเบียน, ลืมรหัสผ่าน
- `app/(staff)/` — พนักงานหน้าร้าน (ภาพรวม `/`, รับเครื่อง `/receive`, ส่งมอบ `/deliver`, รายการซ่อม `/repairs`)
- `app/(technician)/` — ช่างซ่อม (รายการซ่อม, ตรวจเช็ค `/checking`, ใบเสนอราคา `/repairing`)
- `app/(manager)/` — ผู้จัดการร้าน (ภาพรวม/แดชบอร์ด, รายการซ่อม, อะไหล่ `/item`, อุปกรณ์ `/devices`, พนักงาน `/staff`)
- `app/(customer)/` — ลูกค้า (ดูประวัติซ่อม, ตรวจสอบและอนุมัติใบเสนอราคา)
- `app/make-quote.tsx` — หน้าออกใบเสนอราคาของช่าง
- `app/deliver-handover.tsx` — หน้าส่งมอบเครื่องพร้อมเซ็นชื่อรับเครื่องแบบดิจิทัล
- `app/verify-payment.tsx` — หน้าจอยืนยันการชำระเงิน
- `app/detail.tsx` — หน้ารายละเอียดงานซ่อมฉบับเต็ม

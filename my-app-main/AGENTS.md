# ITVertex — Agent Guide

Expo SDK 54 / RN 0.81 / React 19.1 / NativeWind v4 / REST API (Node.js + Express — ดู `../back-end`)

## Dev commands

```bash
npm start          # expo start
npm run android    # expo run:android (dev build)
npm run ios        # expo run:ios (dev build)
npm run web        # expo start --web
npm run lint       # expo lint (eslint-config-expo flat config)
```

No test suite configured. Typecheck ด้วยไบนารีในโปรเจกต์ (บนเครื่อง dev นี้ `npx` ใช้ไม่ได้):

```bash
node node_modules/typescript/bin/tsc --noEmit
node node_modules/eslint/bin/eslint.js .
```

## Key setup

- **`.env`** (gitignored, ไม่บังคับ): `EXPO_PUBLIC_API_URL` ชี้ไปที่ Backend — ค่าเริ่มต้นคือ `http://localhost:3002/api` (ดูตัวอย่างใน `.env.example`). ทดสอบบนมือถือต้องเปลี่ยนเป็น IP ของเครื่อง dev เพราะ `localhost` ใช้ไม่ได้
- **Backend แยกโปรเจกต์** อยู่ที่ `../back-end` (Express + PostgreSQL, พอร์ตเริ่มต้น 3002) — ต้องรันก่อนใช้งาน Frontend เสมอ
- **`global.css`** loaded in `app/_layout.tsx` — imports Tailwind layers + Kanit font-face rules + icon font exclusion guards.
- **Path alias**: `@/` maps to project root (tsconfig paths).

## Architecture

- **Expo Router v6** file-based routing — 5 route groups (ชื่อกลุ่มไม่ปรากฏใน URL):
  - `(auth)/` — login, register, forgot-password, reset-password
  - `(customer)/` — bottom tabs: รายการซ่อม · แจ้งเตือน · โปรไฟล์
  - `(staff)/` — bottom tabs: ภาพรวม · รายการซ่อม · รับเครื่อง · ส่งมอบ · โปรไฟล์
  - `(technician)/` — bottom tabs: รายการซ่อม · ตรวจเช็ค · ใบเสนอราคา · โปรไฟล์
  - `(manager)/` — bottom tabs: ภาพรวม · รายการซ่อม · อะไหล่ · อุปกรณ์ · พนักงาน · โปรไฟล์
  - หน้าจอที่ใช้ร่วมกันหลายบทบาทอยู่ที่ `app/` ระดับบนสุด: `detail`, `job-detail`, `make-quote`, `deliver-handover`, `verify-payment`, `verify-quote`, `receipt`, `slips`, `report-error`, `schedule-pickup`, `profile`
- **Auth gate**: `app/index.tsx` → `getCurrentUser()` (JWT ที่เก็บใน SecureStore) → `getRoleRedirectPath()` พาไปยังกลุ่มตามบทบาท; ไม่มี token → `(auth)/login`
- **Role guard**: `app/(group)/_layout.tsx` ของแต่ละกลุ่มตรวจบทบาทซ้ำอีกชั้น ถ้าไม่ตรงจะ redirect กลับ (`(manager)` = Manager, `(technician)` = Technician, `(staff)` = Staff, `(customer)` = Customer)
- **ไม่มี Supabase / realtime subscription / tab badge** — ข้อมูลทุกอย่างดึงผ่าน REST API ใน `lib/api.ts`

## Styling

- **NativeWind v4** (Tailwind 3.4). Babel preset `jsxImportSource: "nativewind"`. Metro config wraps `withNativeWind(config, { input: "./global.css" })`.
- **Dark mode** via `class` strategy (`darkMode: "class"`). Custom `useColorScheme` hook.
- **Theme color (แหล่งเดียว)**: แดงแบรนด์ `#DC2626` = `Colors.primary` ใน `constants/theme.ts` (ใช้ใน JS/TSX) และโทเคน `primary` ใน `tailwind.config.js` (ใช้เป็นคลาส `bg-primary` / `text-primary`) — **ห้าม hardcode รหัสสีแบรนด์ในหน้าจอ** (ดู `../STANDARD.md` §3.4)
- **Kanit** is the global font (via `@expo-google-fonts/kanit`). Manager dashboard uses `Prompt-Regular` + `IBMPlexSansThai-Regular` (loaded from `assets/font/`).
- **`global.css`** has aggressive `!important` font-family override with icon-font exclusion selectors — be careful when touching.

## State / data

- **REST API layer** in `lib/api.ts` — `api.get/post/put/patch/del`, `fetchWithAuth`, และเก็บ JWT ด้วย `expo-secure-store` (`getToken` / `saveToken` / `removeToken`)
- **Auth helpers** in `lib/auth.ts` — `login` / `register` / `logout` / `getCurrentUser` / `getRoleRedirectPath`; ป้ายชื่อประเภทอุปกรณ์ที่ใช้ร่วมกันทุกกราฟอยู่ที่ `lib/deviceTypeLabel.ts`
- **No Supabase, no React Query / SWR** — หน้าจอเรียก `lib/api.ts` ตรง ๆ แล้วจัดการ state เอง (แผนผัง data flow ดู `../STANDARD.md` §1)

## Notable deps

- `react-native-reanimated` + `react-native-worklets`
- `react-native-gesture-handler`, `react-native-screens`, `react-native-safe-area-context`
- `react-native-signature-canvas` + `react-signature-canvas` (signature capture), `react-native-webview`
- `expo-print` + `expo-sharing` (PDF ใบรับซ่อม/ใบเสร็จ), `expo-image-picker` (อัปโหลดสลิป)
- `react-native-gifted-charts` + `react-native-svg` (กราฟแดชบอร์ด)
- `react-native-element-dropdown`
- `@expo/vector-icons` (Ionicons, Feather), `@expo-google-fonts/kanit`
- `expo-secure-store` (เก็บ JWT), `expo-linear-gradient`, `expo-splash-screen`, `expo-image`, `expo-haptics`, `expo-web-browser`
- `babel-plugin-react-compiler` (experimental React Compiler), `expo-dev-client`

## EAS

- Project ID: `53c66284-b8ad-40ae-85ed-11680d1b823c`
- Profiles: `development` (dev client), `preview` (APK, internal), `production` (auto-increment version)
- `newArchEnabled: true` (Fabric)

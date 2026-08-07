# Frontend — Autonomous Career Agent (Next.js 14, App Router)

Giao diện web cho nền tảng tìm việc & tạo CV bằng AI. Next.js 14 (App Router) + React 18 + TypeScript (strict) + CSS Modules.

## Chạy local

```bash
npm install
npm run dev        # http://localhost:3000
```

Các lệnh khác:

```bash
npm run build      # build production
npm run start      # chạy bản build (port 3000)
npm run lint       # ESLint
npm run test       # Vitest (unit test tầng lib/)
npx tsc --noEmit   # kiểm tra kiểu
```

**Trước khi mở PR:** `npm run lint && npx tsc --noEmit && npm run test && npm run build` phải xanh hết.

---

## Nguyên tắc cốt lõi: phân tầng, import chỉ đi xuống

Code chia thành các **tầng**, import **chỉ được đi từ trên xuống**:

```
app/         (route/trang)              biết mọi tầng dưới
  ↓ import
components/  (UI tái dùng)              không import từ app/
  ↓ import
hooks/       (state React dùng chung)   không import từ components/
  ↓ import
lib/         (logic thuần, KHÔNG React) không import hooks/components
  ↓ import
types/       (kiểu TS)                  không import gì
```

Nhớ: **`app` dùng `components`; `components` dùng `hooks` + `lib`; `lib` không biết gì về React/UI.** Theo đúng chiều này thì code luôn tách bạch, dễ test, ít đụng nhau.

Mọi import dùng alias `@/…` (cấu hình trong `tsconfig.json`), không dùng `../../..`:

```ts
import { TextField } from "@/components/ui/TextField";
import { findUser } from "@/lib/auth";
```

---

## Cấu trúc thư mục

```
frontend/
├── app/                      # Next.js App Router — route + component RIÊNG của trang (colocate)
│   ├── layout.tsx            # khung gốc (<html>/<body>, font, metadata)
│   ├── globals.css           # CSS toàn cục: token :root + reset + class chung (sidebar/nav…)
│   ├── page.tsx              # route "/" = landing (lắp ráp landing/*)
│   ├── landing/              # component riêng trang landing (Hero.tsx… + *.module.css)
│   ├── signin/page.tsx       # "/signin" = đăng nhập (dùng components/auth/*)
│   ├── cv-manager/           # /cv-manager (CvManager.tsx, CvEditor.tsx + cv-manager.module.css)
│   ├── jobs/                 # (chưa refactor)
│   ├── profile-setup/        # (chưa refactor)
│   └── profile-preferences/  # (chưa refactor)
├── components/               # UI tái dùng NHIỀU trang — chia theo LOẠI
│   ├── ui/                   # generic dùng cả app (TextField, …)
│   ├── icons/                # SVG icon dùng chung (index.tsx)
│   └── auth/                 # theo feature: LoginForm, RegisterForm, AuthHero, auth.module.css
├── lib/                      # logic thuần, KHÔNG React
│   ├── storage.ts            # KEYS + readJSON/writeJSON (SSR-safe)
│   ├── auth.ts               # hashPassword, getUsers, saveUser, findUser, emailExists
│   ├── validation.ts         # isValidEmail, isValidPassword
│   └── __tests__/            # unit test Vitest
├── hooks/                    # React hook dùng chung (useAuth)
├── types/                    # interface TS dùng chung (StoredUser, SessionUser)
├── tsconfig.json             # alias @/*
└── vitest.config.ts          # test: jsdom + alias @
```

### Vai trò từng tầng

| Thư mục                 | Chứa gì                                                                                             | Ví dụ                          |
| ----------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------ |
| `app/<route>/`          | Route + component **riêng của trang đó** (colocate, kèm `.module.css`). Không viết logic nghiệp vụ. | `app/cv-manager/CvManager.tsx` |
| `components/ui/`        | UI generic, không dính nghiệp vụ                                                                    | `TextField`                    |
| `components/icons/`     | Icon SVG dùng chung                                                                                 | `EmailIcon`, `LockIcon`        |
| `components/<feature>/` | UI **dùng lại ở nhiều trang** + `.module.css`                                                       | `components/auth/LoginForm`    |
| `lib/`                  | Hàm thuần, test độc lập, không React. Nơi đổi mock→API thật                                         | `lib/auth.ts`                  |
| `hooks/`                | State React dùng lại nhiều nơi                                                                      | `useAuth()`                    |
| `types/`                | Kiểu dữ liệu dùng chung                                                                             | `StoredUser`                   |

### Đặt component ở đâu?

Quy tắc một câu: **tái dùng → `components/`; riêng một trang → cạnh `page.tsx`.** Cả hai đều dùng CSS Modules.

- **Dùng lại ở nhiều trang** (Button, TextField, form auth, icon…) → `components/` (`ui/`, `icons/`, `<feature>/`).
- **Chỉ phục vụ MỘT trang** (Hero của landing, CvManager của `/cv-manager`…) → **colocate ngay trong route folder** `app/<route>/`, cùng file `.module.css` của nó — không cần nhét vào `components/`.

Đây là pattern chuẩn của Next.js App Router: component riêng của trang nằm cạnh trang, dễ tìm; chỉ thứ gì dùng lại mới tách ra `components/`.

---

## Luồng hoạt động (trang đăng nhập)

1. **`app/page.tsx`** giữ đúng một state `tab` ('login' | 'register'), render `<AuthHero/>` + hai nút tab + form tương ứng, truyền callback đổi tab xuống form.
2. **`LoginForm`**: giữ state cục bộ → validate (`lib/validation`) → `findUser` (`lib/auth`, tự `hashPassword` rồi so với `getUsers()`) → gọi `login()` của `useAuth` (ghi **session vào `sessionStorage`**) → đọc cờ onboarding và điều hướng `/profile-setup` → `/profile-preferences` → `/dashboard`.
3. **`RegisterForm`**: validate → `emailExists` → `saveUser` (kèm `hashPassword`, `createdAt`) → banner thành công → gọi `onSwitchToLogin`.
4. **`TextField`** gói phần lặp (label + icon + input + nút hiện/ẩn mật khẩu + lỗi); form chỉ truyền props.

### ⚠️ Hai vùng lưu trữ — đừng nhầm

| Vùng             | Dùng cho                                                                                                             | Cách đọc                                                                                        |
| ---------------- | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `localStorage`   | danh sách user (`careernav_users`), cờ onboarding (`careernav_profile_completed`, `careernav_preferences_completed`) | cờ được ghi **chuỗi thô** `'true'` → đọc bằng `getItem(...) === 'true'`, **KHÔNG** `JSON.parse` |
| `sessionStorage` | phiên đăng nhập (`careernav_session`) — hết khi đóng tab                                                             | `useAuth` và các trang onboarding phải cùng dùng `sessionStorage` cho key này                   |

**Luôn dùng `KEYS.x` trong `lib/storage.ts`, không gõ chuỗi key bằng tay.**

---

## Quy ước để code song song KHÔNG conflict

Conflict xảy ra khi hai người sửa cùng một file. Kiến trúc này giảm điều đó tối đa:

- **Một trang = một thư mục riêng** trong `app/`. Khác thư mục → không đụng nhau.
- **Một file = một trách nhiệm.** Logic ở `lib/`, state ở `hooks/`, UI tái dùng ở `components/<feature>/`, UI riêng trang colocate trong `app/<route>/` → mỗi người một file.
- **CSS Modules = hết đụng tên class.** Mỗi component có `.module.css` co-locate, class được hash tự động và scope riêng. Style của trang nào để trong `.module.css` của trang đó.
- **Component chung → chia nhỏ**, mỗi thứ một file trong `components/ui/`.

### Ba file "dùng chung" cần kỷ luật (nơi duy nhất dễ đụng)

- `components/icons/index.tsx` — _append_ icon mới ở cuối file. Phình to thì tách nhiều file.
- `app/globals.css` — **chỉ** thêm token/biến hoặc class thật sự toàn cục. Style một trang → cho vào `.module.css`, không nhét vào đây.
- `lib/api.ts` (khi nối backend) — nhóm theo domain hoặc tách `lib/api/jobs.ts`, `lib/api/auth.ts` để mỗi người một file.

### Golden path: thêm trang `/dashboard`

1. Tạo `app/dashboard/page.tsx` + `app/dashboard/dashboard.module.css` (file mới → không đụng ai).
2. Cần user đăng nhập? `import { useAuth } from '@/hooks/useAuth'`.
3. Cần input/nút? `import { TextField } from '@/components/ui/TextField'`. Icon mới → append vào `components/icons/index.tsx`.
4. Logic mới thuần → tạo `lib/<name>.ts` + test trong `lib/__tests__/`.
5. Style → viết trong `dashboard.module.css` của riêng mình.
6. Mở PR nhỏ; reviewer chỉ đọc file mới + phần append.

---

## Quy ước code (tóm tắt)

- TypeScript strict, **không dùng `any`**, type hint cho hàm public.
- Function component; 2-space indent (ESLint + Prettier).
- Route folder đặt tên `kebab-case`.
- Import qua `@/…`; key lưu trữ qua `KEYS`.
- Logic thuần đặt ở `lib/` và **có unit test** (Vitest).

Xem thêm `docs/CODING_CONVENTION.md` ở gốc repo.

# Cafe VALA (Cloudflare Workers + D1) — 2 پنل (مشتری + مدیریت)

این پروژه برای اجرای «منوی آنلاین QR + ثبت سفارش + تایید گارسون + ارسال به صندوق + پرداخت نقدی» ساخته شده.

## پیش‌نیازها
- Node.js 18+
- اکانت Cloudflare
- نصب Wrangler: `npm i -g wrangler`

---

## قدم 1) ساخت D1 و اعمال دیتابیس
1) داخل پوشه پروژه:
```bash
wrangler d1 create cafe-vala
```
اسم دیتابیس خروجی را بردار و در `wrangler.toml` جایگزین کن.

2) اعمال اسکیما:
```bash
wrangler d1 execute cafe-vala --file=sql/schema.sql
```

3) داده اولیه (ادمین + تم):
```bash
wrangler d1 execute cafe-vala --file=sql/seed.sql
```

> یوزر/پسورد پیش‌فرض پنل مدیریت:
- username: `admin`
- password: `admin123`

---

## قدم 2) تنظیم Secret
در Cloudflare Worker یک SECRET برای امضای کوکی سشن لازم داریم.

لوکال:
```bash
wrangler secret put SECRET
```
یک رشته طولانی وارد کن.

---

## قدم 3) اجرا و تست لوکال
```bash
npm i
npm run dev
```
- مشتری: `http://localhost:8787/`
- مدیریت: `http://localhost:8787/admin/login`

---

## قدم 4) Deploy
```bash
npm run deploy
```

---

## مسیرها
### Pages
- `/` صفحه اول
- `/table` ثبت شماره میز
- `/menu` پیشنهاد روز → تخفیف روز → منو کامل → پیام
- `/track?code=...` پیگیری سفارش
- `/admin/login` ورود مدیریت
- `/admin` پنل مدیریت (گارسون + صندوق + پیشنهاد روز + تخفیف‌ها + منو + پیام‌ها + گزارش)

### Status سفارش
- `pending_waiter`
- `accepted_waiter`
- `paid`
- `rejected`

---

## نکته توسعه‌پذیری
- UI فقط از API استفاده می‌کند. تغییر UI = تغییر فایل‌های `/src/pages/*`.
- منطق قیمت/تخفیف و Snapshot فقط در API است.
- تخفیف‌ها فقط از پنل مدیریت و جدول `discount_rules` کنترل می‌شوند.


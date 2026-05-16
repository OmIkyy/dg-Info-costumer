&nbsp;

## Ringkasan

Update besar yang menambah 7 area: branding settings, alamat Indonesia bertingkat, paket dinamis, jenis pelanggan dinamis, rekap & statistik dengan filter+export, form register baru, dan polish UI/UX. Karena scope-nya luas (estimasi 15+ file baru, 10+ migrasi/perubahan DB), saya pecah jadi 4 fase agar bisa di-review per langkah.

---

## Fase 1 — Database & Backend Foundation

Migrasi tunggal yang menambah:

**Tabel baru**

- `site_settings` (singleton row): `site_name`, `site_title`, `site_description`, `footer_text`, `primary_color`, `logo_url`, `favicon_url`, `og_image_url`. RLS: read public, write ADMIN.
- `packages`: `nama`, `kecepatan_text` (free-text mis. "100 Mbps Fiber"), `kecepatan_mbps` (int untuk sort), `harga`, `deskripsi`, `warna`, `icon`, `urutan`, `aktif`. RLS: read all auth, write ADMIN.
- `customer_types`: `nama`, `aktif`, `urutan`. RLS sama dengan packages.

**Kolom baru di `customers**`

- `provinsi_code`, `provinsi_nama`, `kota_code`, `kota_nama`, `kecamatan_code`, `kecamatan_nama`, `kelurahan_code`, `kelurahan_nama`. Field `alamat` lama tetap dipakai sebagai "detail alamat".
- Kolom `paket` & `jenis` tetap text (backward compatible) — diisi dari nama package/type yang dipilih, plus `paket_id`, `jenis_id` opsional.

**Storage bucket**

- `branding` (public) untuk logo/favicon/og image.

**Seed**: 1 row site_settings default + beberapa package & customer type contoh.

---

## Fase 2 — Settings & Branding

- Halaman `/admin/settings/general` (ADMIN only) dengan tabs: General | Branding | Appearance.
- Upload logo/favicon/OG (pakai SignedImage existing pattern, tapi public bucket).
- Color picker untuk primary color → menulis ke CSS variable `--primary` runtime.
- Hook `useSiteSettings()` global yang load dari DB + realtime, lalu apply ke `<title>`, favicon link, dan CSS vars.
- Sidebar logo & nama otomatis ikut.

---

## Fase 3 — Master Data (Packages, Customer Types, Wilayah)

- `/admin/packages` — CRUD table + dialog form.
- `/admin/customer-types` — CRUD table + dialog form.
- Komponen `<AddressPicker>` 4-level searchable dropdown, data dari API publik `wilayah.id` (`https://wilayah.id/api/`) — gratis, tanpa key, di-cache di react-query. Mobile-friendly via `Command` shadcn.
- Update `CustomerNew` & `Customers` form: pakai AddressPicker + dropdown packages/types dari DB.

---

## Fase 4 — Rekap, Register, UI Polish

**Rekap & Statistik**

- DateRange filter: Hari ini / 7 / 30 / 365 / custom (pakai `react-day-picker` yang sudah ada).
- Statistik page: line chart pelanggan masuk per hari, bar chart per status, kartu total (masuk, pemasangan, pending). Pakai recharts (sudah terpasang).
- Export Excel via `xlsx` lib, Export PDF via `jspdf` + autotable.
- Filter sama dipasang di Recap WA generator.

**Register baru**

- Field: nama_depan, nama_belakang, email, password, confirm_password.
- Show/hide password toggle, strength meter (zxcvbn-like sederhana berbasis regex), realtime validation pakai react-hook-form + zod.
- Loading state, disable button, animasi smooth (transitions Tailwind).

**UI/UX polish**

- Tweak `index.css` & `tailwind.config.ts`: rounded-2xl default card, softer shadow, spacing lebih lega.
- AppSidebar: refactor jadi grouping logis, gunakan logo dari site_settings.
- Mobile nav: pastikan SidebarTrigger selalu visible di header, sheet smooth.

---

## Catatan teknis

- Wilayah Indonesia: pakai `https://wilayah.id/api/provinces.json` dst. Jika user ingin self-host data, bisa di-discuss nanti.
- Realtime pada site_settings & packages → semua client auto-update tanpa reload.
- Semua form pakai react-hook-form + zod (sudah terpasang).
- Tidak menyentuh edge functions; semua via supabase-js + RLS.

---

## Pertanyaan sebelum mulai

- **Sumber data wilayah**: pakai API publik `wilayah.id` (live fetch + cache) — OK?
- **Field nama**: register diubah jadi `nama_depan` + `nama_belakang`. Tabel `profiles` saat ini cuma punya `nama` (gabungan). Boleh saya simpan gabungan saja `${depan} ${belakang}` ke `nama`, atau perlu kolom terpisah?
- Apakah saya kerjakan **semua 4 fase sekaligus** dalam satu kali jalan (besar, ~30+ file), atau **per fase** dengan review di antaranya?

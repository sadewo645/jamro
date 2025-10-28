# Jamro Palm Estate & Mill Platform

Jamro adalah prototipe platform monitoring kebun dan pabrik kelapa sawit dengan percepatan waktu simulasi. Monorepo ini berisi API Node.js tanpa dependensi eksternal dan antarmuka web statis modular yang memvisualisasikan hasil feed simulasi.

## Struktur Monorepo

```
apps/
├── api/   # REST API + SSE untuk data kebun, pabrik, norma HK, biaya
└── web/   # Dashboard web statis yang memanfaatkan API
```

## Menjalankan Secara Lokal

1. **API**

   ```bash
   npm run dev:api
   ```

   Server berjalan pada `http://localhost:4000`.

2. **Web Dashboard**

   ```bash
   npm run dev:web
   ```

   Server statis berjalan pada `http://localhost:5173`.

### Akun Uji

| Role      | Email                 | Password    |
|-----------|-----------------------|-------------|
| Direktur  | director@example.com  | director123 |
| Mandor    | mandor@example.com    | mandor123   |
| Pekerja   | pekerja@example.com   | pekerja123  |

Pengembang dapat melakukan elevasi sementara menggunakan kode `123456` melalui formulir khusus di UI.

## Fitur API

- Login JWT + elevasi pengembang.
- Manajemen Afdeling & Blok (in-memory store + validasi kode unik).
- Feed simulasi otomatis (1 hari simulasi tiap 30 detik real) mencakup input mandor, panen, transportasi, dan metrik pabrik.
- Endpoint agregasi kebun/pabrik dan ringkasan biaya.
- SSE `/live` untuk update waktu simulasi.

## Dashboard Web

- Modul Monitoring Kebun, Monitoring Pabrik, Panduan Budidaya, Norma HK, dan Cost Produksi.
- UI tematik dengan KPI cards, daftar afdeling/blok/stasiun, dan highlight percepatan waktu.
- Konsumsi API langsung tanpa bundler eksternal.

> Catatan: Implementasi ini fokus pada prototipe tanpa database permanen. Seluruh data disimpan secara in-memory dan di-reset ketika server API dimulai ulang.

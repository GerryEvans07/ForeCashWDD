# ForeCash

Aplikasi web peringatan dini keuangan untuk mahasiswa. Proyek akhir IS556 Web Design and Development, Kelompok 4.

ForeCash menghitung rata-rata pengeluaran harian (*burn rate*), memperkirakan tanggal saldo habis, dan memberi peringatan **sebelum** uang habis duluan daripada kiriman berikutnya. Orang tua dapat memantau ringkasan keuangan anak tanpa bisa mengubah datanya.

## Teknologi

| Bagian | Teknologi |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router) + React 19 + TypeScript |
| Tampilan | Tailwind CSS 4, font Satoshi (Fontshare), ikon lucide-react, grafik recharts |
| Database, login, penyimpanan file | [Supabase](https://supabase.com) (PostgreSQL + Auth + Storage) lewat `@supabase/ssr` |
| Email | [Resend](https://resend.com) |
| Hosting | [Vercel](https://vercel.com) |

Versi sebelumnya disimpan sebagai cadangan: `php-version/` (PHP + MySQL) dan `prototype-html/` (HTML/CSS/JS tanpa database).

## Fitur

1. **Akun:** daftar, login, login dengan Google, lupa & ganti kata sandi, pilih avatar.
2. **Beranda:** banner peringatan dini (Aman / Waspada / Kritis), total saldo, burn rate, ringkasan utang, aksi cepat, saldo per wallet, transaksi terakhir.
3. **Transaksi:** pemasukan, pengeluaran, transfer antar wallet, foto struk, ubah & hapus, batas harian, kategori sendiri, ekspor CSV. Kelola wallet.
4. **Utang & Patungan:** utang/piutang, split bill, pengingat WhatsApp, tombol Lunas yang otomatis menjadi transaksi.
5. **Prediksi:** jadwal pemasukan, proyeksi saldo 30 hari, simulasi "bagaimana jika".
6. **Laporan:** pengeluaran per kategori, rasio tabungan.
7. **Petualangan:** peta perjalanan menuju uang saku, telur yang menetas setelah 7 hari baik, 12 teman hemat.
8. **Pencapaian:** poin, level, streak, 7 badge, tantangan mingguan.
9. **Pantau Anak:** peran orang tua, terhubung lewat kode 8 karakter, hanya bisa melihat.
10. **ForeCash Assistant:** chatbot berbasis aturan (*keyword matching*) yang menjawab dari data user, tanpa AI API.
11. **Email:** selamat datang & peringatan saat status Kritis (maks. sekali sehari) lewat Resend.

## Logika peringatan dini

Ada di `src/lib/forecast.ts` dan diuji di `tests/forecast.test.ts`:

- **Burn rate** = total pengeluaran 14 hari terakhir ÷ 14. Pengguna baru: dibagi jumlah hari sejak pengeluaran pertama (min. 3, maks. 14). Transfer tidak dihitung.
- **Runway** = saldo ÷ burn rate, dibulatkan ke bawah. **Tanggal habis** = hari ini + runway.
- **Batas aman** = saldo ÷ jumlah hari menuju pemasukan berikutnya.
- **Status:** *Waspada* jika saldo habis 1–3 hari sebelum pemasukan berikutnya atau ada pemasukan yang terlambat; *Kritis* jika lebih dari 3 hari atau saldo sudah habis; selain itu *Aman*.

Semua tanggal memakai zona waktu **Asia/Jakarta (WIB)**, termasuk saat berjalan di server Vercel yang memakai UTC.

## Struktur folder

```
ForeCashWDD/
├─ src/
│  ├─ app/
│  │  ├─ page.tsx, Landing.tsx, landing.css   Landing page
│  │  ├─ login/, lupa-password/, reset-password/
│  │  ├─ auth/callback/                    Tujuan balik dari Google & link email
│  │  ├─ api/chatbot/, api/email/          API route
│  │  └─ (app)/                            Halaman setelah login (folder ini tidak muncul di URL)
│  │     ├─ layout.tsx                     Sidebar, header, tab bar HP, chatbot
│  │     └─ beranda/ transaksi/ wallet/ utang/ prediksi/ laporan/
│  │        petualangan/ pencapaian/ akun/ pantau/
│  │           ├─ page.tsx                 Tampilan halaman
│  │           ├─ actions.ts               Simpan/ubah/hapus data (Server Action)
│  │           └─ components/              Potongan tampilan khusus halaman itu
│  ├─ components/                          Komponen yang dipakai banyak halaman
│  ├─ lib/                                 Logika & akses data
│  │  ├─ forecast.ts  gamify.ts  laporan.ts  pets.ts  chatbot.ts  utang.ts  tanggal.ts
│  │  ├─ data.ts  auth.ts  struk.ts  email.ts
│  │  └─ supabase/                         Koneksi Supabase (browser, server, sesi)
│  └─ proxy.ts                             Mengarahkan ke /login jika belum login
├─ supabase/
│  ├─ migrations/                          Tabel, RLS, storage (jalankan berurutan)
│  └─ seed.sql                             Data demo
├─ tests/                                  Unit test (npm test)
├─ public/logo.svg
├─ php-version/                            Versi PHP + MySQL (cadangan)
└─ prototype-html/                         Versi HTML/CSS/JS awal
```

## Menjalankan di komputer sendiri

Butuh **Node.js 22 atau lebih baru** (cek dengan `node -v`).

```bash
npm install
cp .env.example .env.local      # Windows PowerShell: Copy-Item .env.example .env.local
# isi .env.local (lihat bagian Supabase di bawah)
npm run dev
```

Buka http://localhost:3000.

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Menjalankan website untuk pengembangan |
| `npm test` | Menjalankan unit test (forecast, gamifikasi, laporan, petualangan, chatbot, utang, tanggal) |
| `npm run build` | Mengecek apakah website bisa di-build untuk online |
| `npm run lint` | Mengecek penulisan code |

## Setup Supabase

1. Buat project di [supabase.com](https://supabase.com) (region Singapore).
2. **Isi `.env.local`:**
   - `NEXT_PUBLIC_SUPABASE_URL`: Project URL (`https://xxxx.supabase.co`), ada di tombol **Connect** atau **Project Settings → Data API**.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: key **anon public** di **Project Settings → API Keys** (tab Legacy) atau key **publishable**. Jangan pernah memakai key `service_role` / secret.
3. **Buat tabel:** buka **SQL Editor**, jalankan isi file berikut satu per satu secara berurutan:
   1. `supabase/migrations/20261113000001_schema.sql`: tabel, view saldo wallet, trigger akun baru
   2. `supabase/migrations/20261113000002_rls.sql`: Row Level Security
   3. `supabase/migrations/20261113000003_storage.sql`: bucket privat foto struk
   4. `supabase/migrations/20261113000004_email_kritis.sql`: email Kritis maks. sekali sehari
   5. `supabase/migrations/20261113000005_orangtua.sql`: daftar orang tua yang terhubung
4. **Pengaturan login** (menu **Authentication**):
   - **URL Configuration**: Site URL `http://localhost:3000`, Redirect URLs tambahkan `http://localhost:3000/**`.
   - **Sign In / Providers → Email**: matikan **Confirm email** agar akun baru bisa langsung dipakai saat demo (email bawaan Supabase dibatasi beberapa email per jam).
5. **Data demo (opsional):**
   1. **Authentication → Users → Add user**: buat `demo@forecash.id` dan `ortu@forecash.id`, kata sandi `demo12345`, centang **Auto Confirm User**.
   2. Jalankan `supabase/seed.sql` di SQL Editor. File ini aman dijalankan ulang; tanggal transaksi selalu dihitung mundur dari hari ini.

| Akun demo | Email | Kata sandi |
|---|---|---|
| Mahasiswa | demo@forecash.id | demo12345 |
| Orang tua | ortu@forecash.id | demo12345 |

### Login dengan Google (opsional)

1. Di [Google Cloud Console](https://console.cloud.google.com): **APIs & Services → Credentials → Create credentials → OAuth client ID** (tipe *Web application*).
2. **Authorized redirect URI**: `https://<kode-project>.supabase.co/auth/v1/callback`.
3. Salin **Client ID** dan **Client secret** ke Supabase: **Authentication → Sign In / Providers → Google**, lalu aktifkan.

Akun dari Google otomatis terdaftar sebagai mahasiswa.

### Email lewat Resend (opsional)

Isi `RESEND_API_KEY` di `.env.local`. Pengirim `onboarding@resend.dev` hanya bisa mengirim ke email pemilik akun Resend; untuk mengirim ke siapa saja, verifikasi domain di resend.com lalu ganti `RESEND_FROM_EMAIL`. Tanpa key ini aplikasi tetap berjalan, hanya emailnya yang dilewati.

## Deploy ke Vercel

1. Pastikan semua perubahan sudah di-push ke GitHub (`GerryEvans07/ForeCashWDD`, branch `main`).
2. Buka [vercel.com](https://vercel.com), login dengan GitHub, klik **Add New → Project**, pilih repo **ForeCashWDD**, lalu **Import**. Framework otomatis terdeteksi sebagai Next.js.
3. Di bagian **Environment Variables**, tambahkan (nilainya sama dengan `.env.local`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL`: isi alamat Vercel nanti, misalnya `https://forecash-wdd.vercel.app`
   - `RESEND_API_KEY` dan `RESEND_FROM_EMAIL` (opsional)
4. Klik **Deploy**. Setelah selesai, salin alamat website dari Vercel.
5. Kembali ke Supabase → **Authentication → URL Configuration**:
   - **Site URL**: ganti dengan alamat Vercel.
   - **Redirect URLs**: tambahkan `https://<alamat-vercel>/**` (yang `localhost` tetap disimpan supaya pengembangan lokal masih jalan).
6. Kalau `NEXT_PUBLIC_SITE_URL` di Vercel diubah, jalankan **Redeploy** dari tab Deployments.

Setiap `git push` ke `main` akan otomatis di-deploy ulang oleh Vercel.

## Keamanan

- **Rahasia** (key Supabase, key Resend) hanya ada di `.env.local` dan Environment Variables Vercel; `.env.local` tidak ikut ke GitHub (`.gitignore`).
- **Login** diurus Supabase Auth: kata sandi di-hash, sesi disimpan di cookie, link reset kata sandi sekali pakai.
- **Row Level Security** di setiap tabel: user hanya bisa membaca dan mengubah datanya sendiri. Orang tua yang terhubung hanya bisa *membaca* data anak. Aturan ini dijaga database, bukan hanya tampilan.
- **Foto struk** di bucket privat; tipe file dicek dari isi file (JPG/PNG/WEBP, maks. 2 MB), nama file acak, dan ditampilkan lewat link sementara 60 detik.
- **Validasi** semua isian dilakukan ulang di server (Server Action) sebelum disimpan.

## Kelompok 4

Audrey Imanuella Wijaya · Bulan Eka Pratiwi · Gerry Evans Makabonga · Justin Lee Reinhart · Lucky Chandra

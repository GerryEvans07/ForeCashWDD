# ForeCash

Website peringatan dini keuangan mahasiswa. Proyek IS556 Web Design and Development, Kelompok 4.

ForeCash menghitung rata-rata pengeluaran harian (burn rate), memperkirakan tanggal saldo habis, dan memberi peringatan sebelum pemasukan berikutnya datang. Orang tua dapat memantau ringkasan keuangan anak tanpa bisa mengubah datanya.

## Cara menjalankan

Tidak perlu instalasi. Buka `index.html` di browser, atau jalankan server lokal:

```
python -m http.server
```

Akun demo:

| Peran | Email | Password |
|---|---|---|
| Mahasiswa | demo@forecash.id | demo12345 |
| Orang tua | ortu@forecash.id | demo12345 |

Data disimpan di `localStorage` browser, jadi akun yang didaftarkan di satu perangkat tidak muncul di perangkat lain.

## Struktur folder

```
ForeCashWDD/
├─ index.html              Landing page
├─ pages/                  Satu file HTML per halaman
│  ├─ login.html           Login dan registrasi
│  ├─ dashboard.html       Banner peringatan, ringkasan, saldo per wallet
│  ├─ transaksi.html       CRUD transaksi, transfer, kategori, batas harian
│  ├─ wallet.html          Kelola wallet
│  ├─ utang.html           Utang, piutang, split bill
│  ├─ prediksi.html        Burn rate, grafik proyeksi, jadwal pemasukan
│  ├─ laporan.html         Laporan bulanan dan ekspor CSV
│  ├─ pencapaian.html      Streak, badge, level
│  ├─ akun.html            Profil, avatar, kode hubung orang tua
│  └─ ortu.html            Halaman Pantau Anak (peran orang tua)
└─ assets/
   ├─ css/                 styles.css (komponen), landing.css, landing-anim.css
   ├─ img/                 logo.svg
   └─ js/
      ├─ config/           tw-config.js (warna Tailwind)
      ├─ core/             utils.js, db.js, auth.js, data.js, router.js
      ├─ features/         forecast.js, avatar.js, gamify.js, chatbot.js
      ├─ ui/               layout.js (header, navigasi, footer, banner)
      └─ pages/            Satu file JS per halaman
```

## Cara kerja script

Setiap halaman memuat script dengan urutan tetap: `core` → `features` → `ui` → `router.js` → script halamannya sendiri. Script halaman mendaftarkan fungsinya ke objek `pages`, misalnya `pages.transaksi = function (user) { … }`. Setelah halaman selesai dimuat, `router.js` membaca atribut `<body data-page="…">`, memeriksa login dan peran, memasang header dan footer, lalu menjalankan fungsi halaman tersebut.

Untuk menambah halaman baru:

1. Buat `pages/nama.html` dengan `<body data-page="nama">` dan salin daftar `<script>` dari halaman lain.
2. Buat `assets/js/pages/nama.js` berisi `pages.nama = function (user) { … }`.
3. Tambahkan menunya di `assets/js/ui/layout.js` jika perlu.

## Logika peringatan dini

Ada di `assets/js/features/forecast.js`:

- **Burn rate** = total pengeluaran 14 hari terakhir ÷ 14 (minimal 3 hari untuk pengguna baru; transfer tidak dihitung).
- **Runway** = saldo ÷ burn rate, dibulatkan ke bawah. **Tanggal habis** = hari ini + runway.
- **Status**: Waspada jika saldo habis 1–3 hari sebelum pemasukan berikutnya atau ada pemasukan terlambat; Kritis jika lebih dari 3 hari atau saldo sudah habis.

## Teknologi

HTML5, Tailwind CSS (CDN), JavaScript tanpa framework, Chart.js, Font Awesome, Google Fonts (Fredoka, Plus Jakarta Sans).

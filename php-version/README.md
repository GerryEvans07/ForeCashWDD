# ForeCash

Website peringatan dini keuangan mahasiswa. Proyek IS556 Web Design and Development, Kelompok 4.

ForeCash menghitung rata-rata pengeluaran harian (burn rate), memperkirakan tanggal saldo habis, dan memberi peringatan sebelum pemasukan berikutnya datang. Orang tua dapat memantau ringkasan keuangan anak tanpa bisa mengubah datanya.

Tampilan dibuat dengan HTML, CSS (Tailwind), dan JavaScript. PHP dan MySQL dipakai untuk login dan menyimpan data, jadi akun dan transaksi bisa dibuka dari perangkat mana pun. Versi awal yang hanya HTML/CSS/JS disimpan di folder `prototype-html/`.

## Cara menjalankan (XAMPP)

1. Salin folder `ForeCashWDD` ke `C:\xampp\htdocs\`.
2. Buka XAMPP Control Panel, klik **Start** pada Apache dan MySQL.
3. Buka `http://localhost/phpmyadmin`, buat database baru bernama `forecash_db`.
4. Pilih database `forecash_db` → tab **Import** → pilih `database/schema.sql` → **Import**.
5. (Opsional) Import juga `database/demo_data.sql` untuk akun contoh.
6. Buka `http://localhost/ForeCashWDD/`.

Jika MySQL memakai password atau nama database lain, ubah di `config/database.php`.

### Mengaktifkan email Lupa Kata Sandi (opsional)

Salin `config/mail.example.php` menjadi `config/mail.php`, lalu pilih salah satu:

- **Resend** (`MAIL_DRIVER = 'resend'`): isi `RESEND_API_KEY` dari resend.com dan `RESEND_FROM` dengan alamat ber-domain yang sudah diverifikasi di Resend. Dikirim lewat HTTPS, jadi tidak terblokir jaringan kampus. Memerlukan ekstensi cURL PHP (aktif secara default di XAMPP).
- **Gmail** (`MAIL_DRIVER = 'gmail'`): isi `MAIL_USER` dan `MAIL_PASS` (App Password 16 huruf dari myaccount.google.com/apppasswords). Dikirim lewat SMTP dengan library PHPMailer (`includes/lib/PHPMailer`, lisensi LGPL 2.1).

`config/mail.php` tidak ikut ter-push ke GitHub (ada di `.gitignore`). Tanpa file ini, link reset ditampilkan di layar (mode demo).

## Struktur folder

```
ForeCashWDD/
├─ index.html                Landing page (HTML, CSS, animasi)
├─ config/
│  ├─ database.php           Koneksi MySQL, zona waktu, session
│  └─ mail.example.php       Contoh pengaturan email (salin jadi mail.php)
├─ includes/                 Logika yang dipakai banyak halaman
│  ├─ functions.php          Helper, query (prepared statement), CSRF, login, saldo wallet, forecast()
│  ├─ avatar.php             Avatar SVG dan ekspresinya
│  ├─ gamify.php             Streak, badge, poin, level, tantangan mingguan
│  ├─ report.php             Laporan bulanan dan grafik kategori
│  ├─ tx_form.php            Validasi dan form transaksi
│  ├─ upload.php             Upload foto struk
│  ├─ reset.php              Token lupa kata sandi
│  ├─ mailer.php             Kirim email lewat Resend API atau SMTP Gmail (PHPMailer)
│  ├─ lib/PHPMailer/         Library PHPMailer
│  ├─ pets.php               Katalog teman hemat (SVG), telur, logika menetas
│  ├─ journey.php            Peta Petualangan (jalan berliku, satu titik = satu hari)
│  └─ layout/                header.php, footer.php, warning.php (banner peringatan)
├─ pages/                    Satu file PHP per halaman
│  ├─ login.php, logout.php  Login, registrasi, keluar
│  ├─ lupa_password.php      Minta link reset kata sandi
│  ├─ reset_password.php     Buat kata sandi baru dari link reset
│  ├─ dashboard.php          Banner peringatan, ringkasan, gamifikasi, saldo per wallet
│  ├─ transaksi.php          CRUD transaksi, transfer, kategori, batas harian, foto struk
│  ├─ transaksi_edit.php     Ubah transaksi
│  ├─ struk.php              Menampilkan foto struk (cek pemilik)
│  ├─ wallet.php             Kelola wallet
│  ├─ utang.php              Utang, piutang, split bill
│  ├─ prediksi.php           Burn rate, grafik proyeksi, jadwal pemasukan
│  ├─ laporan.php, export.php Laporan bulanan dan ekspor CSV
│  ├─ petualangan.php        Peta perjalanan menuju uang saku, telur, koleksi teman hemat
│  ├─ pencapaian.php         Streak, badge, level
│  ├─ akun.php               Profil, avatar, kata sandi, kode hubung orang tua
│  └─ ortu.php               Pantau Anak (peran orang tua)
├─ api/
│  └─ chatbot.php            Jawaban ForeCash Assistant (JSON)
├─ assets/
│  ├─ css/                   styles.css, landing.css, landing-anim.css
│  ├─ img/                   logo.svg
│  └─ js/                    tw-config.js, app.js (konfirmasi nominal, pratinjau split bill), chatbot.js (tampilan chatbot)
├─ database/                 schema.sql, demo_data.sql, update_petualangan.sql
├─ uploads/struk/            Foto struk (dikunci .htaccess)
└─ prototype-html/           Versi awal HTML/CSS/JS tanpa database
```

## Keamanan

- **Kata sandi** disimpan dengan `password_hash()` (bcrypt) dan dicek dengan `password_verify()`.
- **Lupa kata sandi**: link reset berisi token acak 64 karakter, berlaku 30 menit dan hanya bisa dipakai sekali. Yang disimpan di tabel `password_resets` hanya hash SHA-256-nya. Pesan setelah meminta reset selalu sama, jadi orang lain tidak bisa mengecek email mana yang terdaftar. Email dikirim lewat Resend atau Gmail jika `config/mail.php` sudah diisi; jika belum, link ditampilkan di layar (mode demo).
- **Session**: ID session diganti saat login (`session_regenerate_id`), setiap halaman memeriksa login dan peran.
- **SQL injection**: semua query memakai prepared statement (`q()`, `rows()`, `row()`, `val()` di `functions.php`).
- **XSS**: semua data pengguna ditampilkan lewat `e()` (`htmlspecialchars`).
- **CSRF**: setiap form POST membawa token yang dicek di server.
- **Kepemilikan data**: setiap query transaksi, wallet, dan utang dibatasi `user_id` pengguna yang login. Orang tua hanya bisa melihat anak yang sudah terhubung lewat kode.

## Upload foto struk

- Format JPG, PNG, atau WEBP, maksimal 2 MB. Tipe dicek dari isi file (`finfo`), bukan dari ekstensi.
- Nama file diganti acak 32 karakter.
- Folder `uploads/struk` tidak bisa dibuka langsung dari browser (`.htaccess`). Gambar dikirim lewat `pages/struk.php` setelah dicek bahwa transaksinya milik pengguna yang login.
- File ikut terhapus saat transaksinya dihapus atau fotonya diganti.

## Petualangan

- **Peta**: jalan berliku dari pemasukan terakhir sampai pemasukan berikutnya. Hari yang sudah lewat ditandai koin (hari baik), merah (melewati batas harian), atau abu-abu (tidak mencatat). Hari ke depan ditandai cukup atau habis berdasarkan prediksi saldo. Tema peta ikut status: padang rumput (aman), musim gugur (waspada), musim dingin (kritis).
- **Telur**: menetas setelah 7 hari baik sejak hewan terakhir menetas. Hari baik = ada transaksi tercatat dan pengeluaran tidak melewati batas harian.
- **Koleksi**: 12 teman hemat. Satu bisa diajak jalan-jalan; ia muncul di peta dan di banner dashboard. Data disimpan di tabel `user_pets`.
- Jika database sudah dibuat sebelum fitur ini ada, import `database/update_petualangan.sql` sekali.

## Logika peringatan dini

Ada di fungsi `forecast()` dalam `includes/functions.php`:

- **Burn rate** = total pengeluaran 14 hari terakhir ÷ 14 (minimal 3 hari untuk pengguna baru; transfer tidak dihitung).
- **Runway** = saldo ÷ burn rate, dibulatkan ke bawah. **Tanggal habis** = hari ini + runway.
- **Status**: Waspada jika saldo habis 1–3 hari sebelum pemasukan berikutnya atau ada pemasukan terlambat; Kritis jika lebih dari 3 hari atau saldo sudah habis.
- **Batas aman** = saldo ÷ jumlah hari menuju pemasukan berikutnya.

## Teknologi

PHP 8, MySQL/MariaDB (mysqli), Tailwind CSS (CDN), JavaScript tanpa framework, Chart.js, Font Awesome, Google Fonts (Fredoka, Plus Jakarta Sans).

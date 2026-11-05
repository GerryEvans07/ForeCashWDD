# ForeCash — prototipe HTML

Versi awal ForeCash yang dibuat dengan HTML, CSS, dan JavaScript saja, tanpa server dan database. Disimpan sebagai prototipe; aplikasi utama ada di folder induk (PHP + MySQL).

## Cara membuka

Buka `index.html` di browser. Tidak perlu XAMPP.

Akun demo: `demo@forecash.id` / `demo12345` (mahasiswa), `ortu@forecash.id` / `demo12345` (orang tua).

Data disimpan di `localStorage` browser, jadi akun yang didaftarkan di satu perangkat tidak muncul di perangkat lain.

## Perbedaan dengan versi utama

| | Prototipe HTML | Versi utama |
|---|---|---|
| Penyimpanan data | localStorage browser | Database MySQL |
| Login | Dicek di JavaScript | Password hash, session, CSRF di server |
| Upload foto struk | Tidak ada | Ada |
| Perhitungan peringatan dini | `assets/js/features/forecast.js` | `forecast()` di `includes/functions.php` |

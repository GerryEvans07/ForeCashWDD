<?php
/* Upload foto struk/bukti transaksi.
   - tipe file dicek dari isi file (finfo), bukan dari nama/ekstensi kiriman browser
   - ukuran maksimal 2 MB
   - nama file diganti acak supaya tidak bisa ditebak atau menimpa file lain
   - folder uploads/struk dikunci .htaccess; file hanya bisa dibuka lewat pages/struk.php */

const STRUK_DIR = __DIR__ . '/../uploads/struk/';
const STRUK_MAX = 2 * 1024 * 1024;
const STRUK_TIPE = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];

// hasil: ['ok' => nama_file] | ['error' => pesan] | null (tidak ada file dipilih)
function simpan_struk($field = 'bukti') {
    $f = $_FILES[$field] ?? null;
    if (!$f || $f['error'] === UPLOAD_ERR_NO_FILE) return null;
    if ($f['error'] === UPLOAD_ERR_INI_SIZE || $f['error'] === UPLOAD_ERR_FORM_SIZE || $f['size'] > STRUK_MAX)
        return ['error' => 'Ukuran foto struk maksimal 2 MB.'];
    if ($f['error'] !== UPLOAD_ERR_OK || !is_uploaded_file($f['tmp_name']))
        return ['error' => 'Foto struk gagal diunggah. Coba lagi.'];

    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($f['tmp_name']);
    if (!isset(STRUK_TIPE[$mime])) return ['error' => 'Foto struk harus berformat JPG, PNG, atau WEBP.'];

    if (!is_dir(STRUK_DIR)) mkdir(STRUK_DIR, 0755, true);
    $nama = bin2hex(random_bytes(16)) . '.' . STRUK_TIPE[$mime];
    if (!move_uploaded_file($f['tmp_name'], STRUK_DIR . $nama)) return ['error' => 'Foto struk gagal disimpan.'];
    return ['ok' => $nama];
}

function hapus_struk($nama) {
    // basename() mencegah path seperti ../../config/database.php
    if ($nama && is_file(STRUK_DIR . basename($nama))) unlink(STRUK_DIR . basename($nama));
}

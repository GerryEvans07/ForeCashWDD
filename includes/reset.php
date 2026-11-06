<?php
/* Lupa kata sandi: token reset sekali pakai yang berlaku 30 menit.
   Yang disimpan di database hanya hash SHA-256 dari token, jadi walaupun tabelnya bocor,
   link reset tidak bisa dibuat ulang dari isi tabel. */

const RESET_MENIT = 30;

function pastikan_tabel_reset() {
    global $mysqli;
    $mysqli->query("CREATE TABLE IF NOT EXISTS password_resets (
        id         INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        user_id    INT NOT NULL,
        token_hash CHAR(64) NOT NULL,
        expires_at DATETIME NOT NULL,
        used       TINYINT(1) NOT NULL DEFAULT 0,
        UNIQUE KEY uq_token (token_hash),
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    ) ENGINE=InnoDB");
}

// membuat token baru untuk user; token lama yang belum dipakai dibatalkan
function buat_token_reset($uid) {
    pastikan_tabel_reset();
    q('UPDATE password_resets SET used = 1 WHERE user_id = ? AND used = 0', 'i', $uid);
    $token = bin2hex(random_bytes(32));
    q('INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ' . RESET_MENIT . ' MINUTE))',
      'is', $uid, hash('sha256', $token));
    return $token;
}

// mengembalikan baris reset yang masih berlaku, atau null
function cek_token_reset($token) {
    pastikan_tabel_reset();
    if (!preg_match('/^[a-f0-9]{64}$/', $token)) return null;
    return row('SELECT r.id, r.user_id, u.nama, u.email FROM password_resets r JOIN users u ON u.user_id = r.user_id
                WHERE r.token_hash = ? AND r.used = 0 AND r.expires_at > NOW()', 's', hash('sha256', $token));
}

// link lengkap ke halaman reset, mengikuti alamat yang sedang dibuka (localhost/ForeCashWDD/...)
function link_reset($token) {
    $https = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
    $dir = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/\\');
    return ($https ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'] . $dir . '/reset_password.php?token=' . $token;
}

<?php
// Menampilkan foto struk. File di uploads/struk tidak bisa dibuka langsung,
// jadi gambar dikirim lewat sini setelah dicek bahwa transaksinya milik pengguna yang login.
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/upload.php';
$user = require_login('mahasiswa');

$bukti = val('SELECT bukti FROM transactions WHERE transaction_id = ? AND user_id = ?', 'ii', (int)($_GET['id'] ?? 0), $user['user_id']);
$path = $bukti ? STRUK_DIR . basename($bukti) : null;
if (!$path || !is_file($path)) { http_response_code(404); exit('Foto struk tidak ditemukan.'); }

header('Content-Type: ' . (new finfo(FILEINFO_MIME_TYPE))->file($path));
header('Content-Length: ' . filesize($path));
header('X-Content-Type-Options: nosniff');
header('Cache-Control: private, max-age=3600');
readfile($path);

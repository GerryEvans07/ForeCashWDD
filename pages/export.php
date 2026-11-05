<?php
require_once __DIR__ . '/../includes/functions.php';
$user = require_login('mahasiswa');
$bulan = preg_match('/^\d{4}-\d{2}$/', $_GET['bulan'] ?? '') ? $_GET['bulan'] : date('Y-m');

$list = rows("SELECT t.tanggal, t.jenis, t.keterangan, COALESCE(c.nama,'-') AS kategori, w.nama AS wallet, COALESCE(w2.nama,'') AS ke_wallet, t.nominal
              FROM transactions t JOIN wallets w ON w.wallet_id = t.wallet_id
              LEFT JOIN wallets w2 ON w2.wallet_id = t.wallet_tujuan_id
              LEFT JOIN categories c ON c.category_id = t.category_id
              WHERE t.user_id = ? AND DATE_FORMAT(t.tanggal,'%Y-%m') = ? ORDER BY t.tanggal", 'is', $user['user_id'], $bulan);

header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename="forecash-' . $bulan . '.csv"');
$out = fopen('php://output', 'w');
fwrite($out, "\xEF\xBB\xBF"); // BOM agar Excel membaca UTF-8
fputcsv($out, ['Tanggal', 'Jenis', 'Keterangan', 'Kategori', 'Wallet', 'Ke Wallet', 'Nominal'], ';');
foreach ($list as $t) fputcsv($out, array_values($t), ';');
fclose($out);

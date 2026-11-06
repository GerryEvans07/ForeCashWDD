<?php
require_once __DIR__ . '/../config/database.php';

/* ---------- helper umum ---------- */
function e($s) { return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8'); }
function rupiah($n) { return 'Rp ' . number_format((float)$n, 0, ',', '.'); }
function tgl($d) {
    $bln = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    $t = strtotime($d);
    return date('j', $t) . ' ' . $bln[(int)date('n', $t)] . ' ' . date('Y', $t);
}
function redirect($url) { header('Location: ' . $url); exit; }
function flash($msg = null) {
    if ($msg !== null) { $_SESSION['flash'] = $msg; return null; }
    $m = $_SESSION['flash'] ?? null; unset($_SESSION['flash']); return $m;
}

/* ---------- query singkat (prepared statement) ---------- */
function q($sql, $types = '', ...$params) {
    global $mysqli;
    $st = $mysqli->prepare($sql);
    if ($types !== '') $st->bind_param($types, ...$params);
    $st->execute();
    return $st;
}
function rows($sql, $types = '', ...$p) { $r = q($sql, $types, ...$p)->get_result(); return $r ? $r->fetch_all(MYSQLI_ASSOC) : []; }
function row($sql, $types = '', ...$p) { $r = rows($sql, $types, ...$p); return $r[0] ?? null; }
function val($sql, $types = '', ...$p) { $r = row($sql, $types, ...$p); return $r ? array_values($r)[0] : null; }

/* ---------- CSRF: semua form POST wajib membawa token ---------- */
function csrf_token() {
    if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(16));
    return $_SESSION['csrf'];
}
function csrf_field() { return '<input type="hidden" name="csrf" value="' . csrf_token() . '">'; }
function check_csrf() {
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && !hash_equals(csrf_token(), $_POST['csrf'] ?? '')) {
        http_response_code(400); exit('Permintaan tidak valid. Muat ulang halaman.');
    }
}

/* ---------- autentikasi ---------- */
function current_user() {
    if (empty($_SESSION['user_id'])) return null;
    return row('SELECT user_id, nama, email, role, kode_hubung, batas_harian, avatar FROM users WHERE user_id = ?', 'i', $_SESSION['user_id']);
}
function require_login($role = null) {
    $u = current_user();
    if (!$u) redirect('login.php');
    if ($role && $u['role'] !== $role) redirect($u['role'] === 'orangtua' ? 'ortu.php' : 'dashboard.php');
    check_csrf();
    return $u;
}

/* ---------- data wallet & kategori ---------- */
function wallets_with_balance($uid) {
    // saldo = saldo awal + pemasukan - pengeluaran - transfer keluar + transfer masuk
    return rows("SELECT w.wallet_id, w.nama, w.tipe, w.saldo_awal,
        w.saldo_awal
        + COALESCE((SELECT SUM(nominal) FROM transactions t WHERE t.wallet_id = w.wallet_id AND t.jenis = 'pemasukan'), 0)
        - COALESCE((SELECT SUM(nominal) FROM transactions t WHERE t.wallet_id = w.wallet_id AND t.jenis IN ('pengeluaran','transfer')), 0)
        + COALESCE((SELECT SUM(nominal) FROM transactions t WHERE t.wallet_tujuan_id = w.wallet_id AND t.jenis = 'transfer'), 0) AS saldo
        FROM wallets w WHERE w.user_id = ? ORDER BY w.wallet_id", 'i', $uid);
}
function categories_for($uid) {
    return rows('SELECT category_id, nama, jenis, user_id FROM categories WHERE user_id IS NULL OR user_id = ? ORDER BY jenis, nama', 'i', $uid);
}
function owns_wallet($uid, $wid) { return (bool)val('SELECT COUNT(*) FROM wallets WHERE wallet_id = ? AND user_id = ?', 'ii', $wid, $uid); }

/* ---------- inti ForeCash: burn rate & peringatan dini ---------- */
function forecast($uid) {
    $saldo = array_sum(array_column(wallets_with_balance($uid), 'saldo'));

    // burn rate = rata-rata pengeluaran harian 14 hari terakhir (transfer tidak dihitung)
    $first = val("SELECT MIN(tanggal) FROM transactions WHERE user_id = ? AND jenis = 'pengeluaran'", 'i', $uid);
    $hari = 14;
    if ($first) {
        $sejak = date_diff(date_create($first), date_create('today'))->days + 1;
        $hari = max(3, min(14, $sejak));
    }
    $keluar = (float)val("SELECT COALESCE(SUM(nominal),0) FROM transactions WHERE user_id = ? AND jenis = 'pengeluaran'
                          AND tanggal > DATE_SUB(CURDATE(), INTERVAL ? DAY)", 'ii', $uid, $hari);
    $burn = $keluar / $hari;

    $runway = $burn > 0 ? (int)floor(max(0, $saldo) / $burn) : null;
    $habis  = $runway !== null ? date('Y-m-d', strtotime("+$runway day")) : null;

    $next = row("SELECT sumber, nominal, tanggal_perkiraan FROM income_schedules
                 WHERE user_id = ? AND status = 'menunggu' AND tanggal_perkiraan >= CURDATE()
                 ORDER BY tanggal_perkiraan LIMIT 1", 'i', $uid);
    $terlambat = rows("SELECT schedule_id, sumber, nominal, tanggal_perkiraan FROM income_schedules
                       WHERE user_id = ? AND status = 'menunggu' AND tanggal_perkiraan < CURDATE()
                       ORDER BY tanggal_perkiraan", 'i', $uid);

    $sisa_hari = $next ? date_diff(date_create('today'), date_create($next['tanggal_perkiraan']))->days : null;
    $batas_aman = ($next && $sisa_hari > 0) ? max(0, $saldo) / $sisa_hari : null;

    // status: aman / waspada (kurang 1-3 hari) / kritis (kurang > 3 hari atau saldo habis)
    $status = 'aman';
    if ($saldo <= 0) $status = 'kritis';
    elseif ($runway !== null && $sisa_hari !== null && $runway < $sisa_hari) {
        $status = ($sisa_hari - $runway > 3) ? 'kritis' : 'waspada';
    }
    if ($status === 'aman' && $terlambat) $status = 'waspada';

    return compact('saldo', 'burn', 'hari', 'runway', 'habis', 'next', 'sisa_hari', 'batas_aman', 'terlambat', 'status');
}

/* proyeksi saldo harian untuk grafik (maks. 30 hari) */
function projection($f, $days = 30) {
    $labels = []; $data = [];
    for ($i = 0; $i <= $days; $i++) {
        $labels[] = date('j/n', strtotime("+$i day"));
        $data[] = round(max(0, $f['saldo'] - $f['burn'] * $i));
    }
    return [$labels, $data];
}

/* emoji kategori untuk daftar transaksi */
function kategori_emoji($nama, $jenis = 'pengeluaran') {
    $map = ['Makan & Minum' => '🍜', 'Transportasi' => '🛵', 'Kos / Sewa' => '🏠', 'Kebutuhan Kuliah' => '📚',
            'Hiburan' => '🎬', 'Uang Saku' => '💰', 'Kerja Sampingan' => '💼', 'Beasiswa' => '🎓', 'Pelunasan Utang/Piutang' => '🤝'];
    return $map[$nama] ?? ($jenis === 'pemasukan' ? '💵' : '🧾');
}

/* ---------- respons JSON (dipakai api/) ---------- */
function json_out($data, $code = 200) {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data);
    exit;
}

require_once __DIR__ . '/avatar.php';
require_once __DIR__ . '/gamify.php';
require_once __DIR__ . '/pets.php';

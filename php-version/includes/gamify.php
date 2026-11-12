<?php
/* Gamifikasi: streak, badge, poin, level, tantangan mingguan.
   Semua dihitung dari data di database, tidak ada tabel tambahan. */

const LEVELS = [[0, 'Pemula'], [200, 'Hemat Muda'], [400, 'Pengatur Cerdas'], [600, 'Master Budget'], [800, 'Legenda ForeCash']];
const BATAS_TANTANGAN = 200000;

// berapa hari berturut-turut pengguna mencatat transaksi (boleh belum mencatat hari ini)
function hitung_streak($uid) {
    $hari = array_flip(array_column(rows('SELECT DISTINCT tanggal FROM transactions WHERE user_id = ?', 'i', $uid), 'tanggal'));
    $d = isset($hari[date('Y-m-d')]) ? strtotime('today') : strtotime('yesterday');
    $n = 0;
    while (isset($hari[date('Y-m-d', $d)])) { $n++; $d = strtotime('-1 day', $d); }
    return $n;
}

function gamify($user, $f = null) {
    $uid = $user['user_id'];
    $f = $f ?? forecast($uid);
    $streak = hitung_streak($uid);
    $jumlahTx = (int)val('SELECT COUNT(*) FROM transactions WHERE user_id = ?', 'i', $uid);

    // hari hemat: 7 hari terakhir yang pengeluarannya tidak melebihi batas harian
    $hariHemat = 0;
    if ($user['batas_harian'] > 0) {
        $perHari = [];
        foreach (rows("SELECT tanggal, SUM(nominal) AS total FROM transactions WHERE user_id = ? AND jenis = 'pengeluaran'
                       AND tanggal > DATE_SUB(CURDATE(), INTERVAL 7 DAY) GROUP BY tanggal", 'i', $uid) as $r) $perHari[$r['tanggal']] = (float)$r['total'];
        for ($i = 0; $i < 7; $i++) if (($perHari[date('Y-m-d', strtotime("-$i day"))] ?? 0) <= $user['batas_harian']) $hariHemat++;
    }
    $jumlahDebt   = (int)val('SELECT COUNT(*) FROM debts WHERE user_id = ?', 'i', $uid);
    $utangAktif   = (int)val("SELECT COUNT(*) FROM debts WHERE user_id = ? AND arah = 'utang' AND status = 'belum'", 'i', $uid);
    $piutangLunas = (int)val("SELECT COUNT(*) FROM debts WHERE user_id = ? AND arah = 'piutang' AND status = 'lunas'", 'i', $uid);
    $punyaJadwal  = (int)val('SELECT COUNT(*) FROM income_schedules WHERE user_id = ?', 'i', $uid);

    $badges = [
        ['📝', 'Pencatat Pemula', 'Catat 10 transaksi', min($jumlahTx, 10), 10],
        ['🔥', 'Rajin Mencatat', 'Streak mencatat 7 hari', min($streak, 7), 7],
        ['🐷', 'Hemat Seminggu', $user['batas_harian'] > 0 ? '7 hari terakhir di bawah batas harian' : 'Atur batas harian dulu di menu Transaksi', $hariHemat, 7],
        ['🤝', 'Bebas Utang', 'Tidak punya utang yang belum lunas', $jumlahDebt && !$utangAktif ? 1 : 0, 1],
        ['💸', 'Penagih Andal', 'Lunasi 3 piutang dari teman', min($piutangLunas, 3), 3],
        ['📅', 'Perencana', 'Tambahkan jadwal pemasukan', $punyaJadwal ? 1 : 0, 1],
        ['🛡️', 'Aman Terkendali', 'Status peringatan sedang Aman', $f['status'] === 'aman' ? 1 : 0, 1],
    ];
    $badges = array_map(fn($b) => ['icon' => $b[0], 'nama' => $b[1], 'ket' => $b[2], 'now' => $b[3], 'max' => $b[4], 'dapat' => $b[3] >= $b[4]], $badges);

    $poin = count(array_filter($badges, fn($b) => $b['dapat'])) * 100 + min($streak, 30) * 10;
    $li = 0;
    foreach (LEVELS as $i => [$min]) if ($poin >= $min) $li = $i;
    $next = LEVELS[$li + 1] ?? null;

    // tantangan mingguan: makan & minum Senin–Minggu di bawah Rp200.000
    $senin = date('Y-m-d', strtotime('monday this week'));
    $makan = (float)val("SELECT COALESCE(SUM(t.nominal),0) FROM transactions t JOIN categories c ON c.category_id = t.category_id
                         WHERE t.user_id = ? AND t.jenis = 'pengeluaran' AND t.tanggal >= ? AND c.nama = 'Makan & Minum'", 'is', $uid, $senin);

    return [
        'streak' => $streak, 'badges' => $badges, 'poin' => $poin,
        'level' => $li + 1, 'levelNama' => LEVELS[$li][1], 'prevPoin' => LEVELS[$li][0],
        'nextPoin' => $next[0] ?? null, 'nextNama' => $next[1] ?? null,
        'tantangan' => ['judul' => 'Makan & minum minggu ini di bawah ' . rupiah(BATAS_TANTANGAN), 'now' => $makan,
                        'max' => BATAS_TANTANGAN, 'sisaHari' => 7 - (int)date('N')],
    ];
}

function level_bar_html($g) {
    $pct = $g['nextPoin'] ? round(($g['poin'] - $g['prevPoin']) / ($g['nextPoin'] - $g['prevPoin']) * 100) : 100;
    $ket = $g['nextPoin'] ? ($g['nextPoin'] - $g['poin']) . ' poin lagi menuju ' . $g['nextNama'] : 'Level tertinggi tercapai!';
    return "<div class='flex justify-between text-xs font-bold'><span>Level {$g['level']} · {$g['levelNama']}</span><span>{$g['poin']} poin</span></div>
      <div class='w-full bg-slate-100 rounded-full h-3 mt-1'><div class='bg-hsPurple h-3 rounded-full' style='width:{$pct}%'></div></div>
      <p class='text-[10px] text-slate-500 mt-1'>$ket</p>";
}

function tantangan_html($t) {
    $pct = min(100, round($t['now'] / $t['max'] * 100));
    $lewat = $t['now'] > $t['max'];
    $ket = $lewat ? 'tantangan gagal minggu ini' : 'sisa ' . rupiah($t['max'] - $t['now']) . ", {$t['sisaHari']} hari lagi";
    return "<p class='text-sm font-bold'>" . e($t['judul']) . "</p>
      <div class='w-full bg-slate-100 rounded-full h-3 mt-2'><div class='" . ($lewat ? 'bg-hsRed' : 'bg-hsGreen') . " h-3 rounded-full' style='width:{$pct}%'></div></div>
      <p class='text-[11px] mt-1 " . ($lewat ? 'text-hsRed font-bold' : 'text-slate-500') . "'>" . rupiah($t['now']) . " terpakai · $ket</p>";
}

<?php
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/report.php';
$user = require_login('orangtua');
$pid = $user['user_id'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $aksi = $_POST['aksi'] ?? '';
    if ($aksi === 'hubung') {
        $kode = strtoupper(trim($_POST['kode'] ?? ''));
        $anak = row("SELECT user_id, nama FROM users WHERE kode_hubung = ? AND role = 'mahasiswa'", 's', $kode);
        if (!$anak) flash('!Kode tidak ditemukan. Minta kode terbaru di menu Akun milik mahasiswa.');
        else {
            q('INSERT IGNORE INTO parent_links (parent_id, student_id) VALUES (?, ?)', 'ii', $pid, $anak['user_id']);
            $_SESSION['anak'] = $anak['user_id'];
            flash('Terhubung dengan ' . $anak['nama'] . '.');
        }
    } elseif ($aksi === 'pilih') {
        $_SESSION['anak'] = (int)$_POST['id'];
    }
    redirect('ortu.php');
}

$anakList = rows('SELECT u.user_id, u.nama, u.avatar FROM parent_links l JOIN users u ON u.user_id = l.student_id WHERE l.parent_id = ? ORDER BY u.nama', 'i', $pid);
$ids = array_column($anakList, 'user_id');
$sid = in_array($_SESSION['anak'] ?? 0, $ids) ? $_SESSION['anak'] : ($ids[0] ?? null);   // hanya anak yang terhubung
$anak = null;
foreach ($anakList as $a) if ($a['user_id'] == $sid) $anak = $a;

if ($anak) {
    $f = forecast($sid);
    $avatarId = $anak['avatar'];   // banner memakai avatar anak, bukan avatar orang tua
    $r = report_data($sid, date('Y-m'));
    $recent = rows("SELECT t.tanggal, t.jenis, t.nominal, t.keterangan, c.nama AS kategori FROM transactions t
                    LEFT JOIN categories c ON c.category_id = t.category_id
                    WHERE t.user_id = ? AND t.jenis <> 'transfer' ORDER BY t.tanggal DESC, t.transaction_id DESC LIMIT 8", 'i', $sid);
}

$title = 'Pantau Keuangan Anak'; $active = 'ortu';
require __DIR__ . '/../includes/layout/header.php';
?>
<div class="flex flex-wrap justify-between items-end gap-4">
    <div>
        <p class="text-xs text-slate-500">Data hanya dapat dilihat. Perubahan dilakukan oleh mahasiswa sendiri.</p>
    </div>
    <div class="flex flex-wrap gap-2">
        <?php foreach ($anakList as $a): ?>
            <form method="post"><?= csrf_field() ?><input type="hidden" name="id" value="<?= $a['user_id'] ?>">
                <button name="aksi" value="pilih" class="nav-tab <?= $a['user_id'] == $sid ? 'active' : 'bg-white' ?> px-4 py-2 text-xs"><?= e($a['nama']) ?></button></form>
        <?php endforeach; ?>
    </div>
</div>

<form method="post" class="hs-card p-5 flex flex-wrap items-end gap-3">
    <?= csrf_field() ?>
    <div class="flex-1 min-w-[200px]"><label for="kode" class="text-xs font-bold">Hubungkan akun anak</label>
        <input id="kode" name="kode" required maxlength="8" placeholder="Masukkan kode 8 karakter dari akun anak" class="w-full px-3 py-2 text-sm border uppercase"></div>
    <button name="aksi" value="hubung" class="hs-btn bg-hsPurple text-white px-5 py-2.5 text-xs">Hubungkan</button>
</form>

<?php if (!$anak): ?>
    <p class="hs-card p-6 text-sm text-slate-500">Belum ada akun anak yang terhubung. Minta anak membuka menu <b>Akun</b> di ForeCash untuk melihat kode hubung.</p>
<?php else: ?>
    <?php require __DIR__ . '/../includes/layout/warning.php'; ?>
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="hs-card p-5"><p class="text-xs font-bold text-slate-500">Total Saldo</p><p class="text-xl font-black"><?= rupiah($f['saldo']) ?></p></div>
        <div class="hs-card p-5"><p class="text-xs font-bold text-slate-500">Burn Rate / Hari</p><p class="text-xl font-black"><?= rupiah($f['burn']) ?></p></div>
        <div class="hs-card p-5"><p class="text-xs font-bold text-slate-500">Pemasukan Bulan Ini</p><p class="text-xl font-black text-hsGreen"><?= rupiah($r['masuk']) ?></p></div>
        <div class="hs-card p-5"><p class="text-xs font-bold text-slate-500">Pengeluaran Bulan Ini</p><p class="text-xl font-black text-hsRed"><?= rupiah($r['keluar']) ?></p></div>
    </div>
    <?= report_html($r, 'chartOrtu') ?>
    <div class="hs-card p-5 space-y-2">
        <h4 class="text-sm font-black">Transaksi Terakhir</h4>
        <?php if (!$recent): ?><p class="text-xs text-slate-500">Belum ada transaksi.</p><?php endif; ?>
        <?php foreach ($recent as $t): ?>
            <div class="flex justify-between text-sm border-b last:border-0 py-2">
                <span><b><?= e($t['keterangan']) ?></b> <span class="text-xs text-slate-500">· <?= tgl($t['tanggal']) ?> · <?= e($t['kategori'] ?? '-') ?></span></span>
                <b class="<?= $t['jenis'] === 'pemasukan' ? 'text-hsGreen' : 'text-hsRed' ?>"><?= $t['jenis'] === 'pemasukan' ? '+' : '−' ?><?= rupiah($t['nominal']) ?></b>
            </div>
        <?php endforeach; ?>
    </div>
<?php endif; ?>
<?php require __DIR__ . '/../includes/layout/footer.php'; ?>

<?php
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/tx_form.php';
require_once __DIR__ . '/../includes/upload.php';
$user = require_login('mahasiswa');
$uid = $user['user_id'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $aksi = $_POST['aksi'] ?? '';
    if ($aksi === 'tambah') {
        $v = validate_tx($uid, $_POST);
        $up = is_string($v) ? null : simpan_struk('bukti');
        if (is_string($v)) flash('!' . $v);
        elseif (isset($up['error'])) flash('!' . $up['error']);
        else {
            q('INSERT INTO transactions (user_id, wallet_id, wallet_tujuan_id, category_id, jenis, nominal, keterangan, tanggal, bukti) VALUES (?,?,?,?,?,?,?,?,?)',
              'iiiisdsss', $uid, $v['wallet'], $v['tujuan'], $v['kat'], $v['jenis'], $v['nominal'], $v['ket'], $v['tanggal'], $up['ok'] ?? null);
            flash('Transaksi tersimpan.');
        }
    } elseif ($aksi === 'hapus') {
        $id = (int)$_POST['id'];
        hapus_struk(val('SELECT bukti FROM transactions WHERE transaction_id = ? AND user_id = ?', 'ii', $id, $uid));
        q('DELETE FROM transactions WHERE transaction_id = ? AND user_id = ?', 'ii', $id, $uid);
        flash('Transaksi dihapus.');
    } elseif ($aksi === 'kategori') {
        $nama = trim($_POST['nama'] ?? '');
        $jenis = ($_POST['jenis'] ?? '') === 'pemasukan' ? 'pemasukan' : 'pengeluaran';
        if ($nama === '') flash('!Nama kategori wajib diisi.');
        else { q('INSERT INTO categories (user_id, nama, jenis) VALUES (?,?,?)', 'iss', $uid, $nama, $jenis); flash('Kategori ditambahkan.'); }
    } elseif ($aksi === 'hapus_kategori') {
        q('DELETE FROM categories WHERE category_id = ? AND user_id = ?', 'ii', (int)$_POST['id'], $uid);
        flash('Kategori dihapus.');
    } elseif ($aksi === 'batas') {
        q('UPDATE users SET batas_harian = ? WHERE user_id = ?', 'di', max(0, (float)$_POST['batas_harian']), $uid);
        flash('Batas harian diperbarui.');
    }
    redirect('transaksi.php');
}

$bulan = preg_match('/^\d{4}-\d{2}$/', $_GET['bulan'] ?? '') ? $_GET['bulan'] : date('Y-m');
$list = rows("SELECT t.transaction_id, t.bukti, t.tanggal, t.jenis, t.nominal, t.keterangan, c.nama AS kategori, w.nama AS wallet, w2.nama AS wallet_tujuan
              FROM transactions t JOIN wallets w ON w.wallet_id = t.wallet_id
              LEFT JOIN wallets w2 ON w2.wallet_id = t.wallet_tujuan_id
              LEFT JOIN categories c ON c.category_id = t.category_id
              WHERE t.user_id = ? AND DATE_FORMAT(t.tanggal, '%Y-%m') = ?
              ORDER BY t.tanggal DESC, t.transaction_id DESC", 'is', $uid, $bulan);
$hariIni = (float)val("SELECT COALESCE(SUM(nominal),0) FROM transactions WHERE user_id = ? AND jenis = 'pengeluaran' AND tanggal = CURDATE()", 'i', $uid);
$kategoriSaya = rows('SELECT category_id, nama, jenis FROM categories WHERE user_id = ? ORDER BY nama', 'i', $uid);

$title = 'Transaksi'; $active = 'transaksi';
require __DIR__ . '/../includes/layout/header.php';
?>
<div>
    <h3 class="text-xl font-black">Transaksi & Anggaran</h3>
    <p class="text-xs text-slate-500">Catat pemasukan, pengeluaran, dan transfer antar wallet.</p>
</div>

<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div class="lg:col-span-2 space-y-6">
        <form id="form" method="post" enctype="multipart/form-data" class="hs-card p-5 space-y-3">
            <?= csrf_field() ?>
            <h4 class="text-sm font-black">Catat Transaksi</h4>
            <?= tx_form_fields($uid) ?>
            <button name="aksi" value="tambah" class="hs-btn bg-hsOrange text-white w-full py-3 text-sm">Simpan Transaksi</button>
        </form>

        <div class="hs-card p-5 space-y-3">
            <div class="flex flex-wrap justify-between items-center gap-2">
                <h4 class="text-sm font-black">Riwayat Transaksi</h4>
                <form method="get"><input type="month" name="bulan" value="<?= e($bulan) ?>" onchange="this.form.submit()" class="px-3 py-1.5 text-xs border"></form>
            </div>
            <?php if (!$list): ?><p class="text-xs text-slate-500">Belum ada transaksi di bulan ini.</p><?php endif; ?>
            <?php foreach ($list as $t): ?>
                <div class="flex justify-between items-center gap-3 border-b last:border-0 py-2">
                    <div class="text-sm min-w-0">
                        <p class="font-bold truncate"><?= e($t['keterangan']) ?></p>
                        <p class="text-xs text-slate-500"><?= tgl($t['tanggal']) ?> ·
                            <?= $t['jenis'] === 'transfer' ? e($t['wallet']) . ' → ' . e($t['wallet_tujuan']) : e($t['kategori'] ?? '-') . ' · ' . e($t['wallet']) ?></p>
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                        <p class="text-sm font-black <?= ['pemasukan' => 'text-hsGreen', 'pengeluaran' => 'text-hsRed', 'transfer' => 'text-hsBlue'][$t['jenis']] ?>">
                            <?= ['pemasukan' => '+', 'pengeluaran' => '−', 'transfer' => '⇄ '][$t['jenis']] ?><?= rupiah($t['nominal']) ?></p>
                        <?php if ($t['bukti']): ?>
                            <a href="struk.php?id=<?= $t['transaction_id'] ?>" target="_blank" class="w-8 h-8 rounded-full bg-amber-50 text-amber-600 text-xs flex items-center justify-center" title="Lihat foto struk"><i class="fa-solid fa-receipt"></i></a>
                        <?php endif; ?>
                        <form method="post" action="transaksi_edit.php"><?= csrf_field() ?><input type="hidden" name="id" value="<?= $t['transaction_id'] ?>">
                            <button class="w-8 h-8 rounded-full bg-slate-100 text-xs" title="Ubah"><i class="fa-solid fa-pen"></i></button></form>
                        <form method="post" onsubmit="return confirm('Hapus transaksi ini?')"><?= csrf_field() ?><input type="hidden" name="id" value="<?= $t['transaction_id'] ?>">
                            <button name="aksi" value="hapus" class="w-8 h-8 rounded-full bg-red-50 text-hsRed text-xs" title="Hapus"><i class="fa-solid fa-trash"></i></button></form>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>
    </div>

    <div class="space-y-6">
        <form method="post" class="hs-card p-5 space-y-2">
            <?= csrf_field() ?>
            <h4 class="text-sm font-black">Batas Pengeluaran Harian</h4>
            <input type="number" name="batas_harian" min="0" value="<?= (float)$user['batas_harian'] ?>" class="w-full px-3 py-2 text-xs border">
            <button name="aksi" value="batas" class="hs-btn bg-slate-800 text-white w-full py-2 text-xs">Simpan</button>
            <?php if ($user['batas_harian'] > 0): ?>
                <p class="text-[11px] font-bold <?= $hariIni > $user['batas_harian'] ? 'text-hsRed' : 'text-hsGreen' ?>">
                    Hari ini: <?= rupiah($hariIni) ?> dari <?= rupiah($user['batas_harian']) ?>
                    <?= $hariIni > $user['batas_harian'] ? '— melebihi batas!' : '— masih aman.' ?></p>
            <?php endif; ?>
        </form>

        <div class="hs-card p-5 space-y-3">
            <h4 class="text-sm font-black"><i class="fa-solid fa-tags text-hsOrange"></i> Kategori Saya</h4>
            <form method="post" class="space-y-2">
                <?= csrf_field() ?>
                <input name="nama" placeholder="Mis. Print/Fotokopi" class="w-full px-3 py-2 text-xs border">
                <div class="flex gap-2">
                    <select name="jenis" class="w-full px-3 py-2 text-xs border"><option value="pengeluaran">Pengeluaran</option><option value="pemasukan">Pemasukan</option></select>
                    <button name="aksi" value="kategori" class="hs-btn bg-hsOrange text-white px-3 py-2 text-xs">Tambah</button>
                </div>
            </form>
            <div class="flex flex-wrap gap-1.5">
                <?php foreach ($kategoriSaya as $c): ?>
                    <form method="post" class="inline-flex items-center gap-1 bg-slate-100 rounded-full pl-3 pr-1 py-1 text-[11px] font-bold">
                        <?= csrf_field() ?><input type="hidden" name="id" value="<?= $c['category_id'] ?>">
                        <?= e($c['nama']) ?>
                        <button name="aksi" value="hapus_kategori" class="w-5 h-5 rounded-full hover:bg-white" title="Hapus">×</button>
                    </form>
                <?php endforeach; ?>
                <?php if (!$kategoriSaya): ?><p class="text-xs text-slate-500">Kategori bawaan sudah tersedia. Tambahkan kategori khusus di sini.</p><?php endif; ?>
            </div>
        </div>
    </div>
</div>
<?php require __DIR__ . '/../includes/layout/footer.php'; ?>

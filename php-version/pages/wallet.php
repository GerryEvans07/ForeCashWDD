<?php
require_once __DIR__ . '/../includes/functions.php';
$user = require_login('mahasiswa');
$uid = $user['user_id'];
$tipeValid = ['tunai', 'bank', 'ewallet'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $aksi = $_POST['aksi'] ?? '';
    $nama = trim($_POST['nama'] ?? '');
    $tipe = in_array($_POST['tipe'] ?? '', $tipeValid) ? $_POST['tipe'] : 'tunai';
    $saldo = max(0, (float)($_POST['saldo_awal'] ?? 0));
    $wid = (int)($_POST['id'] ?? 0);

    if ($aksi === 'tambah') {
        if ($nama === '') flash('!Nama wallet wajib diisi.');
        else { q('INSERT INTO wallets (user_id, nama, tipe, saldo_awal) VALUES (?,?,?,?)', 'issd', $uid, $nama, $tipe, $saldo); flash('Wallet ditambahkan.'); }
    } elseif ($aksi === 'ubah' && owns_wallet($uid, $wid)) {
        if ($nama === '') flash('!Nama wallet wajib diisi.');
        else { q('UPDATE wallets SET nama = ?, tipe = ?, saldo_awal = ? WHERE wallet_id = ? AND user_id = ?', 'ssdii', $nama, $tipe, $saldo, $wid, $uid); flash('Wallet diperbarui.'); }
    } elseif ($aksi === 'hapus' && owns_wallet($uid, $wid)) {
        $jumlahWallet = val('SELECT COUNT(*) FROM wallets WHERE user_id = ?', 'i', $uid);
        $dipakai = val('SELECT COUNT(*) FROM transactions WHERE wallet_id = ? OR wallet_tujuan_id = ?', 'ii', $wid, $wid);
        if ($jumlahWallet <= 1) flash('!Minimal harus ada satu wallet.');
        elseif ($dipakai) flash('!Wallet masih dipakai di transaksi, tidak dapat dihapus.');
        else { q('DELETE FROM wallets WHERE wallet_id = ? AND user_id = ?', 'ii', $wid, $uid); flash('Wallet dihapus.'); }
    }
    redirect('wallet.php');
}

$wallets = wallets_with_balance($uid);
$title = 'Kelola Wallet'; $active = 'dashboard';
require __DIR__ . '/../includes/layout/header.php';
$labelTipe = ['tunai' => 'Tunai', 'bank' => 'Bank', 'ewallet' => 'E-Wallet'];
?>
<div>
    <p class="text-xs text-slate-500"><a href="dashboard.php" class="font-bold">Dashboard</a> › Kelola Wallet</p>
    <p class="text-xs text-slate-500">Pisahkan saldo tunai, bank, dan e-wallet. Pindah saldo antar wallet dicatat lewat menu Transaksi → Transfer.</p>
</div>

<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div class="lg:col-span-2 hs-card p-5 space-y-3">
        <?php foreach ($wallets as $w): ?>
            <form method="post" class="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end border-b last:border-0 pb-3">
                <?= csrf_field() ?><input type="hidden" name="id" value="<?= $w['wallet_id'] ?>">
                <div class="sm:col-span-4"><label class="text-[11px] font-bold">Nama</label><input name="nama" value="<?= e($w['nama']) ?>" required class="w-full px-3 py-2 text-xs border"></div>
                <div class="sm:col-span-3"><label class="text-[11px] font-bold">Tipe</label>
                    <select name="tipe" class="w-full px-3 py-2 text-xs border"><?php foreach ($labelTipe as $k => $l): ?><option value="<?= $k ?>" <?= $w['tipe'] === $k ? 'selected' : '' ?>><?= $l ?></option><?php endforeach; ?></select></div>
                <div class="sm:col-span-3"><label class="text-[11px] font-bold">Saldo awal</label><input type="number" name="saldo_awal" min="0" value="<?= (float)$w['saldo_awal'] ?>" class="w-full px-3 py-2 text-xs border"></div>
                <div class="sm:col-span-2 flex gap-1">
                    <button name="aksi" value="ubah" class="hs-btn bg-hsBlue text-white px-3 py-2 text-xs" title="Simpan"><i class="fa-solid fa-floppy-disk"></i></button>
                    <button name="aksi" value="hapus" onclick="return confirm('Hapus wallet ini?')" class="hs-btn bg-hsRed text-white px-3 py-2 text-xs" title="Hapus"><i class="fa-solid fa-trash"></i></button>
                </div>
                <p class="sm:col-span-12 text-xs text-slate-500">Saldo saat ini: <strong><?= rupiah($w['saldo']) ?></strong></p>
            </form>
        <?php endforeach; ?>
    </div>

    <form method="post" class="hs-card p-5 space-y-3 h-fit">
        <?= csrf_field() ?>
        <h4 class="text-sm font-black">Tambah Wallet</h4>
        <div><label for="wn" class="text-xs font-bold">Nama</label><input id="wn" name="nama" required placeholder="BCA, GoPay, Tunai" class="w-full px-3 py-2 text-xs border"></div>
        <div><label for="wt" class="text-xs font-bold">Tipe</label>
            <select id="wt" name="tipe" class="w-full px-3 py-2 text-xs border"><?php foreach ($labelTipe as $k => $l): ?><option value="<?= $k ?>"><?= $l ?></option><?php endforeach; ?></select></div>
        <div><label for="ws" class="text-xs font-bold">Saldo awal (Rp)</label><input id="ws" type="number" name="saldo_awal" min="0" value="0" class="w-full px-3 py-2 text-xs border"></div>
        <button name="aksi" value="tambah" class="hs-btn bg-hsOrange text-white w-full py-2.5 text-xs">Simpan Wallet</button>
    </form>
</div>
<?php require __DIR__ . '/../includes/layout/footer.php'; ?>

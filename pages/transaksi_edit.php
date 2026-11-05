<?php
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/tx_form.php';
require_once __DIR__ . '/../includes/upload.php';
$user = require_login('mahasiswa');
$uid = $user['user_id'];

// ID transaksi hanya dikirim lewat POST (tidak tampil di URL) dan selalu dicek kepemilikannya
$id = (int)($_POST['id'] ?? 0);
$t = row('SELECT * FROM transactions WHERE transaction_id = ? AND user_id = ?', 'ii', $id, $uid);
if (!$t) { flash('!Transaksi tidak ditemukan.'); redirect('transaksi.php'); }

$error = '';
if (($_POST['aksi'] ?? '') === 'simpan') {
    $v = validate_tx($uid, $_POST);
    $up = is_string($v) ? null : simpan_struk('bukti');
    if (isset($up['error'])) $v = $up['error'];
    if (is_string($v)) { $error = $v; $t = array_merge($t, $_POST); }
    else {
        // foto baru menggantikan foto lama; centang "hapus" menghapus foto tanpa pengganti
        $bukti = $t['bukti'];
        if (isset($up['ok']) || !empty($_POST['hapus_bukti'])) { hapus_struk($bukti); $bukti = $up['ok'] ?? null; }
        q('UPDATE transactions SET wallet_id = ?, wallet_tujuan_id = ?, category_id = ?, jenis = ?, nominal = ?, keterangan = ?, tanggal = ?, bukti = ?
           WHERE transaction_id = ? AND user_id = ?',
          'iiisdsssii', $v['wallet'], $v['tujuan'], $v['kat'], $v['jenis'], $v['nominal'], $v['ket'], $v['tanggal'], $bukti, $id, $uid);
        flash('Transaksi diperbarui.');
        redirect('transaksi.php');
    }
}

$title = 'Ubah Transaksi'; $active = 'transaksi';
require __DIR__ . '/../includes/layout/header.php';
?>
<p class="text-xs text-slate-500"><a href="transaksi.php" class="font-bold">Transaksi</a> › Ubah</p>
<form method="post" enctype="multipart/form-data" class="hs-card p-5 space-y-3 max-w-2xl">
    <?= csrf_field() ?><input type="hidden" name="id" value="<?= $id ?>">
    <h3 class="text-lg font-black">Ubah Transaksi</h3>
    <?php if ($error): ?><p class="text-sm font-bold text-hsRed"><?= e($error) ?></p><?php endif; ?>
    <?= tx_form_fields($uid, $t) ?>
    <div class="flex gap-2">
        <a href="transaksi.php" class="hs-btn bg-slate-200 px-4 py-3 text-sm">Batal</a>
        <button name="aksi" value="simpan" class="hs-btn bg-hsBlue text-white flex-1 py-3 text-sm">Simpan Perubahan</button>
    </div>
</form>
<?php require __DIR__ . '/../includes/layout/footer.php'; ?>

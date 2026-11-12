<?php
/* Validasi & form transaksi — dipakai transaksi.php (tambah) dan transaksi_edit.php (ubah) */

function validate_tx($uid, $p) {
    $jenis = in_array($p['jenis'] ?? '', ['pemasukan', 'pengeluaran', 'transfer']) ? $p['jenis'] : null;
    $nominal = (float)($p['nominal'] ?? 0);
    $ket = trim($p['keterangan'] ?? '');
    $tanggal = $p['tanggal'] ?? '';
    $wallet = (int)($p['wallet_id'] ?? 0);
    $tujuan = (int)($p['wallet_tujuan_id'] ?? 0);
    $kat = (int)($p['category_id'] ?? 0);

    if (!$jenis) return 'Jenis transaksi tidak valid.';
    if ($nominal <= 0) return 'Nominal harus lebih dari 0.';
    if (!DateTime::createFromFormat('Y-m-d', $tanggal)) return 'Tanggal tidak valid.';
    if ($tanggal > date('Y-m-d')) return 'Tanggal tidak boleh melebihi hari ini.';
    if (!owns_wallet($uid, $wallet)) return 'Wallet tidak valid.';

    if ($jenis === 'transfer') {
        if (!owns_wallet($uid, $tujuan)) return 'Pilih wallet tujuan.';
        if ($tujuan === $wallet) return 'Wallet asal dan tujuan tidak boleh sama.';
        $kat = null;
        if ($ket === '') $ket = 'Transfer antar wallet';
    } else {
        $tujuan = null;
        $ok = val('SELECT COUNT(*) FROM categories WHERE category_id = ? AND jenis = ? AND (user_id IS NULL OR user_id = ?)', 'isi', $kat, $jenis, $uid);
        if (!$ok) return 'Pilih kategori yang sesuai.';
        if ($ket === '') return 'Keterangan wajib diisi.';
    }
    return compact('jenis', 'nominal', 'ket', 'tanggal', 'wallet', 'tujuan', 'kat');
}

function tx_form_fields($uid, $t = null) {
    $wallets = wallets_with_balance($uid);
    $cats = categories_for($uid);
    $jenis = $t['jenis'] ?? 'pengeluaran';
    ob_start(); ?>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div><label for="jenis" class="text-xs font-bold">Jenis</label>
            <select id="jenis" name="jenis" class="w-full px-3 py-2.5 text-sm border">
                <option value="pengeluaran" <?= $jenis === 'pengeluaran' ? 'selected' : '' ?>>Pengeluaran</option>
                <option value="pemasukan" <?= $jenis === 'pemasukan' ? 'selected' : '' ?>>Pemasukan</option>
                <option value="transfer" <?= $jenis === 'transfer' ? 'selected' : '' ?>>Transfer antar wallet</option>
            </select></div>
        <div><label for="nominal" class="text-xs font-bold">Nominal (Rp)</label>
            <input id="nominal" type="number" name="nominal" min="1" step="1" required value="<?= e(isset($t['nominal']) ? (float)$t['nominal'] : '') ?>" placeholder="25000" class="w-full px-3 py-2.5 text-sm border"></div>
    </div>
    <div><label for="keterangan" class="text-xs font-bold">Keterangan</label>
        <input id="keterangan" name="keterangan" maxlength="150" value="<?= e($t['keterangan'] ?? '') ?>" placeholder="Contoh: Makan siang kantin" class="w-full px-3 py-2.5 text-sm border"></div>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div id="boxKategori"><label for="category_id" class="text-xs font-bold">Kategori</label>
            <select id="category_id" name="category_id" class="w-full px-3 py-2.5 text-sm border">
                <?php foreach ($cats as $c): ?>
                    <option value="<?= $c['category_id'] ?>" data-jenis="<?= $c['jenis'] ?>" <?= ($t['category_id'] ?? 0) == $c['category_id'] ? 'selected' : '' ?>><?= e($c['nama']) ?></option>
                <?php endforeach; ?>
            </select></div>
        <div><label for="tanggal" class="text-xs font-bold">Tanggal</label>
            <input id="tanggal" type="date" name="tanggal" required max="<?= date('Y-m-d') ?>" value="<?= e($t['tanggal'] ?? date('Y-m-d')) ?>" class="w-full px-3 py-2.5 text-sm border"></div>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div><label for="wallet_id" class="text-xs font-bold"><span id="lblWallet">Wallet</span> <span class="font-normal text-slate-400">(opsional)</span></label>
            <select id="wallet_id" name="wallet_id" class="w-full px-3 py-2.5 text-sm border">
                <?php foreach ($wallets as $w): ?><option value="<?= $w['wallet_id'] ?>" <?= ($t['wallet_id'] ?? 0) == $w['wallet_id'] ? 'selected' : '' ?>><?= e($w['nama']) ?> (<?= rupiah($w['saldo']) ?>)</option><?php endforeach; ?>
            </select></div>
        <div id="boxTujuan" class="hidden"><label for="wallet_tujuan_id" class="text-xs font-bold">Ke wallet</label>
            <select id="wallet_tujuan_id" name="wallet_tujuan_id" class="w-full px-3 py-2.5 text-sm border">
                <?php foreach ($wallets as $w): ?><option value="<?= $w['wallet_id'] ?>" <?= ($t['wallet_tujuan_id'] ?? 0) == $w['wallet_id'] ? 'selected' : '' ?>><?= e($w['nama']) ?></option><?php endforeach; ?>
            </select>
            <p class="text-[10px] text-slate-500 mt-1">Transfer tidak dihitung sebagai pemasukan/pengeluaran.</p></div>
    </div>
    <div>
        <label for="bukti" class="text-xs font-bold">Foto struk <span class="font-normal text-slate-400">(opsional · JPG/PNG/WEBP, maks. 2 MB)</span></label>
        <input id="bukti" type="file" name="bukti" accept="image/jpeg,image/png,image/webp" class="w-full px-3 py-2 text-xs border bg-white">
        <?php if (!empty($t['bukti']) && !empty($t['transaction_id'])): ?>
            <div class="flex items-center gap-3 mt-2">
                <a href="struk.php?id=<?= (int)$t['transaction_id'] ?>" target="_blank"><img src="struk.php?id=<?= (int)$t['transaction_id'] ?>" alt="Struk tersimpan" class="w-16 h-16 object-cover rounded-xl border"></a>
                <label class="flex items-center gap-2 text-xs font-bold text-hsRed"><input type="checkbox" name="hapus_bukti" value="1"> Hapus foto ini</label>
            </div>
        <?php endif; ?>
    </div>
    <script>
    // Tampilkan kategori sesuai jenis; sembunyikan kategori & tampilkan wallet tujuan saat transfer
    (function () {
        const jenis = document.getElementById('jenis'), kat = document.getElementById('category_id');
        function sync() {
            const j = jenis.value, transfer = j === 'transfer';
            document.getElementById('boxKategori').classList.toggle('hidden', transfer);
            document.getElementById('boxTujuan').classList.toggle('hidden', !transfer);
            document.getElementById('lblWallet').textContent = transfer ? 'Dari wallet' : 'Wallet';
            let firstVisible = null;
            [...kat.options].forEach(o => { o.hidden = o.dataset.jenis !== j; if (!o.hidden && !firstVisible) firstVisible = o; });
            if (kat.selectedOptions[0] && kat.selectedOptions[0].hidden && firstVisible) firstVisible.selected = true;
        }
        jenis.addEventListener('change', sync); sync();
    })();
    </script>
    <?php return ob_get_clean();
}

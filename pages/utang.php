<?php
require_once __DIR__ . '/../includes/functions.php';
$user = require_login('mahasiswa');
$uid = $user['user_id'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $aksi = $_POST['aksi'] ?? '';
    $tempo = DateTime::createFromFormat('Y-m-d', $_POST['jatuh_tempo'] ?? '') ? $_POST['jatuh_tempo'] : null;

    if ($aksi === 'catat') {
        $nama = trim($_POST['nama_teman'] ?? ''); $ket = trim($_POST['keterangan'] ?? '');
        $nom = (float)($_POST['nominal'] ?? 0); $arah = ($_POST['arah'] ?? '') === 'utang' ? 'utang' : 'piutang';
        if ($nama === '' || $ket === '' || $nom <= 0) flash('!Nama teman, keterangan, dan nominal wajib diisi.');
        else { q('INSERT INTO debts (user_id, nama_teman, keterangan, nominal, arah, jatuh_tempo) VALUES (?,?,?,?,?,?)', 'issdss', $uid, $nama, $ket, $nom, $arah, $tempo); flash('Catatan disimpan.'); }

    } elseif ($aksi === 'split') {
        $total = (float)($_POST['total'] ?? 0); $judul = trim($_POST['judul'] ?? '') ?: 'Split bill';
        $teman = array_values(array_filter(array_map('trim', explode(',', $_POST['teman'] ?? ''))));
        $ikut = !empty($_POST['termasuk_saya']);
        if ($total <= 0 || !$teman) flash('!Isi total tagihan dan minimal satu nama teman.');
        else {
            $per = round($total / (count($teman) + ($ikut ? 1 : 0)));
            foreach ($teman as $n) q("INSERT INTO debts (user_id, nama_teman, keterangan, nominal, arah, jatuh_tempo) VALUES (?,?,?,?, 'piutang', ?)", 'issds', $uid, $n, $judul, $per, $tempo);
            flash('Split bill dibuat: ' . rupiah($per) . ' per orang, ' . count($teman) . ' piutang tercatat.');
        }

    } elseif ($aksi === 'lunas') {
        $d = row("SELECT * FROM debts WHERE debt_id = ? AND user_id = ? AND status = 'belum'", 'ii', (int)$_POST['id'], $uid);
        $wid = (int)($_POST['wallet_id'] ?? 0);
        if ($d && owns_wallet($uid, $wid)) {
            // pelunasan piutang = uang masuk; pelunasan utang = uang keluar
            $jenis = $d['arah'] === 'piutang' ? 'pemasukan' : 'pengeluaran';
            $kat = val("SELECT category_id FROM categories WHERE user_id IS NULL AND nama = 'Pelunasan Utang/Piutang' AND jenis = ?", 's', $jenis);
            q('INSERT INTO transactions (user_id, wallet_id, category_id, jenis, nominal, keterangan, tanggal) VALUES (?,?,?,?,?,?,CURDATE())',
              'iiisds', $uid, $wid, $kat, $jenis, $d['nominal'], 'Pelunasan: ' . $d['nama_teman'] . ' - ' . $d['keterangan']);
            q("UPDATE debts SET status = 'lunas' WHERE debt_id = ?", 'i', $d['debt_id']);
            flash('Ditandai lunas dan dicatat sebagai ' . $jenis . '.');
        }
    } elseif ($aksi === 'hapus') {
        q('DELETE FROM debts WHERE debt_id = ? AND user_id = ?', 'ii', (int)$_POST['id'], $uid);
        flash('Catatan dihapus.');
    }
    redirect('utang.php');
}

$belum = rows("SELECT * FROM debts WHERE user_id = ? AND status = 'belum' ORDER BY jatuh_tempo IS NULL, jatuh_tempo, created_at DESC", 'i', $uid);
$lunas = rows("SELECT * FROM debts WHERE user_id = ? AND status = 'lunas' ORDER BY created_at DESC LIMIT 10", 'i', $uid);
$wallets = wallets_with_balance($uid);

$title = 'Utang & Patungan'; $active = 'utang';
require __DIR__ . '/../includes/layout/header.php';
?>
<div>
    <p class="text-xs text-slate-500">Catat utang-piutang antarteman dan bagi tagihan bersama.</p>
</div>

<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div class="lg:col-span-2 space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <?php if (!$belum): ?><p class="hs-card p-5 text-xs text-slate-500 sm:col-span-2">Tidak ada utang atau piutang yang belum lunas.</p><?php endif; ?>
            <?php foreach ($belum as $d):
                $telat = $d['jatuh_tempo'] && $d['jatuh_tempo'] < date('Y-m-d');
                $pesan = rawurlencode("Halo {$d['nama_teman']}, sekadar mengingatkan untuk {$d['keterangan']} sebesar " . rupiah($d['nominal']) . ". Terima kasih!"); ?>
                <div class="hs-card p-5 space-y-3 <?= $telat ? 'border-red-300' : '' ?>">
                    <div class="flex justify-between items-start">
                        <div>
                            <span class="text-[10px] font-black px-2 py-0.5 rounded-full <?= $d['arah'] === 'piutang' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700' ?>">
                                <?= $d['arah'] === 'piutang' ? 'PIUTANG · dia utang ke saya' : 'UTANG · saya utang ke dia' ?></span>
                            <p class="font-black mt-2"><?= e($d['nama_teman']) ?></p>
                            <p class="text-xs text-slate-500"><?= e($d['keterangan']) ?></p>
                        </div>
                        <p class="font-black"><?= rupiah($d['nominal']) ?></p>
                    </div>
                    <?php if ($d['jatuh_tempo']): ?><p class="text-[11px] font-bold <?= $telat ? 'text-hsRed' : 'text-slate-500' ?>">Jatuh tempo <?= tgl($d['jatuh_tempo']) ?><?= $telat ? ' — terlewat' : '' ?></p><?php endif; ?>
                    <form method="post" class="flex gap-2">
                        <?= csrf_field() ?><input type="hidden" name="id" value="<?= $d['debt_id'] ?>">
                        <select name="wallet_id" class="flex-1 px-2 py-1.5 text-[11px] border" title="Wallet untuk pelunasan">
                            <?php foreach ($wallets as $w): ?><option value="<?= $w['wallet_id'] ?>"><?= e($w['nama']) ?></option><?php endforeach; ?>
                        </select>
                        <button name="aksi" value="lunas" class="hs-btn bg-hsGreen text-white px-3 py-1.5 text-[11px]">Lunas</button>
                        <button name="aksi" value="hapus" onclick="return confirm('Hapus catatan ini?')" class="hs-btn bg-slate-200 px-3 py-1.5 text-[11px]"><i class="fa-solid fa-trash"></i></button>
                    </form>
                    <?php if ($d['arah'] === 'piutang'): ?>
                        <a href="https://wa.me/?text=<?= $pesan ?>" target="_blank" rel="noopener" class="text-[11px] font-bold text-hsGreen"><i class="fa-brands fa-whatsapp"></i> Kirim pengingat via WhatsApp</a>
                    <?php endif; ?>
                </div>
            <?php endforeach; ?>
        </div>

        <?php if ($lunas): ?>
        <div class="hs-card p-5">
            <h4 class="text-sm font-black mb-2">Riwayat Lunas</h4>
            <?php foreach ($lunas as $d): ?>
                <p class="text-xs py-1 border-b last:border-0"><span class="font-bold"><?= e($d['nama_teman']) ?></span> · <?= e($d['keterangan']) ?> · <?= rupiah($d['nominal']) ?> <span class="text-hsGreen font-bold">✓</span></p>
            <?php endforeach; ?>
        </div>
        <?php endif; ?>
    </div>

    <div class="space-y-6">
        <form id="split" method="post" class="hs-card p-5 space-y-3">
            <?= csrf_field() ?>
            <h4 class="text-sm font-black"><i class="fa-solid fa-calculator text-hsPurple"></i> Split Bill</h4>
            <div><label for="sj" class="text-xs font-bold">Judul</label><input id="sj" name="judul" placeholder="Makan malam angkatan" class="w-full px-3 py-2 text-xs border"></div>
            <div><label for="st" class="text-xs font-bold">Total tagihan (Rp)</label><input id="st" type="number" name="total" min="1" required class="w-full px-3 py-2 text-xs border"></div>
            <div><label for="sn" class="text-xs font-bold">Nama teman (pisahkan dengan koma)</label><input id="sn" name="teman" required placeholder="Budi, Siti, Bima" class="w-full px-3 py-2 text-xs border"></div>
            <label class="flex items-center gap-2 text-xs font-bold"><input type="checkbox" name="termasuk_saya" value="1" checked> Saya ikut menanggung bagian</label>
            <p id="sbPreview" class="text-xs font-bold text-hsPurple"></p>
            <div><label for="sd" class="text-xs font-bold">Jatuh tempo (opsional)</label><input id="sd" type="date" name="jatuh_tempo" class="w-full px-3 py-2 text-xs border"></div>
            <button name="aksi" value="split" class="hs-btn bg-hsPurple text-white w-full py-2.5 text-xs">Bagi & Catat Piutang</button>
        </form>

        <form method="post" class="hs-card p-5 space-y-3">
            <?= csrf_field() ?>
            <h4 class="text-sm font-black"><i class="fa-solid fa-plus text-hsGreen"></i> Catat Utang / Piutang</h4>
            <div><label for="dn" class="text-xs font-bold">Nama teman</label><input id="dn" name="nama_teman" required class="w-full px-3 py-2 text-xs border"></div>
            <div><label for="dk" class="text-xs font-bold">Keterangan</label><input id="dk" name="keterangan" required placeholder="Pinjam untuk ongkos" class="w-full px-3 py-2 text-xs border"></div>
            <div><label for="dnom" class="text-xs font-bold">Nominal (Rp)</label><input id="dnom" type="number" name="nominal" min="1" required class="w-full px-3 py-2 text-xs border"></div>
            <div><label for="da" class="text-xs font-bold">Posisi</label>
                <select id="da" name="arah" class="w-full px-3 py-2 text-xs border"><option value="piutang">Dia utang ke saya (piutang)</option><option value="utang">Saya utang ke dia (utang)</option></select></div>
            <div><label for="dt" class="text-xs font-bold">Jatuh tempo (opsional)</label><input id="dt" type="date" name="jatuh_tempo" class="w-full px-3 py-2 text-xs border"></div>
            <button name="aksi" value="catat" class="hs-btn bg-hsGreen text-white w-full py-2.5 text-xs">Simpan</button>
        </form>
    </div>
</div>
<script>
// pratinjau pembagian split bill sebelum disimpan
(function () {
    const t = document.getElementById('st'), n = document.getElementById('sn'), me = document.querySelector('[name=termasuk_saya]'), out = document.getElementById('sbPreview');
    function upd() {
        const names = n.value.split(',').map(s => s.trim()).filter(Boolean), total = +t.value;
        if (!total || !names.length) { out.textContent = ''; return; }
        const per = Math.round(total / (names.length + (me.checked ? 1 : 0)));
        out.textContent = 'Rp ' + per.toLocaleString('id-ID') + ' per orang';
    }
    [t, n, me].forEach(el => el.addEventListener('input', upd));
})();
</script>
<?php require __DIR__ . '/../includes/layout/footer.php'; ?>

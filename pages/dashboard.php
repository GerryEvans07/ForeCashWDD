<?php
require_once __DIR__ . '/../includes/functions.php';
$user = require_login('mahasiswa');
$uid = $user['user_id'];

$f = forecast($uid);
$g = gamify($user, $f);
$wallets = wallets_with_balance($uid);
$recent = rows("SELECT t.tanggal, t.jenis, t.nominal, t.keterangan, c.nama AS kategori, w.nama AS wallet, w2.nama AS wallet_tujuan
                FROM transactions t JOIN wallets w ON w.wallet_id = t.wallet_id
                LEFT JOIN wallets w2 ON w2.wallet_id = t.wallet_tujuan_id
                LEFT JOIN categories c ON c.category_id = t.category_id
                WHERE t.user_id = ? ORDER BY t.tanggal DESC, t.transaction_id DESC LIMIT 5", 'i', $uid);
$piutang = (float)val("SELECT COALESCE(SUM(nominal),0) FROM debts WHERE user_id = ? AND arah = 'piutang' AND status = 'belum'", 'i', $uid);
$utang   = (float)val("SELECT COALESCE(SUM(nominal),0) FROM debts WHERE user_id = ? AND arah = 'utang' AND status = 'belum'", 'i', $uid);

$title = 'Dashboard'; $active = 'dashboard';
require __DIR__ . '/../includes/layout/header.php';
$ikon = ['tunai' => 'fa-money-bill-wave', 'bank' => 'fa-building-columns', 'ewallet' => 'fa-mobile-screen'];
$warnaWallet = ['bg-hsYellow', 'bg-blue-100', 'bg-emerald-100', 'bg-purple-100', 'bg-orange-100'];
?>

<?php require __DIR__ . '/../includes/layout/warning.php'; ?>

<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
    <div class="hs-card p-5"><p class="text-xs font-bold text-slate-500">Total Saldo</p><p class="text-xl font-black"><?= rupiah($f['saldo']) ?></p></div>
    <div class="hs-card p-5"><p class="text-xs font-bold text-slate-500">Burn Rate / Hari</p><p class="text-xl font-black"><?= rupiah($f['burn']) ?></p><p class="text-[10px] text-slate-400">rata-rata <?= $f['hari'] ?> hari terakhir</p></div>
    <div class="hs-card p-5"><p class="text-xs font-bold text-slate-500">Piutang (teman ke saya)</p><p class="text-xl font-black text-hsGreen"><?= rupiah($piutang) ?></p></div>
    <div class="hs-card p-5"><p class="text-xs font-bold text-slate-500">Utang (saya ke teman)</p><p class="text-xl font-black text-hsRed"><?= rupiah($utang) ?></p></div>
</div>

<!-- Gamifikasi: streak, level & badge, tantangan mingguan -->
<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    <div class="hs-card p-5 flex items-center gap-4">
        <div class="text-4xl">🔥</div>
        <div><p class="text-2xl font-black"><?= $g['streak'] ?> hari</p>
             <p class="text-xs text-slate-500"><?= $g['streak'] ? 'berturut-turut mencatat' : 'Mulai streak dengan mencatat hari ini' ?></p></div>
    </div>
    <div class="hs-card p-5"><?= level_bar_html($g) ?>
        <p class="text-lg mt-1">
            <?php $dapat = array_filter($g['badges'], fn($b) => $b['dapat']); ?>
            <?php foreach ($dapat as $b): ?><span title="<?= e($b['nama']) ?>"><?= $b['icon'] ?></span> <?php endforeach; ?>
            <?php if (!$dapat): ?><span class="text-xs text-slate-400">Belum ada badge</span><?php endif; ?>
        </p>
    </div>
    <a href="pencapaian.php" class="hs-card p-5 block"><?= tantangan_html($g['tantangan']) ?>
        <p class="text-[11px] font-bold text-hsOrange mt-2">Lihat semua pencapaian →</p></a>
</div>

<div class="space-y-3">
    <div class="flex flex-wrap justify-between items-center gap-3">
        <div>
            <h3 class="text-xl font-black">Saldo per Wallet</h3>
            <p class="text-xs text-slate-500">Wallet bersifat opsional. Semua transaksi otomatis masuk ke wallet "Utama".</p>
        </div>
        <div class="flex gap-2">
            <a href="wallet.php" class="hs-btn bg-slate-800 text-white px-3 py-2 text-xs"><i class="fa-solid fa-wallet"></i> Kelola Wallet</a>
            <a href="transaksi.php#form" class="hs-btn bg-hsBlue text-white px-4 py-2 text-xs"><i class="fa-solid fa-plus"></i> Tambah Transaksi</a>
        </div>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <?php foreach ($wallets as $i => $w): ?>
            <div class="wallet-card <?= $warnaWallet[$i % 5] ?> rounded-3xl p-5">
                <p class="text-xs font-bold"><i class="fa-solid <?= $ikon[$w['tipe']] ?>"></i> <?= e($w['nama']) ?></p>
                <p class="text-xl font-black mt-2"><?= rupiah($w['saldo']) ?></p>
            </div>
        <?php endforeach; ?>
    </div>
</div>

<div class="hs-card p-5 space-y-3">
    <div class="flex justify-between items-center">
        <h4 class="text-sm font-black">Transaksi Terakhir</h4>
        <a href="transaksi.php" class="text-xs font-bold text-hsOrange">Lihat semua →</a>
    </div>
    <?php if (!$recent): ?><p class="text-xs text-slate-500">Belum ada transaksi.</p><?php endif; ?>
    <?php foreach ($recent as $t): ?>
        <div class="flex justify-between items-center border-b last:border-0 py-2 text-sm">
            <div>
                <p class="font-bold"><?= e($t['keterangan']) ?></p>
                <p class="text-xs text-slate-500"><?= tgl($t['tanggal']) ?> ·
                    <?= $t['jenis'] === 'transfer' ? e($t['wallet']) . ' → ' . e($t['wallet_tujuan']) : e($t['kategori'] ?? '-') . ' · ' . e($t['wallet']) ?></p>
            </div>
            <p class="font-black <?= ['pemasukan' => 'text-hsGreen', 'pengeluaran' => 'text-hsRed', 'transfer' => 'text-hsBlue'][$t['jenis']] ?>">
                <?= ['pemasukan' => '+', 'pengeluaran' => '−', 'transfer' => '⇄ '][$t['jenis']] ?><?= rupiah($t['nominal']) ?>
            </p>
        </div>
    <?php endforeach; ?>
</div>

<?php require __DIR__ . '/../includes/layout/footer.php'; ?>

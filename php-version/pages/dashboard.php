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
?>

<?php require __DIR__ . '/../includes/layout/warning.php'; ?>

<!-- Ringkasan angka -->
<section class="fc-stats" aria-label="Ringkasan">
    <div class="hs-card fc-stat">
        <span class="fc-tile fc-tile-orange"><i class="fa-solid fa-coins"></i></span>
        <div class="min-w-0"><p class="fc-stat-label">Total saldo</p><p class="fc-stat-value"><?= rupiah($f['saldo']) ?></p></div>
    </div>
    <div class="hs-card fc-stat">
        <span class="fc-tile fc-tile-red"><i class="fa-solid fa-fire-flame-curved"></i></span>
        <div class="min-w-0"><p class="fc-stat-label">Pengeluaran per hari</p><p class="fc-stat-value"><?= rupiah($f['burn']) ?></p>
            <p class="fc-stat-sub">rata-rata <?= $f['hari'] ?> hari terakhir</p></div>
    </div>
    <a href="utang.php" class="hs-card fc-stat">
        <span class="fc-tile fc-tile-green"><i class="fa-solid fa-hand-holding-dollar"></i></span>
        <div class="min-w-0"><p class="fc-stat-label">Teman utang ke kamu</p><p class="fc-stat-value text-hsGreen"><?= rupiah($piutang) ?></p></div>
    </a>
    <a href="utang.php" class="hs-card fc-stat">
        <span class="fc-tile fc-tile-purple"><i class="fa-solid fa-user-clock"></i></span>
        <div class="min-w-0"><p class="fc-stat-label">Kamu utang ke teman</p><p class="fc-stat-value text-hsRed"><?= rupiah($utang) ?></p></div>
    </a>
</section>

<!-- Aksi cepat -->
<section aria-label="Catat cepat">
    <div class="fc-section-title"><h3>Mau catat apa?</h3></div>
    <div class="fc-actions">
        <a href="transaksi.php?jenis=pengeluaran#form" class="fc-action fc-action-out"><span class="fc-action-emoji">🍜</span><span><b>Pengeluaran</b><small>Jajan, ongkos, kos</small></span></a>
        <a href="transaksi.php?jenis=pemasukan#form" class="fc-action fc-action-in"><span class="fc-action-emoji">💰</span><span><b>Pemasukan</b><small>Uang saku, gaji part-time</small></span></a>
        <a href="transaksi.php?jenis=transfer#form" class="fc-action fc-action-move"><span class="fc-action-emoji">🔁</span><span><b>Transfer</b><small>Isi e-wallet dari rekening</small></span></a>
        <a href="utang.php#split" class="fc-action fc-action-split"><span class="fc-action-emoji">🍕</span><span><b>Split bill</b><small>Bagi tagihan bareng teman</small></span></a>
    </div>
</section>

<!-- Gamifikasi: streak, level & badge, tantangan mingguan -->
<section class="fc-game" aria-label="Pencapaian">
    <div class="hs-card fc-streak">
        <span class="fc-streak-flame">🔥</span>
        <div><p class="fc-stat-value" style="font-size:30px"><?= $g['streak'] ?> hari</p>
             <p class="fc-stat-sub"><?= $g['streak'] ? 'berturut-turut mencatat' : 'Catat sesuatu hari ini untuk mulai streak' ?></p></div>
    </div>
    <div class="hs-card p-5"><?= level_bar_html($g) ?>
        <p class="text-2xl mt-2 flex gap-1.5">
            <?php $dapat = array_filter($g['badges'], fn($b) => $b['dapat']); ?>
            <?php foreach ($dapat as $b): ?><span title="<?= e($b['nama']) ?>"><?= $b['icon'] ?></span><?php endforeach; ?>
            <?php if (!$dapat): ?><span class="text-xs text-slate-400">Belum ada badge</span><?php endif; ?>
        </p>
    </div>
    <a href="pencapaian.php" class="hs-card p-5 block"><?= tantangan_html($g['tantangan']) ?>
        <p class="fc-link mt-2">Lihat semua pencapaian</p></a>
</section>

<!-- Saldo per wallet -->
<section aria-label="Saldo per wallet">
    <div class="fc-section-title">
        <div><h3>Dompetmu</h3><p>Semua transaksi otomatis masuk ke wallet "Utama" kalau tidak dipilih.</p></div>
        <a href="wallet.php" class="fc-link">Kelola wallet</a>
    </div>
    <div class="fc-wallets">
        <?php foreach ($wallets as $i => $w): ?>
            <div class="wallet-card fc-w<?= $i % 5 ?>">
                <p class="flex items-center gap-2 text-sm font-bold"><span class="fc-wallet-icon"><i class="fa-solid <?= $ikon[$w['tipe']] ?>"></i></span> <?= e($w['nama']) ?></p>
                <p class="fc-stat-value"><?= rupiah($w['saldo']) ?></p>
            </div>
        <?php endforeach; ?>
    </div>
</section>

<!-- Transaksi terakhir -->
<section class="hs-card p-5" aria-label="Transaksi terakhir">
    <div class="fc-section-title" style="margin-bottom:4px">
        <h3 style="font-size:19px">Transaksi terakhir</h3>
        <a href="transaksi.php" class="fc-link">Lihat semua</a>
    </div>
    <?php if (!$recent): ?><p class="text-sm text-slate-500 py-3">Belum ada transaksi. Mulai dari tombol "Mau catat apa?" di atas.</p><?php endif; ?>
    <?php foreach ($recent as $t):
        $kelas = ['pemasukan' => 'is-in', 'pengeluaran' => 'is-out', 'transfer' => 'is-move'][$t['jenis']];
        $emoji = $t['jenis'] === 'transfer' ? '🔁' : kategori_emoji($t['kategori'], $t['jenis']); ?>
        <div class="fc-tx">
            <span class="fc-tx-icon <?= $kelas ?>"><?= $emoji ?></span>
            <div class="min-w-0 flex-1">
                <p class="font-bold text-sm truncate"><?= e($t['keterangan']) ?></p>
                <p class="text-xs text-slate-500 mt-0.5">
                    <span class="fc-chip"><?= $t['jenis'] === 'transfer' ? e($t['wallet']) . ' ke ' . e($t['wallet_tujuan']) : e($t['kategori'] ?? 'Lainnya') ?></span>
                    <?= tgl($t['tanggal']) ?>
                </p>
            </div>
            <p class="font-display font-extrabold text-base <?= ['pemasukan' => 'text-hsGreen', 'pengeluaran' => 'text-hsRed', 'transfer' => 'text-hsBlue'][$t['jenis']] ?>">
                <?= ['pemasukan' => '+', 'pengeluaran' => '−', 'transfer' => ''][$t['jenis']] ?><?= rupiah($t['nominal']) ?>
            </p>
        </div>
    <?php endforeach; ?>
</section>

<?php require __DIR__ . '/../includes/layout/footer.php'; ?>

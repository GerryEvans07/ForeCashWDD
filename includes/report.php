<?php
// Ringkasan laporan bulanan (transfer tidak dihitung). Dipakai laporan.php dan ortu.php.
function report_data($uid, $bulan) {
    $masuk = (float)val("SELECT COALESCE(SUM(nominal),0) FROM transactions WHERE user_id = ? AND jenis = 'pemasukan' AND DATE_FORMAT(tanggal,'%Y-%m') = ?", 'is', $uid, $bulan);
    $keluar = (float)val("SELECT COALESCE(SUM(nominal),0) FROM transactions WHERE user_id = ? AND jenis = 'pengeluaran' AND DATE_FORMAT(tanggal,'%Y-%m') = ?", 'is', $uid, $bulan);
    $perKategori = rows("SELECT COALESCE(c.nama,'Tanpa kategori') AS kategori, SUM(t.nominal) AS total
                         FROM transactions t LEFT JOIN categories c ON c.category_id = t.category_id
                         WHERE t.user_id = ? AND t.jenis = 'pengeluaran' AND DATE_FORMAT(t.tanggal,'%Y-%m') = ?
                         GROUP BY kategori ORDER BY total DESC", 'is', $uid, $bulan);
    $rasio = $masuk > 0 ? round(($masuk - $keluar) / $masuk * 100) : null;
    return compact('masuk', 'keluar', 'perKategori', 'rasio');
}

function report_html($r, $chartId) {
    ob_start(); ?>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="hs-card p-6 space-y-3">
            <h4 class="text-sm font-black text-center">Pengeluaran per Kategori</h4>
            <?php if (!$r['perKategori']): ?><p class="text-xs text-slate-500 text-center">Belum ada pengeluaran di bulan ini.</p>
            <?php else: ?><div class="h-60 relative"><canvas id="<?= $chartId ?>"></canvas></div><?php endif; ?>
        </div>
        <div class="hs-card p-6 space-y-3 text-sm">
            <h4 class="text-sm font-black">Ringkasan</h4>
            <p class="flex justify-between border-b py-2"><span class="text-slate-500">Total pemasukan</span><b class="text-hsGreen"><?= rupiah($r['masuk']) ?></b></p>
            <p class="flex justify-between border-b py-2"><span class="text-slate-500">Total pengeluaran</span><b class="text-hsRed"><?= rupiah($r['keluar']) ?></b></p>
            <p class="flex justify-between border-b py-2"><span class="text-slate-500">Rasio tabungan</span>
                <b class="text-hsBlue"><?= $r['rasio'] === null ? '-' : $r['rasio'] . '%' ?></b></p>
            <?php foreach ($r['perKategori'] as $k): ?>
                <p class="flex justify-between text-xs"><span><?= e($k['kategori']) ?></span><span><?= rupiah($k['total']) ?></span></p>
            <?php endforeach; ?>
        </div>
    </div>
    <?php if ($r['perKategori']): ?>
    <script>
    new Chart(document.getElementById('<?= $chartId ?>'), {
        type: 'doughnut',
        data: { labels: <?= json_encode(array_column($r['perKategori'], 'kategori')) ?>,
                datasets: [{ data: <?= json_encode(array_map('floatval', array_column($r['perKategori'], 'total'))) ?>,
                             backgroundColor: ['#FF7043','#FFC83D','#5B8DEF','#43B883','#8B6FE8','#E96868','#94A3B8'] }] },
        options: { maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
    });
    </script>
    <?php endif;
    return ob_get_clean();
}

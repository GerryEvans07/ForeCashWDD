<?php
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/report.php';
$user = require_login('mahasiswa');
$bulan = preg_match('/^\d{4}-\d{2}$/', $_GET['bulan'] ?? '') ? $_GET['bulan'] : date('Y-m');
$r = report_data($user['user_id'], $bulan);

$title = 'Laporan'; $active = 'laporan';
require __DIR__ . '/../includes/layout/header.php';
?>
<div class="flex flex-wrap justify-between items-center gap-3">
    <div>
        <h3 class="text-xl font-black">Laporan Bulanan</h3>
        <p class="text-xs text-slate-500">Transfer antar wallet tidak dihitung sebagai pemasukan maupun pengeluaran.</p>
    </div>
    <div class="flex gap-2">
        <form method="get"><input type="month" name="bulan" value="<?= e($bulan) ?>" onchange="this.form.submit()" class="px-3 py-2 text-xs border"></form>
        <a href="export.php?bulan=<?= e($bulan) ?>" class="hs-btn bg-hsGreen text-white px-4 py-2 text-xs"><i class="fa-solid fa-file-excel"></i> Ekspor Excel (.csv)</a>
    </div>
</div>
<?= report_html($r, 'chartLaporan') ?>
<?php require __DIR__ . '/../includes/layout/footer.php'; ?>

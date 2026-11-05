<?php
require_once __DIR__ . '/../includes/functions.php';
$user = require_login('mahasiswa');
$uid = $user['user_id'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $aksi = $_POST['aksi'] ?? '';
    if ($aksi === 'jadwal') {
        $sumber = trim($_POST['sumber'] ?? ''); $nom = (float)($_POST['nominal'] ?? 0); $tgl = $_POST['tanggal'] ?? '';
        if ($sumber === '' || $nom <= 0 || !DateTime::createFromFormat('Y-m-d', $tgl)) flash('!Sumber, nominal, dan tanggal wajib diisi.');
        else { q('INSERT INTO income_schedules (user_id, sumber, nominal, tanggal_perkiraan) VALUES (?,?,?,?)', 'isds', $uid, $sumber, $nom, $tgl); flash('Jadwal pemasukan ditambahkan.'); }
    } elseif ($aksi === 'diterima') {
        $s = row("SELECT * FROM income_schedules WHERE schedule_id = ? AND user_id = ? AND status = 'menunggu'", 'ii', (int)$_POST['id'], $uid);
        $wid = (int)($_POST['wallet_id'] ?? 0);
        if ($s && owns_wallet($uid, $wid)) {
            $kat = val("SELECT category_id FROM categories WHERE user_id IS NULL AND nama = 'Uang Saku' AND jenis = 'pemasukan'");
            q("INSERT INTO transactions (user_id, wallet_id, category_id, jenis, nominal, keterangan, tanggal) VALUES (?,?,?, 'pemasukan', ?, ?, CURDATE())",
              'iiids', $uid, $wid, $kat, $s['nominal'], $s['sumber']);
            q("UPDATE income_schedules SET status = 'diterima' WHERE schedule_id = ?", 'i', $s['schedule_id']);
            flash('Pemasukan diterima dan dicatat ke transaksi.');
        }
    } elseif ($aksi === 'hapus') {
        q('DELETE FROM income_schedules WHERE schedule_id = ? AND user_id = ?', 'ii', (int)$_POST['id'], $uid);
        flash('Jadwal dihapus.');
    }
    redirect('prediksi.php');
}

$f = forecast($uid);
[$labels, $data] = projection($f, 30);
$jadwal = rows("SELECT * FROM income_schedules WHERE user_id = ? AND status = 'menunggu' ORDER BY tanggal_perkiraan", 'i', $uid);
$wallets = wallets_with_balance($uid);
$markIdx = $f['sisa_hari'] !== null && $f['sisa_hari'] <= 30 ? $f['sisa_hari'] : null;

$title = 'Prediksi & Notifikasi'; $active = 'prediksi';
require __DIR__ . '/../includes/layout/header.php';
?>
<div>
    <h3 class="text-xl font-black">Prediksi & Notifikasi</h3>
    <p class="text-xs text-slate-500">Dihitung otomatis dari transaksi: burn rate = total pengeluaran <?= $f['hari'] ?> hari terakhir ÷ <?= $f['hari'] ?>.</p>
</div>

<?php require __DIR__ . '/../includes/layout/warning.php'; ?>

<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div class="hs-card p-6 space-y-4">
        <h4 class="text-sm font-black border-b pb-2">Hasil Perhitungan</h4>
        <div class="text-sm space-y-2">
            <p class="flex justify-between"><span class="text-slate-500">Total saldo</span><b><?= rupiah($f['saldo']) ?></b></p>
            <p class="flex justify-between"><span class="text-slate-500">Burn rate</span><b><?= rupiah($f['burn']) ?>/hari</b></p>
            <p class="flex justify-between"><span class="text-slate-500">Runway</span><b><?= $f['runway'] !== null ? $f['runway'] . ' hari' : '-' ?></b></p>
            <p class="flex justify-between"><span class="text-slate-500">Perkiraan saldo habis</span><b><?= $f['habis'] ? tgl($f['habis']) : '-' ?></b></p>
            <p class="flex justify-between"><span class="text-slate-500">Pemasukan berikutnya</span><b><?= $f['next'] ? tgl($f['next']['tanggal_perkiraan']) : '-' ?></b></p>
        </div>
        <div class="pt-3 border-t space-y-2">
            <label for="simBurn" class="text-xs font-bold">Simulasi: jika pengeluaran per hari menjadi</label>
            <input id="simBurn" type="number" min="0" step="1000" value="<?= round($f['burn']) ?>" class="w-full px-3 py-2 text-xs border">
            <p id="simHasil" class="text-xs font-bold text-hsBlue"></p>
        </div>
    </div>
    <div class="lg:col-span-2 hs-card p-6 space-y-3">
        <h4 class="text-sm font-black">Proyeksi Saldo 30 Hari ke Depan</h4>
        <div class="h-64 relative"><canvas id="chartProyeksi"></canvas></div>
        <?php if ($markIdx !== null): ?><p class="text-[11px] text-slate-500">Garis kuning menandai tanggal pemasukan berikutnya.</p><?php endif; ?>
    </div>
</div>

<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div class="lg:col-span-2 hs-card p-6 space-y-3">
        <h4 class="text-sm font-black">Jadwal Pemasukan</h4>
        <?php if (!$jadwal): ?><p class="text-xs text-slate-500">Belum ada jadwal. Tambahkan uang saku, honor, atau beasiswa agar peringatan bisa dihitung.</p><?php endif; ?>
        <?php foreach ($jadwal as $s): $telat = $s['tanggal_perkiraan'] < date('Y-m-d'); ?>
            <form method="post" class="flex flex-wrap items-center gap-2 border-b last:border-0 py-2">
                <?= csrf_field() ?><input type="hidden" name="id" value="<?= $s['schedule_id'] ?>">
                <div class="flex-1 min-w-[160px]">
                    <p class="text-sm font-bold"><?= e($s['sumber']) ?> · <?= rupiah($s['nominal']) ?></p>
                    <p class="text-xs <?= $telat ? 'text-hsRed font-bold' : 'text-slate-500' ?>"><?= tgl($s['tanggal_perkiraan']) ?><?= $telat ? ' — TERLAMBAT' : '' ?></p>
                </div>
                <select name="wallet_id" class="px-2 py-1.5 text-[11px] border" title="Masuk ke wallet">
                    <?php foreach ($wallets as $w): ?><option value="<?= $w['wallet_id'] ?>"><?= e($w['nama']) ?></option><?php endforeach; ?>
                </select>
                <button name="aksi" value="diterima" class="hs-btn bg-hsGreen text-white px-3 py-1.5 text-[11px]">Sudah diterima</button>
                <button name="aksi" value="hapus" onclick="return confirm('Hapus jadwal ini?')" class="hs-btn bg-slate-200 px-3 py-1.5 text-[11px]"><i class="fa-solid fa-trash"></i></button>
            </form>
        <?php endforeach; ?>
    </div>
    <form method="post" class="hs-card p-6 space-y-3">
        <?= csrf_field() ?>
        <h4 class="text-sm font-black">Tambah Jadwal Pemasukan</h4>
        <div><label for="js" class="text-xs font-bold">Sumber</label><input id="js" name="sumber" required placeholder="Uang saku dari orang tua" class="w-full px-3 py-2 text-xs border"></div>
        <div><label for="jn" class="text-xs font-bold">Perkiraan nominal (Rp)</label><input id="jn" type="number" name="nominal" min="1" required class="w-full px-3 py-2 text-xs border"></div>
        <div><label for="jt" class="text-xs font-bold">Tanggal perkiraan</label><input id="jt" type="date" name="tanggal" required class="w-full px-3 py-2 text-xs border"></div>
        <button name="aksi" value="jadwal" class="hs-btn bg-hsOrange text-white w-full py-2.5 text-xs">Simpan Jadwal</button>
    </form>
</div>

<script>
const saldo = <?= json_encode((float)$f['saldo']) ?>, sisaHari = <?= json_encode($f['sisa_hari']) ?>;
const ctx = document.getElementById('chartProyeksi');
const chart = new Chart(ctx, {
    type: 'line',
    data: { labels: <?= json_encode($labels) ?>, datasets: [{ label: 'Saldo', data: <?= json_encode($data) ?>, borderColor: '#FF7043', backgroundColor: 'rgba(255,112,67,.12)', fill: true, tension: .3, pointRadius: 0 }] },
    options: { maintainAspectRatio: false, plugins: { legend: { display: false } },
        scales: { y: { ticks: { callback: v => 'Rp ' + (v / 1000) + 'rb' } } } },
    plugins: [{ id: 'paydayLine', afterDraw(c) {
        const idx = <?= json_encode($markIdx) ?>; if (idx === null) return;
        const x = c.scales.x.getPixelForValue(idx), a = c.chartArea, g = c.ctx;
        g.save(); g.strokeStyle = '#FFC83D'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, a.top); g.lineTo(x, a.bottom); g.stroke(); g.restore();
    } }]
});
// simulasi "bagaimana jika" di sisi klien
const sim = document.getElementById('simBurn'), out = document.getElementById('simHasil');
function simulasi() {
    const b = +sim.value;
    if (b <= 0) { out.textContent = ''; return; }
    const run = Math.floor(Math.max(0, saldo) / b);
    out.textContent = 'Saldo bertahan ' + run + ' hari' + (sisaHari !== null ? (run >= sisaHari ? ' — aman sampai pemasukan berikutnya.' : ' — masih kurang ' + (sisaHari - run) + ' hari.') : '.');
    chart.data.datasets[0].data = chart.data.labels.map((_, i) => Math.max(0, Math.round(saldo - b * i)));
    chart.update();
}
sim.addEventListener('input', simulasi); simulasi();
</script>
<?php require __DIR__ . '/../includes/layout/footer.php'; ?>

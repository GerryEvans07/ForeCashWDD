<?php
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/journey.php';
$user = require_login('mahasiswa');
$uid = $user['user_id'];

if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['aksi'] ?? '') === 'pakai') {
    $pid = $_POST['pet'] ?? '';
    if (val('SELECT COUNT(*) FROM user_pets WHERE user_id = ? AND pet_id = ?', 'is', $uid, $pid)) {
        q('UPDATE user_pets SET dipakai = (pet_id = ?) WHERE user_id = ?', 'si', $pid, $uid);
        flash(PETS[$pid][0] . ' sekarang menemanimu.');
    }
    redirect('petualangan.php');
}

$f = forecast($uid);
$ps = pet_state($user);
$j = journey_data($user, $f, $ps['hariBaik']);
$hitung = array_count_values(array_column($j['hari'], 'status'));
$hariKe = array_search('hariini', array_column($j['hari'], 'status'));

$title = 'Petualangan'; $active = 'petualangan';
require __DIR__ . '/../includes/layout/header.php';
?>
<div><p class="text-xs text-slate-500">Setiap titik adalah satu hari menuju uang saku berikutnya. Hari baik membuat telur menetas jadi teman baru.</p></div>

<!-- ringkasan perjalanan -->
<section class="fc-journey-bar">
    <span class="fc-pill"><span class="fc-tile fc-tile-orange">🚶</span><span><b>Hari ke-<?= $hariKe === false ? '-' : $hariKe + 1 ?></b> dari <?= count($j['hari']) ?></span></span>
    <span class="fc-pill"><span class="fc-tile fc-tile-yellow">🪙</span><span><b><?= $hitung['baik'] ?? 0 ?></b> hari baik</span></span>
    <span class="fc-pill"><span class="fc-tile fc-tile-red">⚠️</span><span><b><?= $hitung['boros'] ?? 0 ?></b> hari boros</span></span>
    <span class="fc-pill"><span class="fc-tile fc-tile-purple">🐾</span><span><b><?= count($ps['owned']) ?>/<?= count(PETS) ?></b> teman</span></span>
</section>

<!-- peta -->
<section class="fc-map" data-tema="<?= $f['status'] ?>">
    <div class="fc-map-wide"><?= journey_svg($j, 7, 1000, 150, $f['status'], $user['avatar'], $ps['owned'], $ps['dipakai']) ?></div>
    <div class="fc-map-narrow"><?= journey_svg($j, 4, 420, 140, $f['status'], $user['avatar'], $ps['owned'], $ps['dipakai']) ?></div>
    <?php if (!$j['adaJadwal']): ?>
        <p class="fc-map-note">Belum ada jadwal pemasukan, jadi ujung peta belum ada garis finisnya. <a href="prediksi.php" class="fc-link">Tambah jadwal</a></p>
    <?php endif; ?>
    <div class="fc-map-legend">
        <span><i class="fc-lg fc-lg-baik"></i> Hari baik</span>
        <span><i class="fc-lg fc-lg-boros"></i> Melewati batas</span>
        <span><i class="fc-lg fc-lg-kosong"></i> Tidak mencatat</span>
        <span><i class="fc-lg fc-lg-cukup"></i> Saldo cukup</span>
        <span><i class="fc-lg fc-lg-kurang"></i> Saldo habis</span>
    </div>
</section>

<div class="fc-pet-area">
    <!-- telur -->
    <section class="hs-card fc-egg-card">
        <div class="fc-egg <?= $ps['progress'] >= TELUR_TARGET - 2 ? 'is-shaking' : '' ?>"><?= egg_svg($ps['progress'], 120) ?></div>
        <h3>Telur sedang dierami</h3>
        <p class="text-sm text-slate-500">Menetas setelah <?= TELUR_TARGET ?> hari baik: mencatat transaksi dan belanja tidak melewati batas harian.</p>
        <div class="fc-egg-bar"><span style="width: <?= round($ps['progress'] / TELUR_TARGET * 100) ?>%"></span></div>
        <p class="fc-egg-count"><?= $ps['progress'] ?>/<?= TELUR_TARGET ?> hari baik</p>
        <?php if ($user['batas_harian'] <= 0): ?>
            <p class="text-xs text-slate-500">Batas harian belum diatur, jadi setiap hari yang dicatat dihitung hari baik. <a href="transaksi.php" class="fc-link">Atur batas</a></p>
        <?php endif; ?>
    </section>

    <!-- koleksi -->
    <section class="hs-card p-5">
        <div class="fc-section-title"><h3 style="font-size:20px">Koleksi teman</h3><p><?= count($ps['owned']) ?> dari <?= count(PETS) ?> sudah menetas</p></div>
        <div class="fc-pet-grid">
            <?php foreach (PETS as $pid => $p): $punya = isset($ps['owned'][$pid]); ?>
                <?php if ($punya): ?>
                    <button type="button" class="fc-pet-tile <?= $ps['dipakai'] === $pid ? 'is-on' : '' ?>" data-open="pet-<?= $pid ?>" aria-label="Lihat <?= e($p[0]) ?>">
                        <?= pet_svg($pid, 64) ?>
                        <span><?= e($p[0]) ?></span>
                        <?php if ($ps['dipakai'] === $pid): ?><i class="fc-pet-check fa-solid fa-check"></i><?php endif; ?>
                    </button>
                <?php else: ?>
                    <div class="fc-pet-tile is-locked" title="Belum menetas"><?= pet_svg($pid, 64, "class='fc-silhouette'") ?><span>???</span></div>
                <?php endif; ?>
            <?php endforeach; ?>
        </div>
    </section>
</div>

<!-- kartu detail tiap hewan -->
<?php foreach ($ps['owned'] as $pid => $tglMenetas): $p = PETS[$pid]; ?>
    <dialog id="pet-<?= $pid ?>" class="fc-dialog <?= $ps['baru'] === $pid ? 'is-new' : '' ?>">
        <?php if ($ps['baru'] === $pid): ?><p class="fc-dialog-new">🎉 Telurmu menetas!</p><?php endif; ?>
        <div class="fc-dialog-pet"><?= pet_svg($pid, 140) ?></div>
        <p class="fc-dialog-tag"><?= e($p[4]) ?></p>
        <h3><?= e($p[0]) ?></h3>
        <p class="fc-dialog-story"><?= e($p[5]) ?></p>
        <p class="fc-dialog-date">Menetas <?= tgl($tglMenetas) ?></p>
        <div class="fc-dialog-actions">
            <button type="button" class="hs-btn bg-slate-100 px-5 py-2.5" data-close>Tutup</button>
            <?php if ($ps['dipakai'] !== $pid): ?>
                <form method="post"><?= csrf_field() ?><input type="hidden" name="pet" value="<?= $pid ?>">
                    <button name="aksi" value="pakai" class="hs-btn bg-hsOrange text-white px-5 py-2.5">Ajak jalan-jalan</button></form>
            <?php else: ?>
                <span class="fc-chip" style="padding:8px 14px">Sedang menemanimu</span>
            <?php endif; ?>
        </div>
    </dialog>
<?php endforeach; ?>

<script>
document.querySelectorAll('[data-open]').forEach(b => b.addEventListener('click', () => document.getElementById(b.dataset.open).showModal()));
document.querySelectorAll('dialog [data-close]').forEach(b => b.addEventListener('click', () => b.closest('dialog').close()));
document.querySelectorAll('dialog').forEach(d => d.addEventListener('click', e => { if (e.target === d) d.close(); }));
const baru = document.querySelector('dialog.is-new');
if (baru) baru.showModal();
</script>
<?php require __DIR__ . '/../includes/layout/footer.php'; ?>

<?php
// Banner peringatan dini. Butuh $f (hasil forecast()). $avatarId opsional (default avatar pengguna).
$warna = ['aman' => 'bg-emerald-100', 'waspada' => 'bg-hsYellow', 'kritis' => 'bg-red-200'][$f['status']];
$label = ['aman' => 'Aman', 'waspada' => 'Waspada', 'kritis' => 'Kritis'][$f['status']];
$pct = ($f['runway'] !== null && $f['sisa_hari']) ? min(100, round($f['runway'] / max(1, $f['sisa_hari']) * 100)) : 100;
?>
<div class="<?= $warna ?> p-6 sm:p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6">
    <div class="space-y-3 max-w-xl text-center md:text-left">
        <div class="inline-flex items-center gap-2 bg-white/80 px-3 py-1 rounded-full text-xs font-extrabold">
            <i class="fa-solid fa-bell text-hsOrange"></i> Peringatan Dini · Status <?= $label ?>
        </div>

        <h2 class="text-2xl sm:text-3xl font-black text-hsDark leading-snug">
            <?php if ($f['burn'] <= 0): ?>
                Belum ada pengeluaran yang tercatat.
            <?php elseif ($f['saldo'] <= 0): ?>
                Saldo sudah habis.
            <?php else: ?>
                Saldo diproyeksikan habis pada
                <span class="bg-hsOrange text-white px-3 py-0.5 rounded-2xl inline-block"><?= tgl($f['habis']) ?></span>
            <?php endif; ?>
        </h2>

        <p class="text-sm font-medium text-hsDark/80">
            <?php if ($f['next']): ?>
                <?= e($f['next']['sumber']) ?> berikutnya dijadwalkan <strong><?= tgl($f['next']['tanggal_perkiraan']) ?></strong>
                (<?= $f['sisa_hari'] ?> hari lagi).
                <?php if ($f['status'] !== 'aman' && $f['batas_aman'] !== null): ?>
                    Batas pengeluaran harian yang aman: <strong><?= rupiah($f['batas_aman']) ?>/hari</strong>.
                <?php endif; ?>
            <?php else: ?>
                Belum ada jadwal pemasukan berikutnya. Tambahkan di menu Prediksi agar peringatan lebih akurat.
            <?php endif; ?>
        </p>

        <?php foreach ($f['terlambat'] as $t): ?>
            <p class="text-sm font-bold text-hsRed"><i class="fa-solid fa-triangle-exclamation"></i>
                <?= e($t['sumber']) ?> (<?= rupiah($t['nominal']) ?>) terlambat sejak <?= tgl($t['tanggal_perkiraan']) ?>.</p>
        <?php endforeach; ?>

        <?php if ($f['runway'] !== null): ?>
        <div class="pt-2 space-y-1">
            <div class="flex justify-between text-xs font-bold">
                <span>Daya tahan saldo (runway)</span>
                <span class="bg-white px-2.5 py-0.5 rounded-full"><?= $f['runway'] ?> hari lagi</span>
            </div>
            <div class="w-full bg-white/60 rounded-full h-4 p-0.5"><div class="bg-hsOrange h-full rounded-full" style="width: <?= $pct ?>%"></div></div>
        </div>
        <?php endif; ?>
    </div>
    <!-- maskot bereaksi: ekspresi avatar mengikuti status keuangan -->
    <div class="shrink-0 flex flex-col items-center gap-2">
        <div class="bg-white rounded-2xl px-3 py-1.5 text-xs font-bold shadow-sm"><?= ['aman' => 'Aman, lanjutkan!', 'waspada' => 'Hati-hati ya...', 'kritis' => 'Gawat, rem dulu!'][$f['status']] ?></div>
        <div class="w-32 h-32 bg-white/70 rounded-full flex items-end justify-center overflow-hidden border-4 border-white shadow-lg character-bounce">
            <?= avatar_svg($avatarId ?? $user['avatar'], mood_for($f['status']), 116) ?>
        </div>
    </div>
</div>

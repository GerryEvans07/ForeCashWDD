<?php
// Banner peringatan dini. Butuh $f (hasil forecast()). $avatarId opsional (default avatar pengguna).
// Langitnya ikut status: cerah (aman), senja (waspada), mendung + hujan (kritis).
$st = $f['status'];
$label = ['aman' => 'Aman', 'waspada' => 'Waspada', 'kritis' => 'Kritis'][$st];
$dot = ['aman' => ['#2EBD74', 'fa-check'], 'waspada' => ['#F0A000', 'fa-exclamation'], 'kritis' => ['#FF5B5B', 'fa-bolt']][$st];
$kata = ['aman' => 'Aman, lanjutkan!', 'waspada' => 'Pelan-pelan ya...', 'kritis' => 'Gawat, rem dulu!'][$st];

// hari-hari menuju pemasukan berikutnya: koin = hari yang masih tertutup saldo
$hariTotal = $f['sisa_hari'] ? min(45, $f['sisa_hari']) : 0;
$hariAman = $f['runway'] === null ? $hariTotal : min($hariTotal, $f['runway']);
?>
<section class="fc-hero" data-status="<?= $st ?>" aria-label="Peringatan dini">
    <svg class="fc-hero-scene" viewBox="0 0 1200 320" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
        <?php if ($st === 'aman'): ?>
            <circle cx="840" cy="70" r="120" fill="#FFF3B0" opacity=".55"/>
            <image href="../assets/img/logo.svg" x="770" y="0" width="140" height="140"/>
            <g fill="#fff" opacity=".9"><ellipse cx="640" cy="70" rx="60" ry="20"/><ellipse cx="680" cy="55" rx="40" ry="24"/><ellipse cx="1000" cy="40" rx="46" ry="14"/></g>
        <?php elseif ($st === 'waspada'): ?>
            <circle cx="830" cy="210" r="150" fill="#FFB347" opacity=".35"/>
            <image href="../assets/img/logo.svg" x="765" y="130" width="130" height="130"/>
            <g fill="#FFF4DB" opacity=".9"><ellipse cx="650" cy="80" rx="70" ry="18"/><ellipse cx="1010" cy="50" rx="50" ry="14"/></g>
        <?php else: ?>
            <image href="../assets/img/logo.svg" x="790" y="60" width="110" height="110" opacity=".55"/>
            <g fill="#8E86B5"><ellipse cx="830" cy="80" rx="110" ry="40"/><ellipse cx="890" cy="60" rx="70" ry="42"/><ellipse cx="760" cy="70" rx="60" ry="34"/></g>
            <g stroke="#7FA4E6" stroke-width="5" stroke-linecap="round" class="fc-rain">
                <line x1="770" y1="130" x2="762" y2="150"/><line x1="815" y1="140" x2="807" y2="160"/><line x1="860" y1="128" x2="852" y2="148"/>
                <line x1="905" y1="138" x2="897" y2="158"/><line x1="790" y1="175" x2="782" y2="195"/><line x1="880" y1="178" x2="872" y2="198"/>
            </g>
        <?php endif; ?>
        <!-- bukit -->
        <path d="M640 320 C760 210 880 200 1000 250 C1080 280 1150 240 1200 220 L1200 320 Z" fill="<?= ['aman' => '#7FD6A0', 'waspada' => '#F4B860', 'kritis' => '#A79FCB'][$st] ?>"/>
        <path d="M760 320 C860 260 980 250 1090 290 C1140 305 1180 300 1200 296 L1200 320 Z" fill="<?= ['aman' => '#4CC283', 'waspada' => '#E89A3C', 'kritis' => '#8C83B8'][$st] ?>"/>
    </svg>

    <div class="fc-hero-text">
        <span class="fc-hero-badge">
            <span class="fc-hero-dot" style="background:<?= $dot[0] ?>"><i class="fa-solid <?= $dot[1] ?>"></i></span>
            Status <?= $label ?>
        </span>

        <h2>
            <?php if ($f['burn'] <= 0): ?>
                Belum ada pengeluaran yang tercatat.
            <?php elseif ($f['saldo'] <= 0): ?>
                Saldo sudah habis.
            <?php else: ?>
                Saldo cukup sampai <span class="fc-hero-date"><?= tgl($f['habis']) ?></span>
            <?php endif; ?>
        </h2>

        <p>
            <?php if ($f['next']): ?>
                <?= e($f['next']['sumber']) ?> datang <?= tgl($f['next']['tanggal_perkiraan']) ?>, <?= $f['sisa_hari'] ?> hari lagi.
                <?php if ($st !== 'aman' && $f['batas_aman'] !== null): ?>
                    Supaya cukup, belanja maksimal <strong><?= rupiah($f['batas_aman']) ?></strong> per hari.
                <?php endif; ?>
            <?php else: ?>
                Belum ada jadwal pemasukan. Tambahkan di menu Prediksi supaya peringatannya lebih tepat.
            <?php endif; ?>
        </p>

        <?php foreach ($f['terlambat'] as $t): ?>
            <p style="color:#C22C2C"><i class="fa-solid fa-triangle-exclamation"></i>
                <?= e($t['sumber']) ?> (<?= rupiah($t['nominal']) ?>) belum datang sejak <?= tgl($t['tanggal_perkiraan']) ?>.</p>
        <?php endforeach; ?>

        <?php if ($hariTotal > 0): ?>
            <div class="fc-days">
                <div class="fc-days-head">
                    <span>Hari menuju pemasukan</span>
                    <span><?= $hariAman ?> dari <?= $hariTotal ?> hari tertutup saldo</span>
                </div>
                <div class="fc-days-row">
                    <?php for ($i = 1; $i <= $hariTotal; $i++): ?>
                        <span class="fc-day <?= $i === $hariTotal ? 'is-pay' : ($i <= $hariAman ? 'is-ok' : 'is-short') ?>"
                              title="<?= tgl(date('Y-m-d', strtotime("+$i day"))) ?>"></span>
                    <?php endfor; ?>
                </div>
                <div class="fc-days-legend">
                    <span><i class="fc-day is-ok"></i> Saldo cukup</span>
                    <?php if ($hariAman < $hariTotal - 1): ?><span><i class="fc-day is-short"></i> Saldo kurang</span><?php endif; ?>
                    <span><i class="fc-day is-pay"></i> Pemasukan</span>
                </div>
            </div>
        <?php elseif ($f['runway'] !== null): ?>
            <div class="fc-days"><div class="fc-days-head"><span>Daya tahan saldo</span><span><?= $f['runway'] ?> hari lagi</span></div></div>
        <?php endif; ?>
    </div>

    <!-- maskot bereaksi: ekspresi avatar mengikuti status keuangan -->
    <div class="fc-hero-mascot">
        <div class="fc-bubble"><?= $kata ?></div>
        <div class="fc-hero-avatar character-bounce"><?= avatar_svg($avatarId ?? $user['avatar'], mood_for($st), 136) ?></div>
        <?php if ($user['role'] === 'mahasiswa' && ($teman = pet_dipakai($user['user_id']))): ?>
            <a href="petualangan.php" class="fc-hero-buddy" title="<?= e(PETS[$teman][0]) ?> menemanimu"><?= pet_svg($teman, 64) ?></a>
        <?php endif; ?>
    </div>
</section>

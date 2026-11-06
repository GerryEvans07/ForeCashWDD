<?php
require_once __DIR__ . '/../includes/functions.php';
$user = require_login('mahasiswa');
$g = gamify($user);

$title = 'Pencapaian'; $active = 'pencapaian';
require __DIR__ . '/../includes/layout/header.php';
?>
<div>
    <p class="text-xs text-slate-500">Kumpulkan badge dari kebiasaan baik: rajin mencatat, hemat, dan melunasi utang.</p>
</div>

<section class="hs-card p-6 flex flex-wrap items-center gap-6">
    <div class="w-24 h-24 bg-hsYellow/40 rounded-full flex items-end justify-center overflow-hidden shrink-0"><?= avatar_svg($user['avatar'], 'happy', 88) ?></div>
    <div class="flex-1 min-w-[200px]">
        <p class="text-xl font-black"><?= e($user['nama']) ?></p>
        <div class="mt-2"><?= level_bar_html($g) ?></div>
    </div>
    <div class="text-center"><p class="text-4xl">🔥</p><p class="text-xl font-black"><?= $g['streak'] ?> hari</p><p class="text-[11px] text-slate-500">streak</p></div>
</section>

<section class="hs-card p-6 space-y-2">
    <h4 class="text-sm font-black"><i class="fa-solid fa-flag-checkered text-hsOrange"></i> Tantangan Minggu Ini</h4>
    <?= tantangan_html($g['tantangan']) ?>
</section>

<section class="space-y-3">
    <h4 class="text-sm font-black">Badge</h4>
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <?php foreach ($g['badges'] as $b): ?>
            <div class="hs-card p-5 text-center space-y-2 <?= $b['dapat'] ? '' : 'opacity-60' ?>">
                <div class="text-4xl <?= $b['dapat'] ? '' : 'grayscale' ?>"><?= $b['icon'] ?></div>
                <p class="text-sm font-black"><?= e($b['nama']) ?></p>
                <p class="text-[11px] text-slate-500"><?= e($b['ket']) ?></p>
                <?php if ($b['dapat']): ?>
                    <span class="inline-block text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">TERCAPAI · +100</span>
                <?php else: ?>
                    <div class="w-full bg-slate-100 rounded-full h-2"><div class="bg-hsOrange h-2 rounded-full" style="width:<?= round($b['now'] / $b['max'] * 100) ?>%"></div></div>
                    <p class="text-[10px] font-bold"><?= $b['now'] ?>/<?= $b['max'] ?></p>
                <?php endif; ?>
            </div>
        <?php endforeach; ?>
    </div>
</section>

<section class="hs-card p-5 text-xs text-slate-600 space-y-1">
    <p class="font-bold text-hsDark">Cara mendapat poin</p>
    <p>Setiap badge bernilai 100 poin, dan setiap hari streak bernilai 10 poin (maks. 30 hari). Level naik setiap 200 poin.</p>
</section>
<?php require __DIR__ . '/../includes/layout/footer.php'; ?>

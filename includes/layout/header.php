<?php
// Dipakai semua halaman setelah login. Butuh $user, $title, $active.
$menus = $user['role'] === 'orangtua'
    ? ['ortu' => ['ortu.php', 'fa-eye', 'Pantau Anak']]
    : [
        'dashboard' => ['dashboard.php', 'fa-gauge-high', 'Dashboard'],
        'transaksi' => ['transaksi.php', 'fa-receipt', 'Transaksi'],
        'utang'     => ['utang.php', 'fa-users', 'Utang & Patungan'],
        'prediksi'  => ['prediksi.php', 'fa-chart-line', 'Prediksi & Notifikasi'],
        'laporan'   => ['laporan.php', 'fa-chart-pie', 'Laporan'],
        'pencapaian'=> ['pencapaian.php', 'fa-trophy', 'Pencapaian'],
      ];
$msg = flash();
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= e($title) ?> — ForeCash</title>
    <meta name="description" content="ForeCash: aplikasi web peringatan dini keuangan untuk mahasiswa.">
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="../assets/js/config/tw-config.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <link rel="stylesheet" href="../assets/css/styles.css">
    <link rel="icon" href="../assets/img/logo.svg" type="image/svg+xml">
</head>
<body class="min-h-screen flex flex-col">
<div id="mainDashboard" class="min-h-screen flex flex-col">

<?php if ($user['role'] === 'orangtua'): ?>
    <div class="bg-purple-600 text-white text-xs font-bold py-2 px-4 text-center">
        <i class="fa-solid fa-eye"></i> Mode Pantau Orang Tua — data hanya dapat dilihat, tidak dapat diubah.
    </div>
<?php endif; ?>

<header class="sticky top-0 z-40 backdrop-blur-md px-4 sm:px-8 py-4 border-b">
    <div class="max-w-6xl mx-auto flex flex-wrap justify-between items-center gap-3">
        <a href="<?= $user['role'] === 'orangtua' ? 'ortu.php' : 'dashboard.php' ?>" class="flex items-center gap-3">
            <img src="../assets/img/logo.svg" alt="" class="w-10 h-10 drop-shadow">
            <div>
                <h1 class="text-2xl font-black text-hsDark leading-none">ForeCash</h1>
                <p class="text-[11px] font-bold text-hsOrange">Financial Early Warning</p>
            </div>
        </a>

        <nav class="flex items-center gap-1.5 overflow-x-auto py-1 order-3 lg:order-none w-full lg:w-auto">
            <?php foreach ($menus as $key => [$href, $icon, $label]): ?>
                <a href="<?= $href ?>" class="nav-tab <?= $active === $key ? 'active' : '' ?> px-3.5 py-2 text-xs sm:text-sm flex items-center gap-1.5 whitespace-nowrap">
                    <i class="fa-solid <?= $icon ?>"></i> <?= $label ?>
                </a>
            <?php endforeach; ?>
        </nav>

        <div class="flex items-center gap-2">
            <a href="akun.php" class="nav-tab <?= $active === 'akun' ? 'active' : '' ?> flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-100">
                <span class="w-7 h-7 rounded-full bg-hsYellow/40 overflow-hidden flex items-end justify-center"><?= avatar_svg($user['avatar'], 'happy', 28) ?></span>
                <span class="text-xs font-bold text-hsDark"><?= e(explode(' ', $user['nama'])[0]) ?></span>
                <span class="text-[9px] bg-hsYellow text-hsDark px-2 py-0.5 rounded-full font-black uppercase"><?= $user['role'] === 'orangtua' ? 'Orang Tua' : 'Mahasiswa' ?></span>
            </a>
            <a href="logout.php" class="hs-btn bg-slate-200 text-slate-700 px-3 py-1.5 text-xs" title="Keluar"><i class="fa-solid fa-right-from-bracket"></i></a>
        </div>
    </div>
</header>

<main class="max-w-6xl mx-auto w-full px-4 sm:px-8 py-6 flex-grow space-y-6">
<?php if ($msg): ?>
    <div class="hs-card px-5 py-3 text-sm font-bold <?= str_starts_with($msg, '!') ? 'text-hsRed' : 'text-hsGreen' ?>">
        <?= e(ltrim($msg, '!')) ?>
    </div>
<?php endif; ?>

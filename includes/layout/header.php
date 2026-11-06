<?php
// Kerangka halaman setelah login: sidebar (desktop), tab bar bawah (HP), header halaman.
// Butuh $user, $title, $active. Opsional $subtitle.
$menus = $user['role'] === 'orangtua'
    ? ['ortu' => ['ortu.php', 'fa-eye', 'Pantau Anak', 'purple']]
    : [
        'dashboard'  => ['dashboard.php', 'fa-house', 'Beranda', 'orange'],
        'transaksi'  => ['transaksi.php', 'fa-receipt', 'Transaksi', 'blue'],
        'utang'      => ['utang.php', 'fa-user-group', 'Utang & Patungan', 'purple'],
        'prediksi'   => ['prediksi.php', 'fa-cloud-sun', 'Prediksi', 'green'],
        'laporan'    => ['laporan.php', 'fa-chart-pie', 'Laporan', 'pink'],
        'petualangan'=> ['petualangan.php', 'fa-map-location-dot', 'Petualangan', 'teal'],
        'pencapaian' => ['pencapaian.php', 'fa-trophy', 'Pencapaian', 'yellow'],
      ];
$msg = flash();
$home = $user['role'] === 'orangtua' ? 'ortu.php' : 'dashboard.php';
$hariIni = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][date('w')] . ', ' . tgl(date('Y-m-d'));
$jam = (int)date('G');
$sapaan = $jam < 11 ? 'Selamat pagi' : ($jam < 15 ? 'Selamat siang' : ($jam < 18 ? 'Selamat sore' : 'Selamat malam'));
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= e($title) ?> — ForeCash</title>
    <meta name="description" content="ForeCash: aplikasi web peringatan dini keuangan untuk mahasiswa.">
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="../assets/js/config/tw-config.js?v=<?= filemtime(__DIR__ . '/../../assets/js/config/tw-config.js') ?>"></script>
    <!-- font Satoshi (Fontshare, ITF Free Font License), sama dengan DapurTwin -->
    <link href="https://api.fontshare.com/v2/css?f[]=satoshi@300,400,500,700,900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <!-- ?v= berubah setiap file diubah, supaya browser tidak memakai CSS lama dari cache -->
    <link rel="stylesheet" href="../assets/css/styles.css?v=<?= filemtime(__DIR__ . '/../../assets/css/styles.css') ?>">
    <link rel="icon" href="../assets/img/logo.svg" type="image/svg+xml">
</head>
<body class="fc-body">

<!-- ===== Sidebar (layar lebar) ===== -->
<aside class="fc-side" aria-label="Menu utama">
    <a href="<?= $home ?>" class="fc-brand">
        <img src="../assets/img/logo.svg" alt="" class="fc-brand-logo">
        <span>
            <span class="fc-brand-name">ForeCash</span>
            <span class="fc-brand-tag">Uang aman sampai kiriman berikutnya</span>
        </span>
    </a>

    <nav class="fc-nav">
        <?php foreach ($menus as $key => [$href, $icon, $label, $warna]): ?>
            <a href="<?= $href ?>" class="fc-nav-item <?= $active === $key ? 'is-active' : '' ?>" <?= $active === $key ? 'aria-current="page"' : '' ?>>
                <span class="fc-tile fc-tile-<?= $warna ?>"><i class="fa-solid <?= $icon ?>"></i></span>
                <?= $label ?>
            </a>
        <?php endforeach; ?>
    </nav>

    <div class="fc-side-foot">
        <a href="akun.php" class="fc-me <?= $active === 'akun' ? 'is-active' : '' ?>">
            <span class="fc-me-avatar"><?= avatar_svg($user['avatar'], 'happy', 44) ?></span>
            <span class="min-w-0">
                <span class="fc-me-name"><?= e($user['nama']) ?></span>
                <span class="fc-me-role"><?= $user['role'] === 'orangtua' ? 'Orang tua' : 'Mahasiswa' ?> · Akun</span>
            </span>
        </a>
        <a href="logout.php" class="fc-logout"><i class="fa-solid fa-right-from-bracket"></i> Keluar</a>
    </div>
</aside>

<div class="fc-main">
    <?php if ($user['role'] === 'orangtua'): ?>
        <div class="fc-parent-strip"><i class="fa-solid fa-eye"></i> Mode pantau: data anak hanya bisa dilihat, tidak bisa diubah.</div>
    <?php endif; ?>

    <!-- header halaman -->
    <header class="fc-top">
        <a href="<?= $home ?>" class="fc-top-logo" aria-label="ForeCash"><img src="../assets/img/logo.svg" alt=""></a>
        <div class="min-w-0">
            <p class="fc-top-date"><?= $hariIni ?></p>
            <h1 class="fc-top-title"><?= $active === 'dashboard' ? $sapaan . ', ' . e(explode(' ', $user['nama'])[0]) . '!' : e($title) ?></h1>
        </div>
        <a href="akun.php" class="fc-top-avatar" aria-label="Akun"><?= avatar_svg($user['avatar'], 'happy', 40) ?></a>
    </header>

<main class="fc-content">
<?php if ($msg): ?>
    <div class="fc-flash <?= str_starts_with($msg, '!') ? 'is-error' : '' ?>" role="status">
        <i class="fa-solid <?= str_starts_with($msg, '!') ? 'fa-circle-exclamation' : 'fa-circle-check' ?>"></i>
        <?= e(ltrim($msg, '!')) ?>
    </div>
<?php endif; ?>

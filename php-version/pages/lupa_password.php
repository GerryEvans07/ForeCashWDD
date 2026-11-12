<?php
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/reset.php';
require_once __DIR__ . '/../includes/mailer.php';
check_csrf();
if (current_user()) redirect('dashboard.php');

$terkirim = false;
$linkDemo = null;
$alasanDemo = null;
$email = '';
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['email'] ?? '');
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $error = 'Masukkan email yang valid.';
    } else {
        $u = row('SELECT user_id, nama FROM users WHERE email = ?', 's', $email);
        if ($u) {
            $token = buat_token_reset($u['user_id']);
            $link = link_reset($token);
            $teks = "Halo {$u['nama']},\n\nKlik link berikut untuk membuat kata sandi baru (berlaku " . RESET_MENIT . " menit):\n$link\n\nAbaikan email ini jika kamu tidak meminta reset.";
            $hasil = kirim_email($email, $u['nama'], 'Reset kata sandi ForeCash', email_reset_html($u['nama'], $link, RESET_MENIT), $teks);
            // email belum diatur atau gagal terkirim: link ditampilkan di layar (mode demo)
            if ($hasil !== true) { $linkDemo = $link; $alasanDemo = email_siap() ? alasan_gagal_email($hasil) : null; }
        }
        // pesan sama untuk email terdaftar maupun tidak, supaya orang lain tidak bisa menebak email siapa saja yang terdaftar
        $terkirim = true;
    }
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lupa Kata Sandi — ForeCash</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="../assets/js/config/tw-config.js"></script>
    <!-- font Satoshi (Fontshare, ITF Free Font License), sama dengan DapurTwin -->
    <link href="https://api.fontshare.com/v2/css?f[]=satoshi@300,400,500,700,900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="../assets/css/styles.css?v=<?= filemtime(__DIR__ . '/../assets/css/styles.css') ?>">
    <link rel="icon" href="../assets/img/logo.svg" type="image/svg+xml">
</head>
<body>
<div id="loginPage" class="min-h-screen flex items-center justify-center p-4">
    <div class="max-w-md w-full space-y-6 text-center">
        <img src="../assets/img/logo.svg" alt="Logo ForeCash" class="w-24 h-24 mx-auto character-bounce drop-shadow-xl">

        <div class="hs-card p-6 sm:p-8 space-y-5 text-left">
            <div class="space-y-1">
                <h1 class="text-2xl font-black">Lupa kata sandi?</h1>
                <p class="text-sm text-slate-500">Masukkan email akunmu. Kami kirimkan link untuk membuat kata sandi baru.</p>
            </div>

            <?php if ($terkirim): ?>
                <div class="rounded-2xl bg-emerald-50 border-2 border-emerald-100 p-4 text-sm space-y-1">
                    <p class="font-bold text-emerald-800"><i class="fa-solid fa-envelope-circle-check"></i> Cek emailmu</p>
                    <p class="text-emerald-900">Jika <b><?= e($email) ?></b> terdaftar, link reset sudah dikirim dan berlaku <?= RESET_MENIT ?> menit.</p>
                </div>
                <?php if ($linkDemo): ?>
                    <div class="rounded-2xl bg-amber-50 border-2 border-dashed border-amber-300 p-4 text-sm space-y-2">
                        <p class="font-bold text-amber-800"><i class="fa-solid fa-flask"></i> Mode demo</p>
                        <p class="text-amber-900"><?= $alasanDemo ? e($alasanDemo) : 'Pengiriman email belum diatur (config/mail.php), jadi link-nya ditampilkan di sini.' ?></p>
                        <a href="<?= e($linkDemo) ?>" class="hs-btn bg-hsOrange text-white w-full py-2.5 text-sm">Buka link reset</a>
                    </div>
                <?php endif; ?>
            <?php else: ?>
                <?php if ($error): ?><p class="text-sm font-bold text-hsRed"><?= e($error) ?></p><?php endif; ?>
                <form method="post" class="space-y-4">
                    <?= csrf_field() ?>
                    <div class="space-y-1">
                        <label for="email" class="text-xs font-bold uppercase tracking-wider">Email</label>
                        <input id="email" type="email" name="email" required value="<?= e($email) ?>" placeholder="nama@student.umn.ac.id" class="w-full px-4 py-3 border text-sm font-semibold">
                    </div>
                    <button class="hs-btn bg-hsOrange text-white w-full py-3.5 text-base">Kirim link reset</button>
                </form>
            <?php endif; ?>
        </div>
        <a href="login.php" class="text-xs font-bold text-slate-500">← Kembali ke login</a>
    </div>
</div>
</body>
</html>

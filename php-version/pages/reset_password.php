<?php
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/reset.php';
check_csrf();

$token = $_GET['token'] ?? $_POST['token'] ?? '';
$reset = cek_token_reset($token);
$error = '';

if ($reset && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $pass = $_POST['password'] ?? '';
    if (strlen($pass) < 8) $error = 'Kata sandi minimal 8 karakter.';
    elseif ($pass !== ($_POST['password2'] ?? '')) $error = 'Konfirmasi kata sandi tidak sama.';
    else {
        q('UPDATE users SET password_hash = ? WHERE user_id = ?', 'si', password_hash($pass, PASSWORD_DEFAULT), $reset['user_id']);
        // token hanya bisa dipakai sekali
        q('UPDATE password_resets SET used = 1 WHERE user_id = ?', 'i', $reset['user_id']);
        flash('Kata sandi berhasil diganti. Silakan login dengan kata sandi baru.');
        redirect('login.php');
    }
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Buat Kata Sandi Baru — ForeCash</title>
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
            <?php if (!$reset): ?>
                <h1 class="text-2xl font-black">Link tidak berlaku</h1>
                <p class="text-sm text-slate-500">Link reset sudah kedaluwarsa (lebih dari <?= RESET_MENIT ?> menit), sudah pernah dipakai, atau salah. Minta link baru untuk melanjutkan.</p>
                <a href="lupa_password.php" class="hs-btn bg-hsOrange text-white w-full py-3 text-base">Minta link baru</a>
            <?php else: ?>
                <div class="space-y-1">
                    <h1 class="text-2xl font-black">Buat kata sandi baru</h1>
                    <p class="text-sm text-slate-500">Untuk akun <b><?= e($reset['email']) ?></b>.</p>
                </div>
                <?php if ($error): ?><p class="text-sm font-bold text-hsRed"><?= e($error) ?></p><?php endif; ?>
                <form method="post" class="space-y-4">
                    <?= csrf_field() ?>
                    <input type="hidden" name="token" value="<?= e($token) ?>">
                    <div class="space-y-1">
                        <label for="password" class="text-xs font-bold uppercase tracking-wider">Kata sandi baru</label>
                        <input id="password" type="password" name="password" required minlength="8" placeholder="Minimal 8 karakter" class="w-full px-4 py-3 border text-sm font-semibold">
                    </div>
                    <div class="space-y-1">
                        <label for="password2" class="text-xs font-bold uppercase tracking-wider">Ulangi kata sandi</label>
                        <input id="password2" type="password" name="password2" required minlength="8" placeholder="Ketik ulang" class="w-full px-4 py-3 border text-sm font-semibold">
                    </div>
                    <button class="hs-btn bg-hsOrange text-white w-full py-3.5 text-base">Simpan kata sandi</button>
                </form>
            <?php endif; ?>
        </div>
        <a href="login.php" class="text-xs font-bold text-slate-500">← Kembali ke login</a>
    </div>
</div>
</body>
</html>

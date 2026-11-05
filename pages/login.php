<?php
require_once __DIR__ . '/../includes/functions.php';
check_csrf();

if ($u = current_user()) redirect($u['role'] === 'orangtua' ? 'ortu.php' : 'dashboard.php');

$mode = ($_GET['mode'] ?? $_POST['mode'] ?? 'masuk') === 'daftar' ? 'daftar' : 'masuk';
$error = '';
$old = ['nama' => '', 'email' => '', 'role' => 'mahasiswa', 'avatar' => 'a1'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['email'] ?? '');
    $pass  = $_POST['password'] ?? '';
    $old['email'] = $email;

    if ($mode === 'daftar') {
        $nama = trim($_POST['nama'] ?? '');
        $role = ($_POST['role'] ?? '') === 'orangtua' ? 'orangtua' : 'mahasiswa';
        $old['nama'] = $nama; $old['role'] = $role; $old['avatar'] = valid_avatar($_POST['avatar'] ?? '');

        if ($nama === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) $error = 'Nama dan email yang valid wajib diisi.';
        elseif (strlen($pass) < 8) $error = 'Kata sandi minimal 8 karakter.';
        elseif (val('SELECT COUNT(*) FROM users WHERE email = ?', 's', $email)) $error = 'Email sudah digunakan.';
        else {
            $kode = $role === 'mahasiswa' ? strtoupper(substr(bin2hex(random_bytes(4)), 0, 8)) : null;
            // kata sandi disimpan sebagai hash (bcrypt), tidak pernah dalam bentuk asli
            q('INSERT INTO users (nama, email, password_hash, role, kode_hubung, avatar) VALUES (?,?,?,?,?,?)',
              'ssssss', $nama, $email, password_hash($pass, PASSWORD_DEFAULT), $role, $kode, valid_avatar($_POST['avatar'] ?? ''));
            $uid = $mysqli->insert_id;
            if ($role === 'mahasiswa') q("INSERT INTO wallets (user_id, nama, tipe) VALUES (?, 'Utama', 'tunai')", 'i', $uid);
            session_regenerate_id(true);
            $_SESSION['user_id'] = $uid;
            flash('Akun berhasil dibuat. Selamat datang di ForeCash!');
            redirect($role === 'orangtua' ? 'ortu.php' : 'dashboard.php');
        }
    } else {
        $u = row('SELECT user_id, password_hash, role FROM users WHERE email = ?', 's', $email);
        if ($u && password_verify($pass, $u['password_hash'])) {
            session_regenerate_id(true);
            $_SESSION['user_id'] = $u['user_id'];
            redirect($u['role'] === 'orangtua' ? 'ortu.php' : 'dashboard.php');
        }
        $error = 'Email atau kata sandi salah.';
    }
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= $mode === 'daftar' ? 'Registrasi' : 'Login' ?> — ForeCash</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="../assets/js/config/tw-config.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../assets/css/styles.css">
    <link rel="icon" href="../assets/img/logo.svg" type="image/svg+xml">
</head>
<body>
<div id="loginPage" class="min-h-screen flex items-center justify-center p-4">
    <div class="max-w-md w-full space-y-6 text-center">
        <img src="../assets/img/logo.svg" alt="Logo ForeCash" class="w-32 h-32 mx-auto character-bounce drop-shadow-xl">

        <div class="space-y-2">
            <h1 class="text-4xl font-black text-hsDark">ForeCash</h1>
            <p class="text-sm font-medium text-slate-600 px-4">
                Atur keuangan mahasiswa lebih tenang dengan <span class="text-hsOrange font-extrabold">Peringatan Dini</span> &amp; <span class="text-hsBlue font-extrabold">Multi-Wallet</span>.
            </p>
        </div>

        <div class="hs-card p-6 sm:p-8 space-y-5 text-left">
            <div class="flex bg-slate-100 p-1.5 rounded-2xl">
                <a href="login.php" class="w-1/2 py-2 text-sm font-bold rounded-xl text-center <?= $mode === 'masuk' ? 'bg-hsYellow text-hsDark shadow-sm' : 'text-slate-500' ?>">Login</a>
                <a href="login.php?mode=daftar" class="w-1/2 py-2 text-sm font-bold rounded-xl text-center <?= $mode === 'daftar' ? 'bg-hsYellow text-hsDark shadow-sm' : 'text-slate-500' ?>">Registrasi</a>
            </div>

            <?php if ($error): ?><p class="text-sm font-bold text-hsRed"><?= e($error) ?></p><?php endif; ?>

            <form method="post" class="space-y-4">
                <?= csrf_field() ?>
                <input type="hidden" name="mode" value="<?= $mode ?>">
                <?php if ($mode === 'daftar'): ?>
                    <div class="space-y-1">
                        <label for="role" class="text-xs font-bold uppercase tracking-wider">Daftar Sebagai</label>
                        <select id="role" name="role" class="w-full px-4 py-3 border text-sm font-semibold">
                            <option value="mahasiswa" <?= $old['role'] === 'mahasiswa' ? 'selected' : '' ?>>🎓 Mahasiswa</option>
                            <option value="orangtua" <?= $old['role'] === 'orangtua' ? 'selected' : '' ?>>👨‍👩‍👧 Orang Tua / Wali</option>
                        </select>
                    </div>
                    <div class="space-y-1">
                        <label for="nama" class="text-xs font-bold uppercase tracking-wider">Nama Lengkap</label>
                        <input id="nama" name="nama" required value="<?= e($old['nama']) ?>" placeholder="Nama lengkap" class="w-full px-4 py-3 border text-sm font-semibold">
                    </div>
                    <div class="space-y-1">
                        <p class="text-xs font-bold uppercase tracking-wider">Pilih Avatar</p>
                        <?= avatar_picker($old['avatar']) ?>
                    </div>
                <?php endif; ?>
                <div class="space-y-1">
                    <label for="email" class="text-xs font-bold uppercase tracking-wider">Email</label>
                    <input id="email" type="email" name="email" required value="<?= e($old['email']) ?>" placeholder="nama@student.umn.ac.id" class="w-full px-4 py-3 border text-sm font-semibold">
                </div>
                <div class="space-y-1">
                    <label for="password" class="text-xs font-bold uppercase tracking-wider">Kata Sandi</label>
                    <input id="password" type="password" name="password" required <?= $mode === 'daftar' ? 'minlength="8"' : '' ?> placeholder="••••••••" class="w-full px-4 py-3 border text-sm font-semibold">
                </div>
                <button class="hs-btn bg-hsOrange text-white w-full py-3.5 text-base"><?= $mode === 'daftar' ? 'Buat Akun' : 'Masuk' ?></button>
            </form>
        </div>
        <a href="../index.php" class="text-xs font-bold text-slate-500">← Kembali ke beranda</a>
    </div>
</div>
</body>
</html>

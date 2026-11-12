<?php
require_once __DIR__ . '/../includes/functions.php';
$user = require_login();
$uid = $user['user_id'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $aksi = $_POST['aksi'] ?? '';
    if ($aksi === 'profil') {
        $nama = trim($_POST['nama'] ?? ''); $email = trim($_POST['email'] ?? '');
        if ($nama === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) flash('!Nama dan email yang valid wajib diisi.');
        elseif (val('SELECT COUNT(*) FROM users WHERE email = ? AND user_id <> ?', 'si', $email, $uid)) flash('!Email sudah dipakai akun lain.');
        else {
            q('UPDATE users SET nama = ?, email = ?, avatar = ? WHERE user_id = ?', 'sssi', $nama, $email, valid_avatar($_POST['avatar'] ?? ''), $uid);
            flash('Profil diperbarui.');
        }
    } elseif ($aksi === 'password') {
        $hash = val('SELECT password_hash FROM users WHERE user_id = ?', 'i', $uid);
        if (!password_verify($_POST['lama'] ?? '', $hash)) flash('!Kata sandi lama salah.');
        elseif (strlen($_POST['baru'] ?? '') < 8) flash('!Kata sandi baru minimal 8 karakter.');
        else { q('UPDATE users SET password_hash = ? WHERE user_id = ?', 'si', password_hash($_POST['baru'], PASSWORD_DEFAULT), $uid); flash('Kata sandi diganti.'); }
    } elseif ($aksi === 'kode_baru' && $user['role'] === 'mahasiswa') {
        q('UPDATE users SET kode_hubung = ? WHERE user_id = ?', 'si', strtoupper(substr(bin2hex(random_bytes(4)), 0, 8)), $uid);
        flash('Kode hubung baru dibuat. Kode lama tidak berlaku lagi.');
    } elseif ($aksi === 'putus' && $user['role'] === 'mahasiswa') {
        q('DELETE FROM parent_links WHERE link_id = ? AND student_id = ?', 'ii', (int)$_POST['id'], $uid);
        flash('Akses orang tua dicabut.');
    }
    redirect('akun.php');
}

$ortu = $user['role'] === 'mahasiswa'
    ? rows('SELECT l.link_id, u.nama, u.email FROM parent_links l JOIN users u ON u.user_id = l.parent_id WHERE l.student_id = ?', 'i', $uid) : [];

$title = 'Akun'; $active = 'akun';
require __DIR__ . '/../includes/layout/header.php';
?>
<div>
    <p class="text-xs text-slate-500">Kelola profil, kata sandi, dan akses orang tua.</p>
</div>

<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div class="space-y-6">
        <form method="post" class="hs-card p-6 space-y-3">
            <?= csrf_field() ?>
            <h4 class="text-sm font-black border-b pb-2">Profil</h4>
            <div><label for="an" class="text-xs font-bold">Nama</label><input id="an" name="nama" value="<?= e($user['nama']) ?>" required class="w-full px-3 py-2 text-xs border"></div>
            <div><label for="ae" class="text-xs font-bold">Email</label><input id="ae" type="email" name="email" value="<?= e($user['email']) ?>" required class="w-full px-3 py-2 text-xs border"></div>
            <div><p class="text-xs font-bold mb-1">Avatar</p><?= avatar_picker($user['avatar']) ?></div>
            <p class="text-[11px] text-slate-500">Role: <b><?= $user['role'] === 'orangtua' ? 'Orang Tua' : 'Mahasiswa' ?></b></p>
            <button name="aksi" value="profil" class="hs-btn bg-hsBlue text-white w-full py-2 text-xs">Simpan Profil</button>
        </form>
        <form method="post" class="hs-card p-6 space-y-3">
            <?= csrf_field() ?>
            <h4 class="text-sm font-black border-b pb-2">Ganti Kata Sandi</h4>
            <input type="password" name="lama" required placeholder="Kata sandi lama" class="w-full px-3 py-2 text-xs border">
            <input type="password" name="baru" required minlength="8" placeholder="Kata sandi baru (min. 8)" class="w-full px-3 py-2 text-xs border">
            <button name="aksi" value="password" class="hs-btn bg-slate-800 text-white w-full py-2 text-xs">Ganti</button>
        </form>
        <a href="logout.php" class="hs-btn bg-hsRed text-white w-full py-2.5 text-xs block text-center">Keluar Akun</a>
    </div>

    <div class="lg:col-span-2 space-y-6">
        <?php if ($user['role'] === 'mahasiswa'): ?>
        <div class="hs-card p-6 space-y-3">
            <h4 class="text-sm font-black border-b pb-2"><i class="fa-solid fa-link text-hsPurple"></i> Hubungkan dengan Orang Tua</h4>
            <p class="text-xs text-slate-600">Bagikan kode ini ke orang tua. Setelah memasukkan kode di akunnya, orang tua dapat melihat ringkasan keuanganmu tanpa bisa mengubah data.</p>
            <div class="flex flex-wrap items-center gap-3">
                <span class="text-2xl font-black tracking-[.3em] bg-purple-50 text-hsPurple px-4 py-2 rounded-2xl"><?= e($user['kode_hubung']) ?></span>
                <form method="post"><?= csrf_field() ?><button name="aksi" value="kode_baru" class="hs-btn bg-slate-200 px-3 py-2 text-xs">Buat kode baru</button></form>
            </div>
            <?php foreach ($ortu as $o): ?>
                <form method="post" class="flex justify-between items-center bg-slate-50 rounded-2xl px-4 py-2">
                    <?= csrf_field() ?><input type="hidden" name="id" value="<?= $o['link_id'] ?>">
                    <span class="text-xs"><b><?= e($o['nama']) ?></b> · <?= e($o['email']) ?></span>
                    <button name="aksi" value="putus" onclick="return confirm('Cabut akses orang tua ini?')" class="text-xs font-bold text-hsRed">Cabut akses</button>
                </form>
            <?php endforeach; ?>
        </div>
        <?php endif; ?>

        <div class="hs-card p-6 space-y-3 text-xs">
            <h4 class="text-sm font-black border-b pb-2">Bantuan & FAQ</h4>
            <div class="p-3 bg-slate-50 rounded-2xl"><p class="font-bold">Bagaimana ForeCash menghitung tanggal saldo habis?</p>
                <p class="text-slate-600">Total saldo dibagi burn rate, yaitu rata-rata pengeluaran harian dalam 14 hari terakhir. Hasilnya dibandingkan dengan jadwal pemasukan berikutnya.</p></div>
            <div class="p-3 bg-slate-50 rounded-2xl"><p class="font-bold">Apakah wallet wajib diisi?</p>
                <p class="text-slate-600">Tidak. Semua transaksi otomatis masuk ke wallet "Utama". Tambah wallet lain hanya jika ingin memisahkan tunai, bank, dan e-wallet.</p></div>
            <div class="p-3 bg-slate-50 rounded-2xl"><p class="font-bold">Kenapa isi e-wallet dari rekening tidak dicatat sebagai pengeluaran?</p>
                <p class="text-slate-600">Gunakan jenis "Transfer". Uang hanya berpindah tempat, jadi tidak mengubah total saldo maupun burn rate.</p></div>
            <div class="p-3 bg-slate-50 rounded-2xl"><p class="font-bold">Apa yang bisa dilihat orang tua?</p>
                <p class="text-slate-600">Status peringatan, total saldo, burn rate, transaksi terakhir, dan laporan bulanan. Orang tua tidak dapat menambah atau mengubah data.</p></div>
            <div class="p-3 bg-slate-50 rounded-2xl"><p class="font-bold">Apakah ForeCash terhubung ke rekening bank atau e-wallet?</p>
                <p class="text-slate-600">Tidak. Semua transaksi dicatat manual sehingga data rekening tetap aman.</p></div>
        </div>
    </div>
</div>
<?php require __DIR__ . '/../includes/layout/footer.php'; ?>

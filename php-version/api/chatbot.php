<?php
/* ForeCash Assistant: chatbot berbasis aturan.
   Menerima POST {pesan, csrf} dari assets/js/chatbot.js dan membalas JSON {jawaban}.
   Jawaban dihitung dari data pengguna yang sedang login. */
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/report.php';

$user = current_user();
if (!$user || $user['role'] !== 'mahasiswa') json_out(['error' => 'Silakan login sebagai mahasiswa.'], 401);
if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !hash_equals(csrf_token(), $_POST['csrf'] ?? '')) json_out(['error' => 'Permintaan tidak valid.'], 400);

$pesan = mb_substr(trim($_POST['pesan'] ?? ''), 0, 200);
json_out(['jawaban' => jawab_bot($user, $pesan)]);

function jawab_bot($user, $teks) {
    $q = mb_strtolower($teks);
    $uid = $user['user_id'];
    $f = forecast($uid);
    $ada = function (...$kata) use ($q) { foreach ($kata as $k) if (str_contains($q, $k)) return true; return false; };

    if ($ada('saldo', 'uang aku', 'uangku', 'duit') && !$ada('habis', 'kapan', 'cukup')) {
        $baris = array_map(fn($w) => '• ' . e($w['nama']) . ': ' . rupiah($w['saldo']), wallets_with_balance($uid));
        return 'Total saldomu <b>' . rupiah($f['saldo']) . '</b>.<br>' . implode('<br>', $baris);
    }
    if ($ada('habis', 'kapan', 'runway', 'cukup', 'aman')) {
        if ($f['burn'] <= 0) return 'Belum ada pengeluaran yang tercatat, jadi tanggal saldo habis belum bisa diprediksi.';
        $s = 'Dengan pengeluaran rata-rata <b>' . rupiah($f['burn']) . '/hari</b>, saldomu diperkirakan habis <b>' . tgl($f['habis']) . "</b> ({$f['runway']} hari lagi).";
        if ($f['next']) $s .= ' Pemasukan berikutnya ' . tgl($f['next']['tanggal_perkiraan']) . ', jadi statusmu <b>' . strtoupper($f['status']) . '</b>.';
        if ($f['status'] !== 'aman' && $f['batas_aman']) $s .= ' Supaya aman, batasi pengeluaran maksimal <b>' . rupiah($f['batas_aman']) . '/hari</b>.';
        return $s;
    }
    if ($ada('hemat', 'tips', 'saran', 'boros', 'kategori', 'paling banyak')) {
        $r = report_data($uid, date('Y-m'));
        if (!$r['perKategori']) return 'Belum ada pengeluaran bulan ini. Mulai catat dulu, nanti aku kasih saran berdasarkan datamu.';
        $top = $r['perKategori'][0];
        $pct = round($top['total'] / $r['keluar'] * 100);
        $tips = [
            'Makan & Minum' => 'Coba bawa bekal 2–3 kali seminggu atau batasi jajan kopi.',
            'Transportasi'  => 'Gabungkan perjalanan atau pakai transportasi umum untuk rute rutin.',
            'Hiburan'       => 'Tentukan jatah hiburan per minggu dan catat setiap kali dipakai.',
            'Kos / Sewa'    => 'Ini biaya tetap, jadi fokuskan penghematan di kategori lain.',
        ][$top['kategori']] ?? 'Coba tetapkan batas khusus untuk kategori ini setiap minggu.';
        return 'Bulan ini pengeluaran terbesarmu di <b>' . e($top['kategori']) . '</b>: ' . rupiah($top['total']) . " ($pct% dari total). $tips";
    }
    if ($ada('burn', 'rata-rata', 'per hari', 'harian')) {
        return 'Burn rate-mu <b>' . rupiah($f['burn']) . "/hari</b>, dihitung dari total pengeluaran {$f['hari']} hari terakhir dibagi {$f['hari']}. Transfer antar wallet tidak ikut dihitung.";
    }
    if ($ada('utang', 'piutang', 'pinjam', 'nagih', 'patungan')) {
        $d = rows("SELECT arah, COUNT(*) AS n, SUM(nominal) AS total FROM debts WHERE user_id = ? AND status = 'belum' GROUP BY arah", 'i', $uid);
        if (!$d) return 'Tidak ada utang atau piutang yang belum lunas. Mantap!';
        $by = array_column($d, null, 'arah');
        return 'Piutang (teman ke kamu): <b>' . rupiah($by['piutang']['total'] ?? 0) . '</b> dari ' . ($by['piutang']['n'] ?? 0) . ' catatan.<br>'
             . 'Utang (kamu ke teman): <b>' . rupiah($by['utang']['total'] ?? 0) . '</b> dari ' . ($by['utang']['n'] ?? 0) . ' catatan.<br>'
             . 'Kirim pengingat lewat menu <a href="utang.php" class="underline font-bold">Utang & Patungan</a>.';
    }
    if ($ada('badge', 'level', 'poin', 'streak', 'pencapaian')) {
        $g = gamify($user, $f);
        $dapat = count(array_filter($g['badges'], fn($b) => $b['dapat']));
        return "Kamu di <b>Level {$g['level']} · {$g['levelNama']}</b> ({$g['poin']} poin), streak <b>{$g['streak']} hari</b>, dan sudah dapat $dapat dari "
             . count($g['badges']) . ' badge. Lihat detail di <a href="pencapaian.php" class="underline font-bold">Pencapaian</a>.';
    }
    if ($ada('transfer', 'wallet', 'dompet', 'gopay', 'bca', 'e-wallet')) {
        return 'Untuk isi e-wallet dari rekening, catat sebagai <b>Transfer</b> di menu Transaksi. Cukup sekali catat, dan tidak dihitung sebagai pengeluaran sehingga burn rate tetap akurat.';
    }
    if ($ada('struk', 'foto', 'bukti')) {
        return 'Saat mencatat transaksi, pilih <b>Foto struk</b> (JPG/PNG/WEBP, maks. 2 MB). Ikon struk akan muncul di riwayat dan bisa diklik untuk melihat fotonya.';
    }
    if ($ada('catat', 'tambah', 'input', 'cara')) {
        return 'Buka menu <a href="transaksi.php#form" class="underline font-bold">Transaksi</a>, pilih jenis, isi nominal, kategori, dan tanggal, lalu Simpan. Wallet boleh dikosongkan, otomatis masuk ke "Utama".';
    }
    if ($ada('halo', 'hai', 'hi', 'pagi', 'siang', 'malam')) {
        return 'Halo ' . e(explode(' ', $user['nama'])[0]) . '! Mau cek saldo, kapan uang habis, atau minta tips hemat?';
    }
    return 'Maaf, aku belum paham pertanyaan itu. Coba tanya soal <b>saldo</b>, <b>kapan uang habis</b>, <b>tips hemat</b>, <b>utang</b>, atau <b>pencapaian</b>.';
}

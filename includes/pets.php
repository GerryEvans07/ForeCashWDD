<?php
/* Teman Hemat: hewan peliharaan yang menetas dari telur.
   Telur menetas setelah 7 "hari baik" (mencatat transaksi dan tidak melewati batas harian).
   Hewan yang sudah menetas disimpan di tabel user_pets, beserta tanggal menetasnya. */

const TELUR_TARGET = 7;

// [nama, warna badan, warna gelap, bentuk telinga/hiasan, sifat, cerita singkat]
const PETS = [
    'celeng' => ['Celeng',  '#FFB3C7', '#F28AA8', 'pig',   'Rajin menabung',   'Celengan yang bisa berjalan. Setiap koin yang kamu simpan bikin perutnya makin bulat.'],
    'mochi'  => ['Mochi',   '#FFFFFF', '#E3DCEB', 'bunny', 'Lembut dan sabar', 'Tidak pernah buru-buru belanja. Selalu tidur dulu sebelum memutuskan sesuatu.'],
    'kopi'   => ['Kopi',    '#C99A6E', '#A5764C', 'bear',  'Pekerja keras',    'Suka begadang menemani kamu mengerjakan tugas, tapi tidak suka jajan kopi mahal.'],
    'jeruk'  => ['Jeruk',   '#FFB347', '#F08A1C', 'leaf',  'Ceria',            'Saudara jauh logo ForeCash. Muncul setiap kali saldomu aman sampai akhir bulan.'],
    'boba'   => ['Boba',    '#B9A3F5', '#9A80EA', 'cat',   'Penasaran',        'Suka mengintip isi dompet. Kalau melihat struk, langsung dicatat.'],
    'lumut'  => ['Lumut',   '#9BE0A3', '#6CC47A', 'frog',  'Santai',           'Hidup di kolam dekat jalan. Melompat setiap kali kamu melunasi utang.'],
    'awan'   => ['Awan',    '#D7ECFF', '#B4D6F7', 'cloud', 'Penyayang',        'Datang saat langit mendung untuk menghibur. Percaya hujan pasti berhenti.'],
    'tahu'   => ['Tahu',    '#FFE680', '#F5CB2E', 'tuft',  'Hemat',            'Kecil tapi teliti. Tahu persis harga gorengan di setiap kantin kampus.'],
    'sapi'   => ['Sapi',    '#FFFFFF', '#DCD6CC', 'cow',   'Tenang',           'Tidak pernah panik walau saldo menipis. Selalu punya rencana cadangan.'],
    'kunyit' => ['Kunyit',  '#FF9A5C', '#E8742F', 'fox',   'Cerdik',           'Jago mencari promo dan diskon mahasiswa di sekitar kampus.'],
    'ubi'    => ['Ubi',     '#C79BD9', '#A773BE', 'tuft',  'Sederhana',        'Bahagia dengan hal kecil. Bekal dari rumah adalah makanan favoritnya.'],
    'tempe'  => ['Tempe',   '#F2D3A0', '#DDB173', 'bear',  'Setia kawan',      'Selalu ingat siapa yang belum bayar patungan, tapi menagihnya dengan sopan.'],
];

/* Membuat tabel user_pets otomatis jika belum ada (database lama sebelum fitur Petualangan),
   supaya halaman tidak error walaupun update_petualangan.sql belum di-import. */
function pastikan_tabel_pets() {
    static $sudah = false;
    if ($sudah) return;
    global $mysqli;
    $mysqli->query("CREATE TABLE IF NOT EXISTS user_pets (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        pet_id VARCHAR(20) NOT NULL,
        menetas_pada DATE NOT NULL,
        dipakai TINYINT(1) NOT NULL DEFAULT 0,
        UNIQUE KEY uq_pet (user_id, pet_id),
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    ) ENGINE=InnoDB");
    $sudah = true;
}

function pet_svg($id, $size = 64, $extra = '') {
    $p = PETS[$id] ?? PETS['celeng'];
    [$nama, $c, $d, $tipe] = $p;
    $ink = '#2D2216';
    $ear = [
        'pig'   => "<path d='M26 30 L22 14 L38 24 Z M74 30 L78 14 L62 24 Z' fill='$d'/>",
        'bunny' => "<ellipse cx='36' cy='16' rx='8' ry='20' fill='$c' stroke='$d' stroke-width='3'/><ellipse cx='64' cy='16' rx='8' ry='20' fill='$c' stroke='$d' stroke-width='3'/><ellipse cx='36' cy='18' rx='3.5' ry='12' fill='#FFC4D6'/><ellipse cx='64' cy='18' rx='3.5' ry='12' fill='#FFC4D6'/>",
        'bear'  => "<circle cx='26' cy='30' r='11' fill='$d'/><circle cx='74' cy='30' r='11' fill='$d'/><circle cx='26' cy='30' r='5' fill='$c'/><circle cx='74' cy='30' r='5' fill='$c'/>",
        'leaf'  => "<path d='M50 26 C50 18 52 12 56 8' stroke='#2E8B57' stroke-width='4' fill='none' stroke-linecap='round'/><path d='M55 12 C64 2 78 6 80 12 C70 20 60 18 55 12Z' fill='#4CC283'/>",
        'cat'   => "<path d='M22 36 L24 12 L42 26 Z M78 36 L76 12 L58 26 Z' fill='$c' stroke='$d' stroke-width='3' stroke-linejoin='round'/>",
        'frog'  => "<circle cx='32' cy='26' r='12' fill='$c' stroke='$d' stroke-width='3'/><circle cx='68' cy='26' r='12' fill='$c' stroke='$d' stroke-width='3'/>",
        'cloud' => "<circle cx='30' cy='38' r='14' fill='$c'/><circle cx='50' cy='28' r='17' fill='$c'/><circle cx='70' cy='38' r='14' fill='$c'/>",
        'tuft'  => "<path d='M44 24 C44 14 52 12 54 18 C56 10 64 12 60 22' stroke='$d' stroke-width='4' fill='none' stroke-linecap='round'/>",
        'cow'   => "<path d='M20 34 C10 28 10 22 18 22 C24 22 28 28 30 32 Z M80 34 C90 28 90 22 82 22 C76 22 72 28 70 32 Z' fill='$d'/><path d='M34 24 C32 16 36 14 38 18 M66 24 C68 16 64 14 62 18' stroke='#C9A36A' stroke-width='4' fill='none' stroke-linecap='round'/>",
        'fox'   => "<path d='M22 38 L20 10 L44 28 Z M78 38 L80 10 L56 28 Z' fill='$c' stroke='$d' stroke-width='3' stroke-linejoin='round'/><path d='M24 32 L23 18 L36 28 Z M76 32 L77 18 L64 28 Z' fill='#FFF1E5'/>",
    ][$tipe] ?? '';
    $spot = $tipe === 'cow' ? "<ellipse cx='32' cy='66' rx='9' ry='7' fill='#5A4636' opacity='.85'/><ellipse cx='72' cy='52' rx='7' ry='6' fill='#5A4636' opacity='.85'/>" : '';
    $snout = $tipe === 'pig' ? "<ellipse cx='50' cy='70' rx='10' ry='7' fill='$d'/><circle cx='46' cy='70' r='2' fill='$ink'/><circle cx='54' cy='70' r='2' fill='$ink'/>" : "<path d='M45 70 Q50 75 55 70' stroke='$ink' stroke-width='3' fill='none' stroke-linecap='round'/>";
    $belly = $tipe === 'fox' || $tipe === 'bear' ? "<ellipse cx='50' cy='76' rx='18' ry='12' fill='#FFF6E8' opacity='.8'/>" : '';
    $h = $size;
    return "<svg viewBox='0 0 100 100' width='$size' height='$h' role='img' aria-label='$nama' $extra>
      <ellipse cx='50' cy='94' rx='30' ry='5' fill='#000' opacity='.12'/>
      $ear
      <ellipse cx='50' cy='60' rx='38' ry='33' fill='$c'/>
      <ellipse cx='50' cy='60' rx='38' ry='33' fill='none' stroke='$d' stroke-width='3'/>
      <ellipse cx='38' cy='44' rx='12' ry='6' fill='#fff' opacity='.5' transform='rotate(-20 38 44)'/>
      $spot $belly
      <circle cx='37' cy='58' r='5.5' fill='$ink' class='hs-eye'/><circle cx='63' cy='58' r='5.5' fill='$ink' class='hs-eye'/>
      <circle cx='35.5' cy='56' r='2' fill='#fff'/><circle cx='61.5' cy='56' r='2' fill='#fff'/>
      <ellipse cx='27' cy='68' rx='6' ry='3.5' fill='#FF7FA0' opacity='.45'/><ellipse cx='73' cy='68' rx='6' ry='3.5' fill='#FF7FA0' opacity='.45'/>
      $snout
    </svg>";
}

function egg_svg($progress, $size = 120) {
    $retak = '';
    if ($progress >= 3) $retak .= "<path d='M38 58 L46 64 L42 70 L50 74' stroke='#8C6A3F' stroke-width='3' fill='none' stroke-linecap='round'/>";
    if ($progress >= 5) $retak .= "<path d='M62 46 L56 52 L62 58 L56 62' stroke='#8C6A3F' stroke-width='3' fill='none' stroke-linecap='round'/>";
    return "<svg viewBox='0 0 100 110' width='$size' height='" . round($size * 1.1) . "' aria-hidden='true'>
      <ellipse cx='50' cy='104' rx='30' ry='5' fill='#000' opacity='.12'/>
      <path d='M50 6 C74 6 88 44 88 66 C88 90 70 102 50 102 C30 102 12 90 12 66 C12 44 26 6 50 6Z' fill='#FFF3D6' stroke='#E9D29A' stroke-width='3'/>
      <circle cx='34' cy='40' r='7' fill='#FFC83D'/><circle cx='64' cy='30' r='5' fill='#FF8A1F'/><circle cx='70' cy='72' r='8' fill='#8B6CF0' opacity='.7'/><circle cx='30' cy='80' r='5' fill='#2EBD74' opacity='.7'/>
      <ellipse cx='36' cy='28' rx='8' ry='14' fill='#fff' opacity='.7' transform='rotate(25 36 28)'/>
      $retak
    </svg>";
}

/* Status telur & koleksi. Menetaskan telur otomatis jika progres sudah penuh.
   Hasil: owned (pet_id => tanggal), dipakai, progress, hariBaik (tanggal => true), baru (pet yang baru menetas) */
function pet_state($user) {
    pastikan_tabel_pets();
    $uid = $user['user_id'];
    $owned = [];
    $dipakai = null;
    foreach (rows('SELECT pet_id, menetas_pada, dipakai FROM user_pets WHERE user_id = ? ORDER BY menetas_pada, id', 'i', $uid) as $r) {
        if (!isset(PETS[$r['pet_id']])) continue;
        $owned[$r['pet_id']] = $r['menetas_pada'];
        if ($r['dipakai']) $dipakai = $r['pet_id'];
    }
    $hariBaik = hari_baik($user);
    $sejak = $owned ? max($owned) : '0000-00-00';
    $progress = count(array_filter(array_keys($hariBaik), fn($d) => $d > $sejak));

    $baru = null;
    if ($progress >= TELUR_TARGET && count($owned) < count(PETS)) {
        $sisa = array_values(array_diff(array_keys(PETS), array_keys($owned)));
        $baru = $sisa[random_int(0, count($sisa) - 1)];
        q('INSERT IGNORE INTO user_pets (user_id, pet_id, menetas_pada, dipakai) VALUES (?, ?, CURDATE(), ?)', 'isi', $uid, $baru, $dipakai ? 0 : 1);
        $owned[$baru] = date('Y-m-d');
        if (!$dipakai) $dipakai = $baru;
        $progress = 0;
    }
    return compact('owned', 'dipakai', 'progress', 'hariBaik', 'baru');
}

/* hari baik = ada transaksi tercatat dan pengeluaran hari itu tidak melewati batas harian (jika batas diatur) */
function hari_baik($user) {
    $batas = (float)$user['batas_harian'];
    $hasil = [];
    foreach (rows("SELECT tanggal, SUM(CASE WHEN jenis = 'pengeluaran' THEN nominal ELSE 0 END) AS keluar
                   FROM transactions WHERE user_id = ? AND tanggal > DATE_SUB(CURDATE(), INTERVAL 120 DAY)
                   GROUP BY tanggal", 'i', $user['user_id']) as $r) {
        if ($batas <= 0 || $r['keluar'] <= $batas) $hasil[$r['tanggal']] = true;
    }
    return $hasil;
}

function pet_dipakai($uid) {
    pastikan_tabel_pets();
    $id = val('SELECT pet_id FROM user_pets WHERE user_id = ? AND dipakai = 1 LIMIT 1', 'i', $uid);
    return isset(PETS[$id]) ? $id : null;
}

<?php
/* Peta Petualangan: jalan berliku dari pemasukan terakhir sampai pemasukan berikutnya.
   Satu titik = satu hari. Hari yang lewat diberi tanda baik/boros/kosong,
   hari ke depan diberi tanda cukup/kurang berdasarkan prediksi saldo. */

function journey_data($user, $f, $hariBaik) {
    $uid = $user['user_id'];
    $today = date('Y-m-d');
    $akhir = $f['next']['tanggal_perkiraan'] ?? date('Y-m-d', strtotime('+14 day'));
    $mulai = val("SELECT MAX(tanggal) FROM transactions WHERE user_id = ? AND jenis = 'pemasukan' AND tanggal <= CURDATE()", 'i', $uid)
          ?: date('Y-m-d', strtotime('-6 day'));
    // jaga panjang peta tetap wajar (maks. 35 titik), hari ini selalu terlihat
    if ((strtotime($akhir) - strtotime($mulai)) / 86400 > 34) $mulai = max(date('Y-m-d', strtotime($akhir . ' -34 day')), date('Y-m-d', strtotime('-20 day')));
    if ((strtotime($akhir) - strtotime($mulai)) / 86400 > 34) $akhir = date('Y-m-d', strtotime($mulai . ' +34 day'));

    $keluar = [];
    foreach (rows("SELECT tanggal, SUM(nominal) AS total FROM transactions WHERE user_id = ? AND jenis = 'pengeluaran' AND tanggal BETWEEN ? AND ? GROUP BY tanggal", 'iss', $uid, $mulai, $today) as $r)
        $keluar[$r['tanggal']] = (float)$r['total'];
    $dicatat = array_flip(array_column(rows('SELECT DISTINCT tanggal FROM transactions WHERE user_id = ? AND tanggal BETWEEN ? AND ?', 'iss', $uid, $mulai, $today), 'tanggal'));

    $habis = $f['runway'] !== null ? date('Y-m-d', strtotime("+{$f['runway']} day")) : null;
    $hari = [];
    for ($d = $mulai; $d <= $akhir; $d = date('Y-m-d', strtotime($d . ' +1 day'))) {
        if ($d === $akhir && $f['next']) $s = 'gajian';
        elseif ($d === $today) $s = 'hariini';
        elseif ($d < $today) $s = isset($hariBaik[$d]) ? 'baik' : (isset($dicatat[$d]) ? 'boros' : 'kosong');
        else $s = ($f['saldo'] > 0 && ($habis === null || $d <= $habis)) ? 'cukup' : 'kurang';
        $hari[] = ['tanggal' => $d, 'status' => $s, 'keluar' => $keluar[$d] ?? 0];
    }
    return ['hari' => $hari, 'mulai' => $mulai, 'akhir' => $akhir, 'adaJadwal' => (bool)$f['next']];
}

/* gambar peta sebagai satu SVG. $cols = jumlah titik per baris */
function journey_svg($j, $cols, $W, $rowH, $tema, $avatarId, $pets, $dipakai) {
    $n = count($j['hari']);
    $mx = $W * 0.1; $top = 90;
    $rows = (int)ceil($n / $cols);
    $H = $top + ($rows - 1) * $rowH + 110;
    $step = ($W - 2 * $mx) / max(1, $cols - 1);
    $pos = [];
    foreach ($j['hari'] as $i => $h) {
        $r = intdiv($i, $cols); $c = $i % $cols;
        if ($r % 2) $c = $cols - 1 - $c;
        $pos[] = [$mx + $c * $step, $top + $r * $rowH];
    }
    // jalan: garis lurus per baris, belokan setengah lingkaran di ujung
    $d = 'M' . round($pos[0][0]) . ' ' . $pos[0][1];
    for ($i = 1; $i < $n; $i++) {
        [$x, $y] = $pos[$i]; [$px, $py] = $pos[$i - 1];
        if ($y !== $py) {
            $sweep = intdiv($i - 1, $cols) % 2 ? 0 : 1;
            $d .= ' A' . ($rowH / 2) . ' ' . ($rowH / 2) . " 0 0 $sweep " . round($px) . " $y";
            if (round($px) != round($x)) $d .= ' L' . round($x) . " $y";
        } else $d .= ' L' . round($x) . " $y";
    }

    $t = [
        'aman'    => ['ground' => '#CFEFC9', 'road' => '#92D6A6', 'line' => '#FFFFFF', 'deco' => 'meadow'],
        'waspada' => ['ground' => '#FFE6A8', 'road' => '#F2C46D', 'line' => '#FFF6DA', 'deco' => 'autumn'],
        'kritis'  => ['ground' => '#E3ECF8', 'road' => '#FFFFFF', 'line' => '#B9C8E0', 'deco' => 'winter'],
    ][$tema];

    ob_start(); ?>
    <svg class="fc-map-svg" viewBox="0 0 <?= $W ?> <?= $H ?>" role="img" aria-label="Peta perjalanan menuju pemasukan berikutnya">
        <defs><radialGradient id="fcCoin" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#FFE7A0"/><stop offset=".55" stop-color="#FFB23E"/><stop offset="1" stop-color="#E8860E"/></radialGradient></defs>
        <rect width="<?= $W ?>" height="<?= $H ?>" fill="<?= $t['ground'] ?>"/>
        <?= journey_deco($t['deco'], $W, $H, $rowH, $top, $rows) ?>
        <path d="<?= $d ?>" stroke="<?= $t['road'] ?>" stroke-width="<?= $cols > 5 ? 40 : 34 ?>" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="<?= $d ?>" stroke="<?= $t['line'] ?>" stroke-width="4" fill="none" stroke-dasharray="14 14" stroke-linecap="round"/>

        <?php foreach ($j['hari'] as $i => $h):
            [$x, $y] = $pos[$i]; $x = round($x);
            $tgl = strtotime($h['tanggal']);
            $label = date('j', $tgl) . ($i === 0 || date('j', $tgl) == 1 ? ' ' . ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][(int)date('n', $tgl)] : '');
            $info = tgl($h['tanggal']) . ' — ' . [
                'baik' => 'hari baik', 'boros' => 'melewati batas harian', 'kosong' => 'tidak mencatat', 'hariini' => 'hari ini',
                'cukup' => 'saldo diperkirakan cukup', 'kurang' => 'saldo diperkirakan habis', 'gajian' => 'pemasukan datang'][$h['status']]
                . ($h['keluar'] ? ', keluar ' . rupiah($h['keluar']) : ''); ?>
            <g class="fc-node fc-node-<?= $h['status'] ?>" transform="translate(<?= $x ?> <?= $y ?>)">
                <title><?= e($info) ?></title>
                <?php if ($h['status'] === 'gajian'): ?>
                    <circle r="30" fill="#2EBD74" stroke="#fff" stroke-width="5"/>
                    <text y="10" text-anchor="middle" font-size="28">🏁</text>
                    <rect x="-46" y="38" width="92" height="24" rx="12" fill="#fff"/>
                    <text y="55" text-anchor="middle" class="fc-node-label" fill="#1F9A5C">Uang saku</text>
                <?php elseif ($h['status'] === 'hariini'): ?>
                    <circle r="28" fill="#fff" stroke="#FF8A1F" stroke-width="5"/>
                    <circle r="36" fill="none" stroke="#FF8A1F" stroke-width="3" opacity=".35" class="fc-pulse"/>
                    <g class="fc-map-me"><svg x="-34" y="-92" width="68" height="74" viewBox="0 0 100 108"><?= preg_replace('/^<svg[^>]*>|<\/svg>$/', '', trim(avatar_svg($avatarId, mood_for($tema), 100))) ?></svg></g>
                    <?php if ($dipakai): ?><g class="fc-map-buddy"><?= pet_svg($dipakai, 40, "x='22' y='-64'") ?></g><?php endif; ?>
                    <text y="7" text-anchor="middle" class="fc-node-num" fill="#E06A00"><?= date('j', $tgl) ?></text>
                    <rect x="-36" y="34" width="72" height="22" rx="11" fill="#FF8A1F"/>
                    <text y="50" text-anchor="middle" class="fc-node-label" fill="#fff">Hari ini</text>
                <?php else:
                    $st = [
                        'baik'   => ['url(#fcCoin)', '#E8860E', '', '✓', '#7A3E00'],
                        'boros'  => ['#FF8F8F', '#E25555', '', '!', '#fff'],
                        'kosong' => ['#F2EDE4', '#CFC6B5', '6 5', '', ''],
                        'cukup'  => ['#FFFFFF', '#F5C04A', '', '', ''],
                        'kurang' => ['#FFE5E5', '#FF5B5B', '6 5', '', ''],
                    ][$h['status']]; ?>
                    <circle r="20" fill="<?= $st[0] ?>" stroke="<?= $st[1] ?>" stroke-width="4" <?= $st[2] ? "stroke-dasharray='{$st[2]}'" : '' ?>/>
                    <?php if ($st[3]): ?><text y="7" text-anchor="middle" class="fc-node-mark" fill="<?= $st[4] ?>"><?= $st[3] ?></text><?php endif; ?>
                    <text y="40" text-anchor="middle" class="fc-node-label" fill="#5B4A36"><?= $label ?></text>
                <?php endif; ?>
            </g>
        <?php endforeach; ?>

        <?php // hewan peliharaan jalan-jalan di sekitar jalan
        $k = 0;
        foreach (array_keys($pets) as $pid):
            if ($pid === $dipakai) continue;
            $i = (int)min($n - 1, round(($k * 2 + 1) * $n / (2 * max(1, count($pets))))); $k++;
            [$x, $y] = $pos[$i];
            if ($y + $rowH / 2 > $top + ($rows - 1) * $rowH) $off = -$rowH / 2; else $off = $rowH / 2;  // di antara dua baris jalan ?>
            <g class="fc-map-pet" style="animation-delay: <?= $k * 0.4 ?>s">
                <?= pet_svg($pid, 46, "x='" . round($x - 23 + ($k % 2 ? 34 : -34)) . "' y='" . round($y + $off - 26) . "'") ?>
            </g>
        <?php endforeach; ?>
    </svg>
    <?php return ob_get_clean();
}

/* hiasan latar sesuai tema: padang rumput, musim gugur, musim dingin */
function journey_deco($tema, $W, $H, $rowH, $top, $rows) {
    $tree = [
        'meadow' => fn($x, $y, $s) => "<g transform='translate($x $y) scale($s)'><rect x='-4' y='0' width='8' height='22' rx='3' fill='#A0714F'/><circle cy='-8' r='20' fill='#4CC283'/><circle cx='-8' cy='-14' r='8' fill='#7FDBA0'/></g>",
        'autumn' => fn($x, $y, $s) => "<g transform='translate($x $y) scale($s)'><rect x='-4' y='0' width='8' height='22' rx='3' fill='#8C5A35'/><circle cy='-8' r='20' fill='#F2913A'/><circle cx='10' cy='-16' r='10' fill='#E8642B'/><circle cx='-8' cy='-14' r='7' fill='#FFC266'/></g>",
        'winter' => fn($x, $y, $s) => "<g transform='translate($x $y) scale($s)'><rect x='-4' y='6' width='8' height='16' rx='3' fill='#8C6A4F'/><path d='M0 -34 L22 10 L-22 10 Z' fill='#3E9E7E'/><path d='M0 -34 L10 -14 L-10 -14 Z' fill='#fff'/><path d='M-22 10 L22 10 L18 4 L-18 4Z' fill='#fff' opacity='.8'/></g>",
    ][$tema];
    $out = '';
    // gunung di belakang
    $mt = ['meadow' => ['#8FC9A0', '#6FB487'], 'autumn' => ['#E8B470', '#D99A4E'], 'winter' => ['#B9C8E0', '#9FB2D3']][$tema];
    $out .= "<path d='M" . ($W * 0.55) . " 60 L" . ($W * 0.66) . " 8 L" . ($W * 0.76) . " 60 Z' fill='{$mt[0]}'/><path d='M" . ($W * 0.68) . " 60 L" . ($W * 0.8) . " 0 L" . ($W * 0.92) . " 60 Z' fill='{$mt[1]}'/>";
    if ($tema === 'winter') $out .= "<path d='M" . ($W * 0.77) . " 15 L" . ($W * 0.8) . " 0 L" . ($W * 0.83) . " 15 Z' fill='#fff'/>";
    // pohon di sela-sela baris
    for ($r = 0; $r < $rows; $r++) {
        $y = $top + $r * $rowH + $rowH / 2;
        if ($y > $H - 40) break;
        foreach ([0.18, 0.47, 0.8] as $k => $fx) {
            if (($r + $k) % 2) continue;
            $out .= $tree($W * $fx + ($r % 2 ? 24 : -18), $y + 8, $W > 600 ? 1 : 0.8);
        }
    }
    // kolam / bunga / salju
    if ($tema === 'meadow') $out .= "<ellipse cx='" . ($W * 0.12) . "' cy='" . ($H - 34) . "' rx='" . ($W * 0.09) . "' ry='20' fill='#7CC8F2'/><text x='" . ($W * 0.1) . "' y='" . ($H - 26) . "' font-size='20'>🦆</text>";
    if ($tema === 'autumn') $out .= "<text x='" . ($W * 0.08) . "' y='" . ($H - 24) . "' font-size='24'>🍂</text><text x='" . ($W * 0.86) . "' y='" . ($H - 30) . "' font-size='22'>🍁</text>";
    if ($tema === 'winter') {
        for ($i = 0; $i < 18; $i++) $out .= "<circle cx='" . (($i * 137) % $W) . "' cy='" . (($i * 89) % $H) . "' r='3' fill='#fff' class='fc-snow' style='animation-delay:" . ($i % 6) . "s'/>";
        $out .= "<text x='" . ($W * 0.08) . "' y='" . ($H - 24) . "' font-size='26'>⛄</text>";
    }
    return $out;
}

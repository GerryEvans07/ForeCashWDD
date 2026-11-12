<?php
/* Kirim email lewat SMTP (Gmail) memakai library PHPMailer (includes/lib/PHPMailer, lisensi LGPL).
   Pengaturan ada di config/mail.php (salinan dari config/mail.example.php). */

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception as MailException;

require_once __DIR__ . '/lib/PHPMailer/Exception.php';
require_once __DIR__ . '/lib/PHPMailer/PHPMailer.php';
require_once __DIR__ . '/lib/PHPMailer/SMTP.php';

function driver_email() {
    $cfg = __DIR__ . '/../config/mail.php';
    if (!is_file($cfg)) return null;
    require_once $cfg;
    $driver = defined('MAIL_DRIVER') ? MAIL_DRIVER : 'gmail';
    if ($driver === 'resend') return defined('RESEND_API_KEY') && RESEND_API_KEY !== '' ? 'resend' : null;
    return defined('MAIL_USER') && MAIL_USER !== '' && defined('MAIL_PASS') && MAIL_PASS !== '' ? 'gmail' : null;
}
function email_siap() { return driver_email() !== null; }

// hasil: true jika terkirim, atau string pesan error
function kirim_email($ke, $nama, $subjek, $html, $teks) {
    $driver = driver_email();
    if (!$driver) return 'Email belum diatur (config/mail.php).';
    if ($driver === 'resend') return kirim_resend($ke, $subjek, $html, $teks);
    $m = new PHPMailer(true);
    try {
        $m->isSMTP();
        $m->Host = MAIL_HOST;
        $m->Port = MAIL_PORT;
        $m->SMTPAuth = true;
        $m->Username = MAIL_USER;
        $m->Password = str_replace(' ', '', MAIL_PASS);
        if (MAIL_SECURE === 'tls') $m->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        elseif (MAIL_SECURE === 'ssl') $m->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
        else { $m->SMTPSecure = ''; $m->SMTPAutoTLS = false; }
        $m->Timeout = 15;
        $m->CharSet = 'UTF-8';
        $m->setFrom(MAIL_USER, MAIL_FROM_NAME);
        $m->addAddress($ke, $nama);
        $m->isHTML(true);
        $logo = __DIR__ . '/../assets/img/logo-email.png';
        if (is_file($logo)) $m->addEmbeddedImage($logo, 'logo', 'forecash.png');   // dipanggil di HTML lewat src="cid:logo"
        $m->Subject = $subjek;
        $m->Body = $html;
        $m->AltBody = $teks;
        $m->send();
        return true;
    } catch (MailException $e) {
        error_log('ForeCash mail: ' . $m->ErrorInfo);
        return $m->ErrorInfo;
    }
}

/* Resend: kirim lewat HTTPS ke api.resend.com (port 443, jadi tidak terblokir seperti port SMTP).
   Logo ikut sebagai lampiran inline dengan content_id "logo", dipanggil di HTML lewat src="cid:logo". */
function kirim_resend($ke, $subjek, $html, $teks) {
    if (!function_exists('curl_init')) return 'Ekstensi cURL PHP belum aktif.';
    $data = ['from' => RESEND_FROM, 'to' => [$ke], 'subject' => $subjek, 'html' => $html, 'text' => $teks];
    $logo = __DIR__ . '/../assets/img/logo-email.png';
    if (is_file($logo)) $data['attachments'] = [[
        'filename' => 'forecash.png', 'content' => base64_encode(file_get_contents($logo)), 'content_id' => 'logo',
    ]];
    $ch = curl_init('https://api.resend.com/emails');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . RESEND_API_KEY, 'Content-Type: application/json'],
        CURLOPT_POSTFIELDS => json_encode($data),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 15,
    ]);
    $res = curl_exec($ch);
    $kode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);
    if ($res === false) { error_log('ForeCash Resend: ' . $err); return 'connect: ' . $err; }
    if ($kode >= 200 && $kode < 300) return true;
    $pesan = json_decode($res, true)['message'] ?? $res;
    error_log("ForeCash Resend $kode: $pesan");
    return "Resend $kode: $pesan";
}

// pesan error PHPMailer diterjemahkan supaya mudah dipahami
function alasan_gagal_email($err) {
    if (str_starts_with($err, 'connect: ')) return 'Email gagal dikirim: tidak bisa terhubung ke api.resend.com. Cek koneksi internet laptop.';
    if (stripos($err, 'Resend 401') !== false || stripos($err, 'API key') !== false) return 'Email gagal dikirim: RESEND_API_KEY di config/mail.php salah.';
    if (stripos($err, 'Resend 403') !== false) return 'Email gagal dikirim: Resend menolak. Domain pengirim belum diverifikasi, atau dengan onboarding@resend.dev hanya boleh kirim ke email pemilik akun Resend.';
    if (stripos($err, 'Resend') !== false) return 'Email gagal dikirim: ' . $err;
    if (stripos($err, 'authenticate') !== false) return 'Email gagal dikirim: alamat Gmail atau App Password di config/mail.php salah.';
    if (stripos($err, 'connect') !== false) return 'Email gagal dikirim: tidak bisa terhubung ke server email. Cek koneksi internet, atau jaringan kampus mungkin memblokir port 587.';
    return 'Email gagal dikirim: ' . $err;
}

function email_reset_html($nama, $link, $menit) {
    $nama = htmlspecialchars(explode(' ', $nama)[0], ENT_QUOTES, 'UTF-8');
    $link = htmlspecialchars($link, ENT_QUOTES, 'UTF-8');
    $font = "'Trebuchet MS','Segoe UI',Arial,sans-serif";
    // tabel + style inline: format yang paling aman untuk Gmail, Outlook, dan aplikasi email di HP
    return <<<HTML
<!doctype html>
<html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FFF3D6">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFF3D6;padding:28px 12px">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:2px solid #F2E2B8;border-bottom:6px solid #E9D29A;border-radius:28px;overflow:hidden;font-family:{$font};color:#2D2216">
    <tr><td align="center" style="background:#FFC83D;background-image:linear-gradient(180deg,#FFD866,#FFB82E);padding:28px 24px 22px">
      <img src="cid:logo" width="76" height="76" alt="ForeCash" style="display:block;border:0;width:76px;height:76px">
      <div style="font-size:24px;font-weight:bold;letter-spacing:-.3px;margin-top:8px;color:#3B2600">ForeCash</div>
    </td></tr>
    <tr><td style="padding:30px 32px 8px">
      <div style="font-size:26px;line-height:1.2;font-weight:bold;margin:0 0 12px">Lupa kata sandi? Tenang, {$nama}.</div>
      <div style="font-size:15px;line-height:1.65;color:#5B4A36">Kami menerima permintaan untuk mengganti kata sandi akun ForeCash kamu. Tekan tombol di bawah, lalu buat kata sandi baru.</div>
    </td></tr>
    <tr><td align="center" style="padding:24px 32px 6px">
      <a href="{$link}" style="display:inline-block;background:#FF8A1F;border-bottom:4px solid #D96200;border-radius:16px;color:#ffffff;font-size:17px;font-weight:bold;text-decoration:none;padding:15px 38px">Buat kata sandi baru</a>
    </td></tr>
    <tr><td align="center" style="padding:16px 32px 4px">
      <span style="display:inline-block;background:#FFF1D0;color:#7A5A1E;font-size:12.5px;font-weight:bold;border-radius:99px;padding:6px 12px;margin:3px">⏱ Berlaku {$menit} menit</span>
      <span style="display:inline-block;background:#FFF1D0;color:#7A5A1E;font-size:12.5px;font-weight:bold;border-radius:99px;padding:6px 12px;margin:3px">🔒 Hanya bisa dipakai sekali</span>
    </td></tr>
    <tr><td style="padding:20px 32px 6px">
      <div style="background:#F6FBF7;border:2px solid #D3EEDC;border-radius:18px;padding:14px 16px;font-size:13.5px;line-height:1.55;color:#245C3D"><b>Bukan kamu yang minta?</b> Abaikan saja email ini. Kata sandimu tidak berubah dan akunmu tetap aman.</div>
    </td></tr>
    <tr><td style="padding:16px 32px 26px;font-size:12px;line-height:1.5;color:#A8987F;word-break:break-all">Tombol tidak bisa ditekan? Salin link ini ke browser:<br><a href="{$link}" style="color:#D96200">{$link}</a></td></tr>
    <tr><td align="center" style="background:#FFF9EA;border-top:2px dashed #F2E2B8;padding:16px 24px;font-size:12px;color:#8C7A63">ForeCash · Uang aman sampai kiriman berikutnya<br><span style="color:#B8AC97">Email otomatis, tidak perlu dibalas.</span></td></tr>
  </table>
</td></tr>
</table>
</body></html>
HTML;
}

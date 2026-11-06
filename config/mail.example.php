<?php
/* Pengaturan email untuk fitur Lupa Kata Sandi.
   Salin file ini menjadi config/mail.php, lalu pilih SALAH SATU cara di bawah.
   config/mail.php sudah masuk .gitignore, jadi kunci/sandi tidak ikut ter-push ke GitHub.
   Jika file ini belum disalin atau masih kosong, link reset ditampilkan di layar (mode demo). */

// 'resend' = lewat API Resend (seperti proyek DapurTwin/gtnich), 'gmail' = lewat SMTP Gmail
const MAIL_DRIVER = 'resend';

/* ---- Cara A: Resend ----
   RESEND_API_KEY : kunci API dari resend.com (sama dengan RESEND_API_KEY di .env.local proyek gtnich)
   RESEND_FROM    : alamat pengirim dengan domain yang sudah diverifikasi di Resend,
                    contoh 'ForeCash <forecash@sakia.id>'.
                    Belum punya domain? Pakai 'ForeCash <onboarding@resend.dev>', tapi Resend hanya
                    mengizinkan kirim ke email pemilik akun Resend. */
const RESEND_API_KEY = '';
const RESEND_FROM    = 'ForeCash <onboarding@resend.dev>';

/* ---- Cara B: Gmail ----
   MAIL_USER : alamat Gmail pengirim
   MAIL_PASS : App Password Gmail (16 huruf), BUKAN kata sandi Gmail biasa.
               Buat di myaccount.google.com/apppasswords (Verifikasi 2 Langkah harus aktif). */
const MAIL_HOST   = 'smtp.gmail.com';
const MAIL_PORT   = 587;            // 587 = STARTTLS
const MAIL_SECURE = 'tls';          // 'tls' untuk 587, 'ssl' untuk 465
const MAIL_USER   = '';
const MAIL_PASS   = '';
const MAIL_FROM_NAME = 'ForeCash';

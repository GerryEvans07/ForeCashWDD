// Kirim email lewat Resend (hanya berjalan di server).
// Kalau RESEND_API_KEY belum diisi di .env.local, email dilewati tanpa error.
// Catatan: pengirim onboarding@resend.dev hanya bisa mengirim ke email pemilik akun Resend.
// Untuk mengirim ke siapa saja, verifikasi domain sendiri di resend.com lalu ganti RESEND_FROM_EMAIL.

import { Resend } from 'resend'
import { rupiah } from '@/lib/format'
import { tgl } from '@/lib/tanggal'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

async function kirim(to: string, subject: string, isi: string) {
  const key = process.env.RESEND_API_KEY
  if (!key) return { ok: false, alasan: 'RESEND_API_KEY belum diisi' }

  const resend = new Resend(key)
  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'ForeCash <onboarding@resend.dev>',
    to,
    subject,
    html: bungkus(isi),
  })
  if (error) {
    console.warn('Gagal kirim email:', error.message)
    return { ok: false, alasan: error.message }
  }
  return { ok: true }
}

// kerangka email sederhana, warna sama dengan aplikasi
function bungkus(isi: string) {
  return `<div style="background:#FFF6DC;padding:24px;font-family:Arial,sans-serif;color:#2D2216">
  <div style="max-width:480px;margin:0 auto;background:#fff;border:2px solid #F2E2B8;border-radius:20px;padding:24px">
    <p style="font-size:22px;font-weight:800;margin:0 0 12px">ForeCash</p>
    ${isi}
    <p style="font-size:12px;color:#8C7A63;margin-top:24px">ForeCash · Kelompok 4 IS556</p>
  </div></div>`
}

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}

export function emailSelamatDatang(to: string, nama: string) {
  return kirim(
    to,
    'Selamat datang di ForeCash',
    `<p>Halo ${esc(nama)},</p>
     <p>Akun ForeCash kamu sudah aktif. Mulai dengan dua langkah ini supaya peringatan dininya akurat:</p>
     <ol><li>Catat pengeluaran setiap hari.</li><li>Tambahkan jadwal pemasukan di menu Prediksi.</li></ol>
     <p><a href="${SITE}/beranda" style="display:inline-block;background:#FF8A1F;color:#fff;padding:10px 18px;border-radius:12px;text-decoration:none;font-weight:700">Buka ForeCash</a></p>`,
  )
}

export function emailStatusKritis(to: string, nama: string, d: { saldo: number; habis: string | null; batasAman: number | null; sumber: string | null }) {
  return kirim(
    to,
    'Peringatan: saldomu diperkirakan tidak cukup',
    `<p>Halo ${esc(nama)},</p>
     <p>Status keuanganmu sekarang <b style="color:#D93D3D">Kritis</b>. Saldo saat ini ${rupiah(d.saldo)}${d.habis ? `, diperkirakan habis <b>${tgl(d.habis)}</b>` : ''}${d.sumber ? ` sebelum ${esc(d.sumber)} datang` : ''}.</p>
     ${d.batasAman !== null ? `<p>Supaya cukup, belanja maksimal <b>${rupiah(d.batasAman)}</b> per hari.</p>` : ''}
     <p><a href="${SITE}/beranda" style="color:#E06A00;font-weight:700">Lihat detail di ForeCash</a></p>`,
  )
}

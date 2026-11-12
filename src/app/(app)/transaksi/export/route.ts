// Ekspor transaksi satu bulan ke CSV (port dari pages/export.php).
// Pemisah titik koma (;) dan BOM UTF-8 supaya langsung rapi dibuka di Excel versi Indonesia.
import { NextResponse } from 'next/server'
import { getSesi } from '@/lib/auth'
import { hariIni } from '@/lib/tanggal'

type Baris = {
  tanggal: string; jenis: string; keterangan: string; nominal: number
  kategori: { nama: string } | null; wallet: { nama: string } | null; tujuan: { nama: string } | null
}

function sel(v: string | number) {
  const s = String(v)
  return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export async function GET(req: Request) {
  const sesi = await getSesi()
  if (!sesi || sesi.profil.role !== 'mahasiswa') return new NextResponse('Silakan login sebagai mahasiswa.', { status: 401 })

  const q = new URL(req.url).searchParams.get('bulan') ?? ''
  const bulan = /^\d{4}-\d{2}$/.test(q) ? q : hariIni().slice(0, 7)
  const [y, m] = bulan.split('-').map(Number)
  const sampai = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`

  const { data } = await sesi.supabase
    .from('transactions')
    .select('tanggal, jenis, keterangan, nominal, kategori:categories(nama), wallet:wallets!transactions_wallet_id_fkey(nama), tujuan:wallets!transactions_wallet_tujuan_id_fkey(nama)')
    .eq('user_id', sesi.profil.id).gte('tanggal', `${bulan}-01`).lt('tanggal', sampai)
    .order('tanggal').order('id')

  const baris = [['Tanggal', 'Jenis', 'Keterangan', 'Kategori', 'Wallet', 'Ke Wallet', 'Nominal']]
  for (const t of (data ?? []) as unknown as Baris[]) {
    baris.push([t.tanggal, t.jenis, t.keterangan, t.kategori?.nama ?? '-', t.wallet?.nama ?? '', t.tujuan?.nama ?? '', String(Number(t.nominal))])
  }
  const csv = '﻿' + baris.map((r) => r.map(sel).join(';')).join('\r\n') + '\r\n'

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="forecash-${bulan}.csv"`,
    },
  })
}

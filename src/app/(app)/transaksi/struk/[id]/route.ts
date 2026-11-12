// Menampilkan foto struk (pengganti pages/struk.php).
// Cek dulu transaksinya bisa dilihat user ini (RLS), baru dibuatkan link sementara 60 detik.
import { NextResponse } from 'next/server'
import { getSesi } from '@/lib/auth'
import { linkStruk } from '@/lib/struk'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const sesi = await getSesi()
  if (!sesi) return new NextResponse('Silakan login.', { status: 401 })

  const id = Number((await params).id)
  const { data } = await sesi.supabase.from('transactions').select('bukti').eq('id', id).maybeSingle()
  if (!data?.bukti) return new NextResponse('Foto struk tidak ditemukan.', { status: 404 })

  const url = await linkStruk(sesi.supabase, data.bukti)
  if (!url) return new NextResponse('Foto struk tidak ditemukan.', { status: 404 })
  return NextResponse.redirect(url)
}

// Ubah transaksi (port dari php-version/pages/transaksi_edit.php).
// Kepemilikan dicek oleh RLS: transaksi milik orang lain tidak akan ditemukan.
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { wajibLogin } from '@/lib/auth'
import { ambilWallet, type Jenis } from '@/lib/data'
import TxForm, { type OpsiKategori } from '../../components/TxForm'
import { ubahTransaksi } from '../../actions'

export const metadata = { title: 'Ubah Transaksi' }

export default async function UbahTransaksiPage({ params }: { params: Promise<{ id: string }> }) {
  const { supabase, profil } = await wajibLogin('mahasiswa')
  const id = Number((await params).id)
  if (!Number.isInteger(id)) notFound()

  const [tx, wallets, kat] = await Promise.all([
    supabase.from('transactions').select('id, jenis, nominal, keterangan, tanggal, wallet_id, wallet_tujuan_id, category_id, bukti').eq('id', id).eq('user_id', profil.id).maybeSingle(),
    ambilWallet(supabase, profil.id),
    supabase.from('categories').select('id, nama, jenis').order('jenis').order('nama'),
  ])
  if (!tx.data) notFound()
  const t = { ...tx.data, jenis: tx.data.jenis as Jenis, nominal: Number(tx.data.nominal) }

  return (
    <>
      <p className="text-xs text-slate-500"><Link href="/transaksi" className="font-bold">Transaksi</Link> › Ubah</p>
      <div className="max-w-2xl">
        <TxForm aksi={ubahTransaksi.bind(null, id)} wallets={wallets} kategori={(kat.data ?? []) as OpsiKategori[]} awal={t} mode="ubah" />
      </div>
    </>
  )
}

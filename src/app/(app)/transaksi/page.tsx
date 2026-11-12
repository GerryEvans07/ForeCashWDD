// Halaman Transaksi (port dari php-version/pages/transaksi.php).
import Link from 'next/link'
import { Download, Pencil, ReceiptText } from 'lucide-react'
import Flash from '@/components/Flash'
import { wajibLogin } from '@/lib/auth'
import { ambilWallet, kategoriEmoji, type Jenis } from '@/lib/data'
import { rupiah } from '@/lib/format'
import { hariIni, tgl } from '@/lib/tanggal'
import TxForm, { type OpsiKategori } from './components/TxForm'
import TombolHapus from './components/TombolHapus'
import BatasHarianForm from './components/BatasHarianForm'
import KategoriSaya from './components/KategoriSaya'
import { hapusTransaksi, tambahTransaksi } from './actions'

export const metadata = { title: 'Transaksi' }

const KELAS = { pemasukan: 'is-in', pengeluaran: 'is-out', transfer: 'is-move' }
const WARNA = { pemasukan: 'text-hsGreen', pengeluaran: 'text-hsRed', transfer: 'text-hsBlue' }
const TANDA = { pemasukan: '+', pengeluaran: '−', transfer: '' }

type Baris = {
  id: number; tanggal: string; jenis: Jenis; nominal: number; keterangan: string; bukti: string | null
  kategori: { nama: string } | null; wallet: { nama: string } | null; tujuan: { nama: string } | null
}

/** awal & akhir bulan untuk filter, contoh '2026-11' -> ['2026-11-01', '2026-12-01'] */
function rentangBulan(bulan: string): [string, string] {
  const [y, m] = bulan.split('-').map(Number)
  const akhir = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`
  return [`${bulan}-01`, akhir]
}

export default async function TransaksiPage({ searchParams }: { searchParams: Promise<{ bulan?: string; jenis?: string; ok?: string }> }) {
  const { supabase, profil } = await wajibLogin('mahasiswa')
  const uid = profil.id
  const sp = await searchParams
  const hari = hariIni()
  const bulan = /^\d{4}-\d{2}$/.test(sp.bulan ?? '') ? sp.bulan! : hari.slice(0, 7)
  const [dari, sampai] = rentangBulan(bulan)
  const jenisAwal = (['pemasukan', 'pengeluaran', 'transfer'] as const).find((j) => j === sp.jenis) ?? 'pengeluaran'

  const [wallets, kat, list, keluarHariIni] = await Promise.all([
    ambilWallet(supabase, uid),
    supabase.from('categories').select('id, nama, jenis, user_id').order('jenis').order('nama'),
    supabase
      .from('transactions')
      .select('id, tanggal, jenis, nominal, keterangan, bukti, kategori:categories(nama), wallet:wallets!transactions_wallet_id_fkey(nama), tujuan:wallets!transactions_wallet_tujuan_id_fkey(nama)')
      .eq('user_id', uid).gte('tanggal', dari).lt('tanggal', sampai)
      .order('tanggal', { ascending: false }).order('id', { ascending: false }),
    supabase.from('transactions').select('nominal').eq('user_id', uid).eq('jenis', 'pengeluaran').eq('tanggal', hari),
  ])
  const kategori = (kat.data ?? []) as (OpsiKategori & { user_id: string | null })[]
  const transaksi = (list.data ?? []) as unknown as Baris[]
  const totalHariIni = (keluarHariIni.data ?? []).reduce((s, t) => s + Number(t.nominal), 0)

  return (
    <>
      <div><p className="text-xs text-slate-500">Catat pemasukan, pengeluaran, dan transfer antar wallet.</p></div>
      {sp.ok === 'ubah' && <Flash hasil={{ ok: 'Transaksi diperbarui.' }} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <TxForm aksi={tambahTransaksi} wallets={wallets} kategori={kategori} awal={{ jenis: jenisAwal, wallet_id: wallets[0]?.id }} mode="baru" />

          <div className="hs-card p-5 space-y-3">
            <div className="flex flex-wrap justify-between items-center gap-2">
              <h4 className="text-sm font-black">Riwayat Transaksi</h4>
              <div className="flex items-center gap-2">
                <form method="get">
                  {/* ganti bulan: halaman dimuat ulang dengan ?bulan=YYYY-MM */}
                  <input type="month" name="bulan" defaultValue={bulan} aria-label="Pilih bulan" className="px-3 py-1.5 text-xs border" />
                  <button className="hs-btn bg-hsYellow text-hsDark px-3 py-1.5 text-xs ml-1">Lihat</button>
                </form>
                <a href={`/transaksi/export?bulan=${bulan}`} className="hs-btn bg-slate-800 text-white px-3 py-1.5 text-xs" title="Unduh CSV (bisa dibuka di Excel)">
                  <Download size={13} /> CSV
                </a>
              </div>
            </div>
            {transaksi.length === 0 && <p className="text-xs text-slate-500">Belum ada transaksi di bulan ini.</p>}
            {transaksi.map((t) => (
              <div key={t.id} className="fc-tx">
                <span className={`fc-tx-icon ${KELAS[t.jenis]}`}>{kategoriEmoji(t.kategori?.nama, t.jenis)}</span>
                <div className="text-sm min-w-0 flex-1">
                  <p className="font-bold truncate">{t.keterangan}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    <span className="fc-chip">{t.jenis === 'transfer' ? `${t.wallet?.nama} ke ${t.tujuan?.nama}` : t.kategori?.nama ?? 'Lainnya'}</span>{' '}
                    {tgl(t.tanggal)}{t.jenis !== 'transfer' && ` · ${t.wallet?.nama}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <p className={`font-display font-extrabold text-base ${WARNA[t.jenis]}`}>{TANDA[t.jenis]}{rupiah(t.nominal)}</p>
                  {t.bukti && (
                    <a href={`/transaksi/struk/${t.id}`} target="_blank" rel="noopener" className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 text-xs flex items-center justify-center" title="Lihat foto struk" aria-label="Lihat foto struk">
                      <ReceiptText size={14} />
                    </a>
                  )}
                  <Link href={`/transaksi/${t.id}/ubah`} className="w-8 h-8 rounded-full bg-slate-100 text-xs flex items-center justify-center" title="Ubah" aria-label="Ubah transaksi">
                    <Pencil size={13} />
                  </Link>
                  <TombolHapus aksi={hapusTransaksi} id={t.id} pesan="Hapus transaksi ini?" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <BatasHarianForm batas={profil.batas_harian} hariIni={totalHariIni} />
          <KategoriSaya kategori={kategori.filter((k) => k.user_id === uid)} />
        </div>
      </div>
    </>
  )
}

// Beranda mahasiswa (port dari php-version/pages/dashboard.php).
import Link from 'next/link'
import { after } from 'next/server'
import { Coins, Flame, HandCoins, UserRoundMinus, Banknote, Landmark, Smartphone } from 'lucide-react'
import WarningBanner from '@/components/WarningBanner'
import { LevelBar, Tantangan } from '@/components/Gamifikasi'
import { wajibLogin } from '@/lib/auth'
import { ambilForecast, ambilWallet, kategoriEmoji, type Jenis } from '@/lib/data'
import { emailStatusKritis } from '@/lib/email'
import { ambilGamify } from '@/lib/gamify'
import { rupiah } from '@/lib/format'
import { tgl } from '@/lib/tanggal'

export const metadata = { title: 'Dashboard' }

const IKON_WALLET = { tunai: Banknote, bank: Landmark, ewallet: Smartphone }
const KELAS_TX = { pemasukan: 'is-in', pengeluaran: 'is-out', transfer: 'is-move' }
const WARNA_TX = { pemasukan: 'text-hsGreen', pengeluaran: 'text-hsRed', transfer: 'text-hsBlue' }
const TANDA_TX = { pemasukan: '+', pengeluaran: '−', transfer: '' }

type TxTerakhir = {
  id: number; tanggal: string; jenis: Jenis; nominal: number; keterangan: string
  kategori: { nama: string } | null; wallet: { nama: string } | null; tujuan: { nama: string } | null
}

export default async function BerandaPage() {
  const { supabase, user, profil } = await wajibLogin('mahasiswa')
  const uid = profil.id

  const wallets = await ambilWallet(supabase, uid)
  const [f, recent, debts] = await Promise.all([
    ambilForecast(supabase, uid, wallets),
    supabase
      .from('transactions')
      .select('id, tanggal, jenis, nominal, keterangan, kategori:categories(nama), wallet:wallets!transactions_wallet_id_fkey(nama), tujuan:wallets!transactions_wallet_tujuan_id_fkey(nama)')
      .eq('user_id', uid)
      .order('tanggal', { ascending: false })
      .order('id', { ascending: false })
      .limit(5),
    supabase.from('debts').select('arah, nominal').eq('user_id', uid).eq('status', 'belum'),
  ])
  const g = await ambilGamify(supabase, uid, profil.batas_harian, f.status)
  const badgeDapat = g.badges.filter((b) => b.dapat)
  const transaksi = (recent.data ?? []) as unknown as TxTerakhir[]
  const total = (arah: string) => (debts.data ?? []).filter((d) => d.arah === arah).reduce((s, d) => s + Number(d.nominal), 0)
  const piutang = total('piutang')
  const utang = total('utang')

  // status Kritis: kirim email peringatan (maks. sekali sehari), setelah halaman selesai dikirim ke browser
  if (f.status === 'kritis' && user.email) {
    after(async () => {
      const { data: boleh } = await supabase.rpc('boleh_kirim_email_kritis')
      if (boleh) {
        await emailStatusKritis(user.email!, profil.nama, { saldo: f.saldo, habis: f.habis, batasAman: f.batasAman, sumber: f.next?.sumber ?? null })
      }
    })
  }

  return (
    <>
      <WarningBanner f={f} avatarId={profil.avatar} />

      {/* Ringkasan angka */}
      <section className="fc-stats" aria-label="Ringkasan">
        <div className="hs-card fc-stat">
          <span className="fc-tile fc-tile-orange"><Coins size={20} /></span>
          <div className="min-w-0"><p className="fc-stat-label">Total saldo</p><p className="fc-stat-value">{rupiah(f.saldo)}</p></div>
        </div>
        <div className="hs-card fc-stat">
          <span className="fc-tile fc-tile-red"><Flame size={20} /></span>
          <div className="min-w-0">
            <p className="fc-stat-label">Pengeluaran per hari</p>
            <p className="fc-stat-value">{rupiah(f.burn)}</p>
            <p className="fc-stat-sub">rata-rata {f.hari} hari terakhir</p>
          </div>
        </div>
        <Link href="/utang" className="hs-card fc-stat">
          <span className="fc-tile fc-tile-green"><HandCoins size={20} /></span>
          <div className="min-w-0"><p className="fc-stat-label">Teman utang ke kamu</p><p className="fc-stat-value text-hsGreen">{rupiah(piutang)}</p></div>
        </Link>
        <Link href="/utang" className="hs-card fc-stat">
          <span className="fc-tile fc-tile-purple"><UserRoundMinus size={20} /></span>
          <div className="min-w-0"><p className="fc-stat-label">Kamu utang ke teman</p><p className="fc-stat-value text-hsRed">{rupiah(utang)}</p></div>
        </Link>
      </section>

      {/* Aksi cepat */}
      <section aria-label="Catat cepat">
        <div className="fc-section-title"><h3>Mau catat apa?</h3></div>
        <div className="fc-actions">
          <Link href="/transaksi?jenis=pengeluaran#form" className="fc-action fc-action-out"><span className="fc-action-emoji">🍜</span><span><b>Pengeluaran</b><small>Jajan, ongkos, kos</small></span></Link>
          <Link href="/transaksi?jenis=pemasukan#form" className="fc-action fc-action-in"><span className="fc-action-emoji">💰</span><span><b>Pemasukan</b><small>Uang saku, gaji part-time</small></span></Link>
          <Link href="/transaksi?jenis=transfer#form" className="fc-action fc-action-move"><span className="fc-action-emoji">🔁</span><span><b>Transfer</b><small>Isi e-wallet dari rekening</small></span></Link>
          <Link href="/utang#split" className="fc-action fc-action-split"><span className="fc-action-emoji">🍕</span><span><b>Split bill</b><small>Bagi tagihan bareng teman</small></span></Link>
        </div>
      </section>

      {/* Gamifikasi: streak, level & badge, tantangan mingguan */}
      <section className="fc-game" aria-label="Pencapaian">
        <div className="hs-card fc-streak">
          <span className="fc-streak-flame">🔥</span>
          <div>
            <p className="fc-stat-value" style={{ fontSize: 30 }}>{g.streak} hari</p>
            <p className="fc-stat-sub">{g.streak ? 'berturut-turut mencatat' : 'Catat sesuatu hari ini untuk mulai streak'}</p>
          </div>
        </div>
        <div className="hs-card p-5">
          <LevelBar g={g} />
          <p className="text-2xl mt-2 flex gap-1.5">
            {badgeDapat.map((b) => <span key={b.nama} title={b.nama}>{b.icon}</span>)}
            {badgeDapat.length === 0 && <span className="text-xs text-slate-400">Belum ada badge</span>}
          </p>
        </div>
        <Link href="/pencapaian" className="hs-card p-5 block">
          <Tantangan t={g.tantangan} />
          <p className="fc-link mt-2">Lihat semua pencapaian</p>
        </Link>
      </section>

      {/* Saldo per wallet */}
      <section aria-label="Saldo per wallet">
        <div className="fc-section-title">
          <div><h3>Dompetmu</h3><p>Semua transaksi otomatis masuk ke wallet &quot;Utama&quot; kalau tidak dipilih.</p></div>
          <Link href="/wallet" className="fc-link">Kelola wallet</Link>
        </div>
        <div className="fc-wallets">
          {wallets.map((w, i) => {
            const Ikon = IKON_WALLET[w.tipe]
            return (
              <div key={w.id} className={`wallet-card fc-w${i % 5}`}>
                <p className="flex items-center gap-2 text-sm font-bold"><span className="fc-wallet-icon"><Ikon size={17} /></span> {w.nama}</p>
                <p className="fc-stat-value">{rupiah(w.saldo)}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Transaksi terakhir */}
      <section className="hs-card p-5" aria-label="Transaksi terakhir">
        <div className="fc-section-title" style={{ marginBottom: 4 }}>
          <h3 style={{ fontSize: 19 }}>Transaksi terakhir</h3>
          <Link href="/transaksi" className="fc-link">Lihat semua</Link>
        </div>
        {transaksi.length === 0 && <p className="text-sm text-slate-500 py-3">Belum ada transaksi. Mulai dari tombol &quot;Mau catat apa?&quot; di atas.</p>}
        {transaksi.map((t) => (
          <div key={t.id} className="fc-tx">
            <span className={`fc-tx-icon ${KELAS_TX[t.jenis]}`}>{kategoriEmoji(t.kategori?.nama, t.jenis)}</span>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-sm truncate">{t.keterangan}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                <span className="fc-chip">{t.jenis === 'transfer' ? `${t.wallet?.nama} ke ${t.tujuan?.nama}` : t.kategori?.nama ?? 'Lainnya'}</span>{' '}
                {tgl(t.tanggal)}
              </p>
            </div>
            <p className={`font-display font-extrabold text-base ${WARNA_TX[t.jenis]}`}>
              {TANDA_TX[t.jenis]}{rupiah(t.nominal)}
            </p>
          </div>
        ))}
      </section>
    </>
  )
}

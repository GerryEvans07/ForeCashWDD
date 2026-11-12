// Kelola Wallet (port dari php-version/pages/wallet.php).
import Link from 'next/link'
import { wajibLogin } from '@/lib/auth'
import { ambilWallet } from '@/lib/data'
import { BarisWallet, TambahWallet } from './components/WalletForms'

export const metadata = { title: 'Kelola Wallet' }

export default async function WalletPage() {
  const { supabase, profil } = await wajibLogin('mahasiswa')
  const wallets = await ambilWallet(supabase, profil.id)

  return (
    <>
      <div>
        <p className="text-xs text-slate-500"><Link href="/beranda" className="font-bold">Dashboard</Link> › Kelola Wallet</p>
        <p className="text-xs text-slate-500">Pisahkan saldo tunai, bank, dan e-wallet. Pindah saldo antar wallet dicatat lewat menu Transaksi → Transfer.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 hs-card p-5 space-y-3">
          {wallets.map((w) => <BarisWallet key={w.id} w={w} />)}
        </div>
        <TambahWallet />
      </div>
    </>
  )
}

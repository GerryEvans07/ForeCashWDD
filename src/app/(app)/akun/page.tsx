// Akun (port dari php-version/pages/akun.php). Bisa dibuka mahasiswa maupun orang tua.
import { LogOut } from 'lucide-react'
import { wajibLogin } from '@/lib/auth'
import { keluar } from '@/lib/actions/auth'
import { FormPassword, FormProfil, KodeHubung } from './components/FormAkun'

export const metadata = { title: 'Akun' }

const FAQ = [
  ['Bagaimana ForeCash menghitung tanggal saldo habis?', 'Total saldo dibagi burn rate, yaitu rata-rata pengeluaran harian dalam 14 hari terakhir. Hasilnya dibandingkan dengan jadwal pemasukan berikutnya.'],
  ['Apakah wallet wajib diisi?', 'Tidak. Semua transaksi otomatis masuk ke wallet "Utama". Tambah wallet lain hanya jika ingin memisahkan tunai, bank, dan e-wallet.'],
  ['Kenapa isi e-wallet dari rekening tidak dicatat sebagai pengeluaran?', 'Gunakan jenis "Transfer". Uang hanya berpindah tempat, jadi tidak mengubah total saldo maupun burn rate.'],
  ['Apa yang bisa dilihat orang tua?', 'Status peringatan, total saldo, burn rate, transaksi terakhir, dan laporan bulanan. Orang tua tidak dapat menambah atau mengubah data.'],
  ['Apakah ForeCash terhubung ke rekening bank atau e-wallet?', 'Tidak. Semua transaksi dicatat manual sehingga data rekening tetap aman.'],
]

export default async function AkunPage() {
  const { supabase, user, profil } = await wajibLogin()
  const mahasiswa = profil.role === 'mahasiswa'
  const { data: ortu } = mahasiswa ? await supabase.rpc('daftar_orangtua') : { data: [] }
  const punyaSandi = (user.identities ?? []).some((i) => i.provider === 'email')

  return (
    <>
      <div><p className="text-xs text-slate-500">Kelola profil, kata sandi, dan akses orang tua.</p></div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <FormProfil nama={profil.nama} email={user.email ?? ''} avatar={profil.avatar} role={profil.role} />
          <FormPassword punyaSandi={punyaSandi} />
          <form action={keluar}>
            <button className="hs-btn bg-hsRed text-white w-full py-2.5 text-xs"><LogOut size={14} /> Keluar Akun</button>
          </form>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {mahasiswa && <KodeHubung kode={profil.kode_hubung} ortu={(ortu ?? []) as { link_id: number; nama: string; email: string }[]} />}

          <div className="hs-card p-6 space-y-3 text-xs">
            <h4 className="text-sm font-black border-b pb-2">Bantuan & FAQ</h4>
            {FAQ.map(([t, j]) => (
              <div key={t} className="p-3 bg-slate-50 rounded-2xl">
                <p className="font-bold">{t}</p>
                <p className="text-slate-600">{j}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

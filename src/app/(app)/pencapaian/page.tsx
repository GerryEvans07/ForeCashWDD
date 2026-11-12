// Pencapaian (port dari php-version/pages/pencapaian.php).
import { Flag } from 'lucide-react'
import Avatar from '@/components/Avatar'
import { LevelBar, Tantangan } from '@/components/Gamifikasi'
import { wajibLogin } from '@/lib/auth'
import { ambilForecast } from '@/lib/data'
import { ambilGamify } from '@/lib/gamify'

export const metadata = { title: 'Pencapaian' }

export default async function PencapaianPage() {
  const { supabase, profil } = await wajibLogin('mahasiswa')
  const f = await ambilForecast(supabase, profil.id)
  const g = await ambilGamify(supabase, profil.id, profil.batas_harian, f.status)

  return (
    <>
      <div><p className="text-xs text-slate-500">Kumpulkan badge dari kebiasaan baik: rajin mencatat, hemat, dan melunasi utang.</p></div>

      <section className="hs-card p-6 flex flex-wrap items-center gap-6">
        <div className="w-24 h-24 bg-hsYellow/40 rounded-full flex items-end justify-center overflow-hidden shrink-0"><Avatar id={profil.avatar} size={88} /></div>
        <div className="flex-1 min-w-[200px]">
          <p className="text-xl font-black">{profil.nama}</p>
          <div className="mt-2"><LevelBar g={g} /></div>
        </div>
        <div className="text-center">
          <p className="text-4xl">🔥</p>
          <p className="text-xl font-black">{g.streak} hari</p>
          <p className="text-[11px] text-slate-500">streak</p>
        </div>
      </section>

      <section className="hs-card p-6 space-y-2">
        <h4 className="text-sm font-black"><Flag size={15} className="inline -mt-0.5 text-hsOrange" /> Tantangan Minggu Ini</h4>
        <Tantangan t={g.tantangan} />
      </section>

      <section className="space-y-3">
        <h4 className="text-sm font-black">Badge</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {g.badges.map((b) => (
            <div key={b.nama} className={`hs-card p-5 text-center space-y-2 ${b.dapat ? '' : 'opacity-60'}`}>
              <div className={`text-4xl ${b.dapat ? '' : 'grayscale'}`}>{b.icon}</div>
              <p className="text-sm font-black">{b.nama}</p>
              <p className="text-[11px] text-slate-500">{b.ket}</p>
              {b.dapat ? (
                <span className="inline-block text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">TERCAPAI · +100</span>
              ) : (
                <>
                  <div className="w-full bg-slate-100 rounded-full h-2"><div className="bg-hsOrange h-2 rounded-full" style={{ width: `${Math.round((b.now / b.max) * 100)}%` }} /></div>
                  <p className="text-[10px] font-bold">{b.now}/{b.max}</p>
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="hs-card p-5 text-xs text-slate-600 space-y-1">
        <p className="font-bold text-hsDark">Cara mendapat poin</p>
        <p>Setiap badge bernilai 100 poin, dan setiap hari streak bernilai 10 poin (maks. 30 hari). Level naik setiap 200 poin.</p>
      </section>
    </>
  )
}

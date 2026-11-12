'use client'

import { useState } from 'react'
import { Link2 } from 'lucide-react'
import AvatarPicker from '@/components/AvatarPicker'
import Flash from '@/components/Flash'
import { useAksi } from '@/lib/useAksi'
import { buatKodeBaru, cabutAkses, gantiPassword, simpanProfil } from '../actions'

export function FormProfil({ nama, email, avatar, role }: { nama: string; email: string; avatar: string; role: string }) {
  const { hasil, pending, onSubmit } = useAksi(simpanProfil, { resetOk: false })
  const [pilih, setPilih] = useState(avatar)
  return (
    <form onSubmit={onSubmit} className="hs-card p-6 space-y-3">
      <h4 className="text-sm font-black border-b pb-2">Profil</h4>
      <Flash hasil={hasil} />
      <div><label htmlFor="an" className="text-xs font-bold">Nama</label><input id="an" name="nama" defaultValue={nama} required maxLength={100} className="w-full px-3 py-2 text-xs border" /></div>
      <div><label htmlFor="ae" className="text-xs font-bold">Email</label><input id="ae" type="email" name="email" defaultValue={email} required className="w-full px-3 py-2 text-xs border" /></div>
      <div><p className="text-xs font-bold mb-1">Avatar</p><AvatarPicker value={pilih} onChange={setPilih} /></div>
      <p className="text-[11px] text-slate-500">Role: <b>{role === 'orangtua' ? 'Orang Tua' : 'Mahasiswa'}</b></p>
      <button disabled={pending} className="hs-btn bg-hsBlue text-white w-full py-2 text-xs disabled:opacity-60">Simpan Profil</button>
    </form>
  )
}

export function FormPassword({ punyaSandi }: { punyaSandi: boolean }) {
  const { hasil, pending, onSubmit, ref } = useAksi(gantiPassword)
  return (
    <form ref={ref} onSubmit={onSubmit} className="hs-card p-6 space-y-3">
      <h4 className="text-sm font-black border-b pb-2">{punyaSandi ? 'Ganti Kata Sandi' : 'Buat Kata Sandi'}</h4>
      <Flash hasil={hasil} />
      {punyaSandi ? (
        <input type="password" name="lama" required placeholder="Kata sandi lama" aria-label="Kata sandi lama" autoComplete="current-password" className="w-full px-3 py-2 text-xs border" />
      ) : (
        <p className="text-[11px] text-slate-500">Akunmu masuk lewat Google. Buat kata sandi supaya bisa login dengan email juga.</p>
      )}
      <input type="password" name="baru" required minLength={8} placeholder="Kata sandi baru (min. 8)" aria-label="Kata sandi baru" autoComplete="new-password" className="w-full px-3 py-2 text-xs border" />
      <button disabled={pending} className="hs-btn bg-slate-800 text-white w-full py-2 text-xs disabled:opacity-60">{punyaSandi ? 'Ganti' : 'Simpan'}</button>
    </form>
  )
}

function BarisOrtu({ o }: { o: { link_id: number; nama: string; email: string } }) {
  const { pending, onSubmit } = useAksi(cabutAkses, { resetOk: false, sebelum: () => confirm('Cabut akses orang tua ini?') })
  return (
    <form onSubmit={onSubmit} className="flex justify-between items-center gap-2 bg-slate-50 rounded-2xl px-4 py-2">
      <input type="hidden" name="id" value={o.link_id} />
      <span className="text-xs min-w-0"><b>{o.nama}</b> · {o.email}</span>
      <button disabled={pending} className="text-xs font-bold text-hsRed shrink-0">Cabut akses</button>
    </form>
  )
}

export function KodeHubung({ kode, ortu }: { kode: string | null; ortu: { link_id: number; nama: string; email: string }[] }) {
  const { hasil, pending, onSubmit } = useAksi(buatKodeBaru, { resetOk: false, sebelum: () => confirm('Buat kode baru? Kode lama tidak berlaku lagi.') })
  return (
    <div className="hs-card p-6 space-y-3">
      <h4 className="text-sm font-black border-b pb-2"><Link2 size={15} className="inline -mt-0.5 text-hsPurple" /> Hubungkan dengan Orang Tua</h4>
      <Flash hasil={hasil} />
      <p className="text-xs text-slate-600">Bagikan kode ini ke orang tua. Setelah memasukkan kode di akunnya, orang tua dapat melihat ringkasan keuanganmu tanpa bisa mengubah data.</p>
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-2xl font-black tracking-[.3em] bg-purple-50 text-hsPurple px-4 py-2 rounded-2xl">{kode ?? '-'}</span>
        <form onSubmit={onSubmit}><button disabled={pending} className="hs-btn bg-slate-200 px-3 py-2 text-xs">Buat kode baru</button></form>
      </div>
      {ortu.map((o) => <BarisOrtu key={o.link_id} o={o} />)}
      {ortu.length === 0 && <p className="text-[11px] text-slate-500">Belum ada orang tua yang terhubung.</p>}
    </div>
  )
}

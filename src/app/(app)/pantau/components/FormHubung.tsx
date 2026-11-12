'use client'

import Flash from '@/components/Flash'
import { useAksi } from '@/lib/useAksi'
import { hubungkanAnak } from '../actions'

export default function FormHubung() {
  const { hasil, pending, onSubmit } = useAksi(hubungkanAnak, { resetOk: false })
  return (
    <form onSubmit={onSubmit} className="hs-card p-5 space-y-3">
      <Flash hasil={hasil} />
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <label htmlFor="kode" className="text-xs font-bold">Hubungkan akun anak</label>
          <input id="kode" name="kode" required maxLength={8} placeholder="Masukkan kode 8 karakter dari akun anak" className="w-full px-3 py-2 text-sm border uppercase" />
        </div>
        <button disabled={pending} className="hs-btn bg-hsPurple text-white px-5 py-2.5 text-xs disabled:opacity-60">Hubungkan</button>
      </div>
    </form>
  )
}

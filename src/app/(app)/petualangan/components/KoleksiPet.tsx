'use client'

// Koleksi teman hemat + kartu detail (dialog). Port dari bagian koleksi & <dialog> di petualangan.php.
import { useEffect, useRef } from 'react'
import { Check } from 'lucide-react'
import PetSvg from '@/components/PetSvg'
import { PETS } from '@/lib/pets'
import { tgl } from '@/lib/tanggal'
import { useAksi } from '@/lib/useAksi'
import { pakaiPet } from '../actions'

type Props = {
  /** pet_id -> tanggal menetas */
  owned: Record<string, string>
  dipakai: string | null
  /** pet yang baru menetas saat halaman dibuka (dialognya langsung muncul) */
  baru: string | null
}

function KartuPet({ id, menetas, dipakai, baru }: { id: string; menetas: string; dipakai: boolean; baru: boolean }) {
  const ref = useRef<HTMLDialogElement>(null)
  const p = PETS[id]
  const pakai = useAksi(pakaiPet, { resetOk: false })

  useEffect(() => {
    if (baru) ref.current?.showModal()
  }, [baru])
  useEffect(() => {
    if (pakai.hasil?.ok) ref.current?.close()
  }, [pakai.hasil])

  return (
    <>
      <button type="button" className={`fc-pet-tile ${dipakai ? 'is-on' : ''}`} onClick={() => ref.current?.showModal()} aria-label={`Lihat ${p.nama}`}>
        <PetSvg id={id} size={64} />
        <span>{p.nama}</span>
        {dipakai && <i className="fc-pet-check"><Check size={12} strokeWidth={3} /></i>}
      </button>

      <dialog ref={ref} className="fc-dialog" onClick={(e) => { if (e.target === e.currentTarget) e.currentTarget.close() }}>
        {baru && <p className="fc-dialog-new">🎉 Telurmu menetas!</p>}
        <div className="fc-dialog-pet"><PetSvg id={id} size={140} /></div>
        <p className="fc-dialog-tag">{p.sifat}</p>
        <h3>{p.nama}</h3>
        <p className="fc-dialog-story">{p.cerita}</p>
        <p className="fc-dialog-date">Menetas {tgl(menetas)}</p>
        {pakai.hasil?.error && <p className="text-xs font-bold text-hsRed mt-2">{pakai.hasil.error}</p>}
        <div className="fc-dialog-actions">
          <button type="button" className="hs-btn bg-slate-100 px-5 py-2.5" onClick={() => ref.current?.close()}>Tutup</button>
          {dipakai ? (
            <span className="fc-chip" style={{ padding: '8px 14px' }}>Sedang menemanimu</span>
          ) : (
            <form onSubmit={pakai.onSubmit}>
              <input type="hidden" name="pet" value={id} />
              <button disabled={pakai.pending} className="hs-btn bg-hsOrange text-white px-5 py-2.5">Ajak jalan-jalan</button>
            </form>
          )}
        </div>
      </dialog>
    </>
  )
}

export default function KoleksiPet({ owned, dipakai, baru }: Props) {
  const jumlah = Object.keys(owned).length
  return (
    <section className="hs-card p-5">
      <div className="fc-section-title">
        <h3 style={{ fontSize: 20 }}>Koleksi teman</h3>
        <p>{jumlah} dari {Object.keys(PETS).length} sudah menetas</p>
      </div>
      <div className="fc-pet-grid">
        {Object.keys(PETS).map((id) =>
          owned[id] ? (
            <KartuPet key={id} id={id} menetas={owned[id]} dipakai={dipakai === id} baru={baru === id} />
          ) : (
            <div key={id} className="fc-pet-tile is-locked" title="Belum menetas">
              <PetSvg id={id} size={64} className="fc-silhouette" />
              <span>???</span>
            </div>
          ),
        )}
      </div>
    </section>
  )
}

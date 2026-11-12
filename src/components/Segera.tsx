// Penanda halaman yang belum dipindahkan dari versi PHP. Dihapus setelah halamannya selesai.
export default function Segera({ tahap, isi }: { tahap: number; isi: string }) {
  return (
    <section className="hs-card p-6">
      <p className="text-sm font-bold">Halaman ini dikerjakan di Tahap {tahap}.</p>
      <p className="text-sm text-slate-500 mt-1">{isi}</p>
    </section>
  )
}

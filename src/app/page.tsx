// Tahap 1: halaman depan sementara. Landing page asli (index.html versi PHP) dipindahkan di Tahap 13.
import Link from 'next/link'

export default function Home() {
  return (
    <main id="loginPage" className="min-h-screen flex items-center justify-center p-6">
      <div className="hs-card p-8 text-center max-w-sm w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="" className="w-20 mx-auto" />
        <h1 className="text-3xl font-extrabold mt-3">ForeCash</h1>
        <p className="text-sm text-slate-500 mt-1">Uang aman sampai kiriman berikutnya</p>
        <div className="flex flex-col gap-2 mt-6">
          <Link href="/login" className="hs-btn bg-hsOrange text-white py-3">Masuk</Link>
          <Link href="/beranda" className="fc-link">Lihat kerangka halaman (Tahap 1)</Link>
        </div>
      </div>
    </main>
  )
}

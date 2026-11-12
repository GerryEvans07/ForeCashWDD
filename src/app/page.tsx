// Halaman depan (landing page). Isi & animasinya ada di Landing.tsx.
import type { Metadata } from 'next'
import Landing from './Landing'

export const metadata: Metadata = {
  title: { absolute: 'ForeCash — Mindful Spending, Smarter Planning' },
  description: 'ForeCash membantu mahasiswa memantau pengeluaran dan memberi peringatan sebelum saldo habis.',
}

export default function Home() {
  return <Landing />
}

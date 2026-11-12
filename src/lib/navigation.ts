import { House, Receipt, Users, CloudSun, ChartPie, MapPinned, Trophy, Eye, type LucideIcon } from 'lucide-react'

export type Warna = 'orange' | 'blue' | 'purple' | 'green' | 'pink' | 'teal' | 'yellow' | 'red'

export type MenuItem = {
  href: string
  label: string
  /** label pendek untuk tab bar HP */
  pendek: string
  icon: LucideIcon
  warna: Warna
}

// Urutan dan warna sama dengan includes/layout/header.php versi PHP.
export const MENU_MAHASISWA: MenuItem[] = [
  { href: '/beranda', label: 'Beranda', pendek: 'Beranda', icon: House, warna: 'orange' },
  { href: '/transaksi', label: 'Transaksi', pendek: 'Transaksi', icon: Receipt, warna: 'blue' },
  { href: '/utang', label: 'Utang & Patungan', pendek: 'Utang', icon: Users, warna: 'purple' },
  { href: '/prediksi', label: 'Prediksi', pendek: 'Prediksi', icon: CloudSun, warna: 'green' },
  { href: '/laporan', label: 'Laporan', pendek: 'Laporan', icon: ChartPie, warna: 'pink' },
  { href: '/petualangan', label: 'Petualangan', pendek: 'Peta', icon: MapPinned, warna: 'teal' },
  { href: '/pencapaian', label: 'Pencapaian', pendek: 'Badge', icon: Trophy, warna: 'yellow' },
]

export const MENU_ORANGTUA: MenuItem[] = [
  { href: '/pantau', label: 'Pantau Anak', pendek: 'Pantau', icon: Eye, warna: 'purple' },
]

// Judul halaman yang tampil di header (selain menu di atas).
export const JUDUL_HALAMAN: Record<string, string> = {
  '/beranda': 'Dashboard',
  '/transaksi': 'Transaksi',
  '/wallet': 'Kelola Wallet',
  '/utang': 'Utang & Patungan',
  '/prediksi': 'Prediksi & Notifikasi',
  '/laporan': 'Laporan Bulanan',
  '/petualangan': 'Petualangan',
  '/pencapaian': 'Pencapaian',
  '/akun': 'Akun',
  '/pantau': 'Pantau Anak',
}

// Rute yang wajib login (dipakai src/proxy.ts mulai Tahap 3).
export const RUTE_TERLINDUNGI = Object.keys(JUDUL_HALAMAN)

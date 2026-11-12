/** Format rupiah, contoh 'Rp 1.250.000' (sama dengan rupiah() di PHP). */
export function rupiah(n: number | string | null | undefined): string {
  const v = Math.round(Number(n) || 0)
  const s = Math.abs(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return (v < 0 ? '-Rp ' : 'Rp ') + s
}

/** Nama depan, contoh 'Momo Mahasiswa' -> 'Momo'. */
export function namaDepan(nama: string): string {
  return nama.trim().split(/\s+/)[0] || nama
}

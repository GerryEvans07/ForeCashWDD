// Logika kecil fitur Utang & Patungan (dipisah supaya bisa diuji di tests/utang.test.ts).
import { rupiah } from './format.ts'

/** Pecah teks "Budi, Siti , ,Bima" menjadi ['Budi', 'Siti', 'Bima']. */
export function daftarTeman(teks: string): string[] {
  return teks.split(',').map((s) => s.trim()).filter(Boolean).map((s) => s.slice(0, 100))
}

/** Bagian per orang (sama dengan versi PHP: round(total / jumlah orang)). */
export function bagianSplit(total: number, jumlahTeman: number, sayaIkut: boolean): number {
  const orang = jumlahTeman + (sayaIkut ? 1 : 0)
  return orang > 0 ? Math.round(total / orang) : 0
}

/** Link WhatsApp berisi pesan pengingat. Penerimanya dipilih sendiri di aplikasi WhatsApp. */
export function linkPengingatWA(nama: string, keterangan: string, nominal: number): string {
  const pesan = `Halo ${nama}, sekadar mengingatkan untuk ${keterangan} sebesar ${rupiah(nominal)}. Terima kasih!`
  return 'https://wa.me/?text=' + encodeURIComponent(pesan)
}

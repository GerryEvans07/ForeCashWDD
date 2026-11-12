// Petualangan: katalog 12 teman hemat, telur, dan data peta perjalanan.
// Port dari php-version/includes/pets.php dan journey.php (bagian logika).
// Fungsi di sini murni (tanpa database), diuji di tests/pets.test.ts.
import { tambahHari, selisihHari } from './tanggal.ts'

export const TELUR_TARGET = 7

export type TipePet = 'pig' | 'bunny' | 'bear' | 'leaf' | 'cat' | 'frog' | 'cloud' | 'tuft' | 'cow' | 'fox'
export type Pet = { nama: string; warna: string; gelap: string; tipe: TipePet; sifat: string; cerita: string }

export const PETS: Record<string, Pet> = {
  celeng: { nama: 'Celeng', warna: '#FFB3C7', gelap: '#F28AA8', tipe: 'pig', sifat: 'Rajin menabung', cerita: 'Celengan yang bisa berjalan. Setiap koin yang kamu simpan bikin perutnya makin bulat.' },
  mochi: { nama: 'Mochi', warna: '#FFFFFF', gelap: '#E3DCEB', tipe: 'bunny', sifat: 'Lembut dan sabar', cerita: 'Tidak pernah buru-buru belanja. Selalu tidur dulu sebelum memutuskan sesuatu.' },
  kopi: { nama: 'Kopi', warna: '#C99A6E', gelap: '#A5764C', tipe: 'bear', sifat: 'Pekerja keras', cerita: 'Suka begadang menemani kamu mengerjakan tugas, tapi tidak suka jajan kopi mahal.' },
  jeruk: { nama: 'Jeruk', warna: '#FFB347', gelap: '#F08A1C', tipe: 'leaf', sifat: 'Ceria', cerita: 'Saudara jauh logo ForeCash. Muncul setiap kali saldomu aman sampai akhir bulan.' },
  boba: { nama: 'Boba', warna: '#B9A3F5', gelap: '#9A80EA', tipe: 'cat', sifat: 'Penasaran', cerita: 'Suka mengintip isi dompet. Kalau melihat struk, langsung dicatat.' },
  lumut: { nama: 'Lumut', warna: '#9BE0A3', gelap: '#6CC47A', tipe: 'frog', sifat: 'Santai', cerita: 'Hidup di kolam dekat jalan. Melompat setiap kali kamu melunasi utang.' },
  awan: { nama: 'Awan', warna: '#D7ECFF', gelap: '#B4D6F7', tipe: 'cloud', sifat: 'Penyayang', cerita: 'Datang saat langit mendung untuk menghibur. Percaya hujan pasti berhenti.' },
  tahu: { nama: 'Tahu', warna: '#FFE680', gelap: '#F5CB2E', tipe: 'tuft', sifat: 'Hemat', cerita: 'Kecil tapi teliti. Tahu persis harga gorengan di setiap kantin kampus.' },
  sapi: { nama: 'Sapi', warna: '#FFFFFF', gelap: '#DCD6CC', tipe: 'cow', sifat: 'Tenang', cerita: 'Tidak pernah panik walau saldo menipis. Selalu punya rencana cadangan.' },
  kunyit: { nama: 'Kunyit', warna: '#FF9A5C', gelap: '#E8742F', tipe: 'fox', sifat: 'Cerdik', cerita: 'Jago mencari promo dan diskon mahasiswa di sekitar kampus.' },
  ubi: { nama: 'Ubi', warna: '#C79BD9', gelap: '#A773BE', tipe: 'tuft', sifat: 'Sederhana', cerita: 'Bahagia dengan hal kecil. Bekal dari rumah adalah makanan favoritnya.' },
  tempe: { nama: 'Tempe', warna: '#F2D3A0', gelap: '#DDB173', tipe: 'bear', sifat: 'Setia kawan', cerita: 'Selalu ingat siapa yang belum bayar patungan, tapi menagihnya dengan sopan.' },
}

/** Hari baik = ada transaksi tercatat dan pengeluaran hari itu tidak melewati batas harian (jika batas diatur). */
export function hitungHariBaik(transaksi: { tanggal: string; jenis: string; nominal: number }[], batasHarian: number): Set<string> {
  const keluar = new Map<string, number>()
  for (const t of transaksi) {
    keluar.set(t.tanggal, (keluar.get(t.tanggal) ?? 0) + (t.jenis === 'pengeluaran' ? Number(t.nominal) : 0))
  }
  const hasil = new Set<string>()
  for (const [tgl, total] of keluar) if (batasHarian <= 0 || total <= batasHarian) hasil.add(tgl)
  return hasil
}

/** Progres telur = jumlah hari baik SETELAH hewan terakhir menetas. */
export function progresTelur(hariBaik: Set<string>, tanggalMenetas: string[]): number {
  const sejak = tanggalMenetas.length ? tanggalMenetas.reduce((a, b) => (a > b ? a : b)) : '0000-00-00'
  return [...hariBaik].filter((d) => d > sejak).length
}

export type StatusHari = 'gajian' | 'hariini' | 'baik' | 'boros' | 'kosong' | 'cukup' | 'kurang'
export type HariPeta = { tanggal: string; status: StatusHari; keluar: number }

export type JourneyInput = {
  hariIni: string
  /** tanggal pemasukan berikutnya (null kalau belum ada jadwal) */
  pemasukanBerikut: string | null
  /** tanggal pemasukan terakhir yang sudah diterima (null kalau belum ada) */
  pemasukanTerakhir: string | null
  saldo: number
  runway: number | null
  keluarPerHari: Record<string, number>
  /** tanggal yang ada transaksinya */
  dicatat: Set<string>
  hariBaik: Set<string>
}

/** Rentang & status setiap titik di peta (port dari journey_data() di PHP). Maksimal 35 titik. */
export function dataPeta(i: JourneyInput) {
  const today = i.hariIni
  let akhir = i.pemasukanBerikut ?? tambahHari(today, 14)
  let mulai = i.pemasukanTerakhir ?? tambahHari(today, -6)
  // jaga panjang peta tetap wajar (maks. 35 titik), hari ini selalu terlihat
  if (selisihHari(mulai, akhir) > 34) {
    const a = tambahHari(akhir, -34)
    const b = tambahHari(today, -20)
    mulai = a > b ? a : b
  }
  if (selisihHari(mulai, akhir) > 34) akhir = tambahHari(mulai, 34)

  const habis = i.runway !== null ? tambahHari(today, i.runway) : null
  const hari: HariPeta[] = []
  for (let d = mulai; d <= akhir; d = tambahHari(d, 1)) {
    let status: StatusHari
    if (d === akhir && i.pemasukanBerikut) status = 'gajian'
    else if (d === today) status = 'hariini'
    else if (d < today) status = i.hariBaik.has(d) ? 'baik' : i.dicatat.has(d) ? 'boros' : 'kosong'
    else status = i.saldo > 0 && (habis === null || d <= habis) ? 'cukup' : 'kurang'
    hari.push({ tanggal: d, status, keluar: d <= today ? i.keluarPerHari[d] ?? 0 : 0 })
  }
  return { hari, mulai, akhir, adaJadwal: !!i.pemasukanBerikut }
}

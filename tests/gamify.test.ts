import test from 'node:test'
import assert from 'node:assert/strict'
import { gamify, hitungStreak, seninMingguIni, type GamifyInput } from '../src/lib/gamify.ts'
import { tambahHari } from '../src/lib/tanggal.ts'

const HARI = '2026-11-13' // Jumat
const h = (n: number) => tambahHari(HARI, n)

function input(over: Partial<GamifyInput> = {}): GamifyInput {
  return {
    hariIni: HARI, tanggalTransaksi: [], jumlahTransaksi: 0, batasHarian: 0, pengeluaranPerHari: {},
    jumlahDebt: 0, utangAktif: 0, piutangLunas: 0, punyaJadwal: false, status: 'waspada', makanMingguIni: 0, ...over,
  }
}

test('streak: dihitung mundur dari hari ini', () => {
  assert.equal(hitungStreak([HARI, h(-1), h(-2), h(-4)], HARI), 3)
})

test('streak: boleh belum mencatat hari ini (mulai dari kemarin)', () => {
  assert.equal(hitungStreak([h(-1), h(-2)], HARI), 2)
})

test('streak: putus kalau kemarin juga tidak mencatat', () => {
  assert.equal(hitungStreak([h(-2), h(-3)], HARI), 0)
})

test('senin minggu ini (minggu Senin–Minggu)', () => {
  assert.equal(seninMingguIni('2026-11-13'), '2026-11-09') // Jumat -> Senin
  assert.equal(seninMingguIni('2026-11-15'), '2026-11-09') // Minggu -> Senin sebelumnya
  assert.equal(seninMingguIni('2026-11-16'), '2026-11-16') // Senin -> hari itu
})

test('poin & level: 2 badge + streak 5 hari = 250 poin = Level 2 Hemat Muda', () => {
  const g = gamify(input({
    tanggalTransaksi: [HARI, h(-1), h(-2), h(-3), h(-4)], // streak 5
    jumlahTransaksi: 12, // badge Pencatat Pemula
    punyaJadwal: true, // badge Perencana
  }))
  assert.equal(g.streak, 5)
  assert.equal(g.badges.filter((b) => b.dapat).length, 2)
  assert.equal(g.poin, 250)
  assert.equal(g.level, 2)
  assert.equal(g.levelNama, 'Hemat Muda')
  assert.equal(g.nextPoin, 400)
})

test('poin streak maksimal 30 hari', () => {
  const tanggal = Array.from({ length: 40 }, (_, i) => h(-i))
  const g = gamify(input({ tanggalTransaksi: tanggal }))
  assert.equal(g.streak, 40)
  // badge Rajin Mencatat (100) + 30 hari x 10 = 400
  assert.equal(g.poin, 400)
})

test('hemat seminggu: hari tanpa pengeluaran juga dihitung hemat', () => {
  const g = gamify(input({ batasHarian: 50000, pengeluaranPerHari: { [HARI]: 60000, [h(-1)]: 40000 } }))
  const hemat = g.badges.find((b) => b.nama === 'Hemat Seminggu')!
  assert.equal(hemat.now, 6) // hari ini melebihi batas, 6 hari lainnya aman
  assert.equal(hemat.dapat, false)
})

test('bebas utang: harus pernah mencatat, dan tidak ada utang aktif', () => {
  assert.equal(gamify(input({ jumlahDebt: 0 })).badges[3].dapat, false)
  assert.equal(gamify(input({ jumlahDebt: 2, utangAktif: 1 })).badges[3].dapat, false)
  assert.equal(gamify(input({ jumlahDebt: 2, utangAktif: 0 })).badges[3].dapat, true)
})

test('tantangan mingguan: sisa hari sampai Minggu', () => {
  const g = gamify(input({ makanMingguIni: 150000 }))
  assert.equal(g.tantangan.sisaHari, 2) // Jumat -> Sabtu, Minggu
  assert.equal(g.tantangan.max, 200000)
})

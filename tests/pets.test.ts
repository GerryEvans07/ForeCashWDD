import test from 'node:test'
import assert from 'node:assert/strict'
import { PETS, dataPeta, hitungHariBaik, progresTelur, type JourneyInput } from '../src/lib/pets.ts'
import { tambahHari } from '../src/lib/tanggal.ts'

const HARI = '2026-11-13'
const h = (n: number) => tambahHari(HARI, n)

test('ada 12 teman hemat', () => {
  assert.equal(Object.keys(PETS).length, 12)
})

test('hari baik: mencatat & tidak melewati batas harian', () => {
  const baik = hitungHariBaik([
    { tanggal: h(-1), jenis: 'pengeluaran', nominal: 40000 }, // aman
    { tanggal: h(-2), jenis: 'pengeluaran', nominal: 60000 }, // lewat batas
    { tanggal: h(-3), jenis: 'pemasukan', nominal: 500000 }, // hanya pemasukan = baik
  ], 45000)
  assert.deepEqual([...baik].sort(), [h(-3), h(-1)])
})

test('hari baik: tanpa batas harian, semua hari yang dicatat dihitung baik', () => {
  const baik = hitungHariBaik([{ tanggal: h(-2), jenis: 'pengeluaran', nominal: 999999 }], 0)
  assert.ok(baik.has(h(-2)))
})

test('telur: hanya menghitung hari baik setelah hewan terakhir menetas', () => {
  const baik = new Set([h(-9), h(-6), h(-4), h(-1)])
  assert.equal(progresTelur(baik, [h(-10), h(-5)]), 2) // hanya h(-4) dan h(-1)
  assert.equal(progresTelur(baik, []), 4)
})

function input(over: Partial<JourneyInput> = {}): JourneyInput {
  return {
    hariIni: HARI, pemasukanBerikut: h(5), pemasukanTerakhir: h(-3), saldo: 100000, runway: 2,
    keluarPerHari: {}, dicatat: new Set([h(-2), h(-1)]), hariBaik: new Set([h(-1)]), ...over,
  }
}

test('peta: status setiap hari dari pemasukan terakhir sampai berikutnya', () => {
  const p = dataPeta(input())
  assert.equal(p.mulai, h(-3))
  assert.equal(p.akhir, h(5))
  assert.deepEqual(p.hari.map((x) => x.status), [
    'kosong', // h-3: tidak mencatat
    'boros', // h-2: mencatat tapi bukan hari baik
    'baik', // h-1
    'hariini',
    'cukup', 'cukup', // runway 2 hari
    'kurang', 'kurang',
    'gajian', // h+5
  ])
})

test('peta: tanpa jadwal, ujungnya 14 hari ke depan tanpa garis finis', () => {
  const p = dataPeta(input({ pemasukanBerikut: null, pemasukanTerakhir: null }))
  assert.equal(p.mulai, h(-6))
  assert.equal(p.akhir, h(14))
  assert.equal(p.adaJadwal, false)
  assert.ok(!p.hari.some((x) => x.status === 'gajian'))
})

test('peta: maksimal 35 titik dan hari ini tetap terlihat', () => {
  const p = dataPeta(input({ pemasukanTerakhir: h(-60), pemasukanBerikut: h(30) }))
  assert.ok(p.hari.length <= 35)
  assert.ok(p.hari.some((x) => x.status === 'hariini'))
})

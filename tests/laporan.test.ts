import test from 'node:test'
import assert from 'node:assert/strict'
import { ringkasLaporan } from '../src/lib/laporan.ts'

test('laporan: total, per kategori (terbesar dulu), rasio tabungan', () => {
  const r = ringkasLaporan([
    { jenis: 'pemasukan', nominal: 1000000, kategori: 'Uang Saku' },
    { jenis: 'pengeluaran', nominal: 250000, kategori: 'Kos / Sewa' },
    { jenis: 'pengeluaran', nominal: 85000, kategori: 'Makan & Minum' },
    { jenis: 'pengeluaran', nominal: 60000, kategori: 'Makan & Minum' },
    { jenis: 'transfer', nominal: 300000, kategori: null }, // transfer tidak dihitung
  ])
  assert.equal(r.masuk, 1000000)
  assert.equal(r.keluar, 395000)
  assert.deepEqual(r.perKategori.map((k) => k.kategori), ['Kos / Sewa', 'Makan & Minum'])
  assert.equal(r.perKategori[1].total, 145000)
  assert.equal(r.rasio, 61) // (1.000.000 - 395.000) / 1.000.000 = 60,5% -> 61 (seperti round() PHP)
})

test('laporan: tanpa pemasukan, rasio kosong; pengeluaran tanpa kategori dikelompokkan', () => {
  const r = ringkasLaporan([{ jenis: 'pengeluaran', nominal: 10000, kategori: null }])
  assert.equal(r.rasio, null)
  assert.deepEqual(r.perKategori, [{ kategori: 'Tanpa kategori', total: 10000 }])
})

test('laporan: pengeluaran lebih besar dari pemasukan, rasio minus', () => {
  const r = ringkasLaporan([
    { jenis: 'pemasukan', nominal: 100000, kategori: 'Uang Saku' },
    { jenis: 'pengeluaran', nominal: 150000, kategori: 'Hiburan' },
  ])
  assert.equal(r.rasio, -50)
})

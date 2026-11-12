// Tanggal harus mengikuti WIB walaupun server berjalan di jam UTC (Vercel).
import test from 'node:test'
import assert from 'node:assert/strict'
import { hariIni, tambahHari, selisihHari, tgl, hariKe } from '../src/lib/tanggal.ts'

test('jam 01.30 WIB masih dihitung hari yang sama (server UTC masih tanggal sebelumnya)', () => {
  assert.equal(hariIni(new Date('2026-11-12T18:30:00Z')), '2026-11-13')
  assert.equal(hariIni(new Date('2026-11-13T16:59:00Z')), '2026-11-13') // 23.59 WIB
  assert.equal(hariIni(new Date('2026-11-13T17:00:00Z')), '2026-11-14') // 00.00 WIB
})

test('tambah & selisih hari melewati akhir bulan dan tahun', () => {
  assert.equal(tambahHari('2026-12-30', 3), '2027-01-02')
  assert.equal(tambahHari('2026-03-01', -1), '2026-02-28')
  assert.equal(selisihHari('2026-11-13', '2026-11-26'), 13)
})

test('format tanggal Indonesia', () => {
  assert.equal(tgl('2026-11-13'), '13 Nov 2026')
  assert.equal(hariKe('2026-11-16'), 1) // Senin
  assert.equal(hariKe('2026-11-15'), 7) // Minggu
})

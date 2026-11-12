// Unit test algoritma peringatan dini. Jalankan: npm test
// Angka yang diharapkan dihitung manual dari rumus di php-version/includes/functions.php.
import test from 'node:test'
import assert from 'node:assert/strict'
import { forecast, proyeksi, type ForecastInput, type JadwalPemasukan } from '../src/lib/forecast.ts'
import { tambahHari } from '../src/lib/tanggal.ts'

const HARI = '2026-11-13'
const h = (n: number) => tambahHari(HARI, n) // h(-1) = kemarin, h(5) = 5 hari lagi

function jadwal(tanggal: string, status: JadwalPemasukan['status'] = 'menunggu', id = 1): JadwalPemasukan {
  return { id, sumber: 'Uang saku', nominal: 1000000, tanggal_perkiraan: tanggal, status }
}

function input(over: Partial<ForecastInput> = {}): ForecastInput {
  return { hariIni: HARI, saldo: 0, pengeluaranPertama: null, pengeluaran: [], jadwal: [], ...over }
}

test('data demo: sama dengan versi PHP', () => {
  // demo_data.sql: saldo 575.000, pengeluaran 14 hari = 675.000, uang saku 13 hari lagi
  const pengeluaran = [
    [-12, 85000], [-13, 250000], [-9, 40000], [-8, 60000], [-6, 75000], [-5, 35000], [-3, 55000], [-2, 30000], [-1, 45000],
  ].map(([d, n]) => ({ tanggal: h(d), nominal: n }))
  const f = forecast(input({ saldo: 575000, pengeluaranPertama: h(-13), pengeluaran, jadwal: [jadwal(h(13))] }))

  assert.equal(f.hari, 14) // 13 hari lalu sampai hari ini = 14 hari
  assert.equal(f.burn, 675000 / 14) // ≈ 48.214
  assert.equal(f.runway, 11) // floor(575.000 / 48.214) = 11
  assert.equal(f.habis, h(11))
  assert.equal(f.sisaHari, 13)
  assert.equal(f.status, 'waspada') // kurang 2 hari (13 - 11)
  assert.ok(Math.abs((f.batasAman ?? 0) - 575000 / 13) < 1e-9)
})

test('burn rate: pengguna baru minimal dibagi 3 hari', () => {
  const f = forecast(input({ saldo: 100000, pengeluaranPertama: HARI, pengeluaran: [{ tanggal: HARI, nominal: 30000 }] }))
  assert.equal(f.hari, 3)
  assert.equal(f.burn, 10000)
  assert.equal(f.runway, 10)
})

test('burn rate: pengguna 5 hari dibagi 5', () => {
  const f = forecast(input({ saldo: 100000, pengeluaranPertama: h(-4), pengeluaran: [{ tanggal: h(-4), nominal: 50000 }] }))
  assert.equal(f.hari, 5)
  assert.equal(f.burn, 10000)
})

test('burn rate: maksimal 14 hari, pengeluaran lebih lama tidak dihitung', () => {
  const f = forecast(input({
    saldo: 100000,
    pengeluaranPertama: h(-60),
    pengeluaran: [{ tanggal: h(-14), nominal: 999999 }, { tanggal: h(-13), nominal: 14000 }],
  }))
  assert.equal(f.hari, 14)
  assert.equal(f.burn, 1000) // hanya yang tanggal > hari ini - 14
})

test('belum ada pengeluaran: runway & tanggal habis kosong, status aman', () => {
  const f = forecast(input({ saldo: 500000, jadwal: [jadwal(h(10))] }))
  assert.equal(f.burn, 0)
  assert.equal(f.runway, null)
  assert.equal(f.habis, null)
  assert.equal(f.status, 'aman')
})

test('status aman: saldo cukup sampai pemasukan berikutnya', () => {
  const f = forecast(input({ saldo: 300000, pengeluaranPertama: h(-20), pengeluaran: [{ tanggal: HARI, nominal: 140000 }], jadwal: [jadwal(h(10))] }))
  assert.equal(f.burn, 10000)
  assert.equal(f.runway, 30)
  assert.equal(f.status, 'aman')
})

test('status waspada: kurang tepat 3 hari', () => {
  const f = forecast(input({ saldo: 70000, pengeluaranPertama: h(-20), pengeluaran: [{ tanggal: HARI, nominal: 140000 }], jadwal: [jadwal(h(10))] }))
  assert.equal(f.runway, 7)
  assert.equal(f.status, 'waspada')
})

test('status kritis: kurang lebih dari 3 hari', () => {
  const f = forecast(input({ saldo: 60000, pengeluaranPertama: h(-20), pengeluaran: [{ tanggal: HARI, nominal: 140000 }], jadwal: [jadwal(h(10))] }))
  assert.equal(f.runway, 6)
  assert.equal(f.status, 'kritis')
})

test('status kritis: saldo habis atau minus', () => {
  assert.equal(forecast(input({ saldo: 0 })).status, 'kritis')
  const f = forecast(input({ saldo: -5000, pengeluaranPertama: h(-20), pengeluaran: [{ tanggal: HARI, nominal: 14000 }] }))
  assert.equal(f.status, 'kritis')
  assert.equal(f.runway, 0) // saldo minus dianggap 0
})

test('status waspada: ada pemasukan yang terlambat', () => {
  const f = forecast(input({ saldo: 500000, jadwal: [jadwal(h(-2), 'menunggu', 1), jadwal(h(20), 'menunggu', 2)] }))
  assert.equal(f.terlambat.length, 1)
  assert.equal(f.next?.id, 2)
  assert.equal(f.status, 'waspada')
})

test('jadwal yang sudah diterima diabaikan', () => {
  const f = forecast(input({ saldo: 500000, jadwal: [jadwal(h(-2), 'diterima'), jadwal(h(3), 'diterima')] }))
  assert.equal(f.next, null)
  assert.equal(f.terlambat.length, 0)
  assert.equal(f.sisaHari, null)
  assert.equal(f.batasAman, null)
})

test('pemasukan berikutnya = jadwal terdekat, hari ini termasuk', () => {
  const f = forecast(input({ saldo: 100000, jadwal: [jadwal(h(9), 'menunggu', 1), jadwal(HARI, 'menunggu', 2)] }))
  assert.equal(f.next?.id, 2)
  assert.equal(f.sisaHari, 0)
  assert.equal(f.batasAman, null) // sisa hari 0 → tidak dihitung (sama dengan PHP)
})

test('proyeksi saldo harian tidak pernah minus', () => {
  const p = proyeksi({ saldo: 25000, burn: 10000 }, HARI, 4)
  assert.deepEqual(p.map((x) => x.saldo), [25000, 15000, 5000, 0, 0])
  assert.equal(p[0].tanggal, HARI)
  assert.equal(p.length, 5)
})

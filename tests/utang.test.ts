import test from 'node:test'
import assert from 'node:assert/strict'
import { bagianSplit, daftarTeman, linkPengingatWA } from '../src/lib/utang.ts'

test('split bill: saya ikut menanggung', () => {
  // Rp 120.000 dibagi 3 teman + saya = Rp 30.000 per orang
  assert.equal(bagianSplit(120000, 3, true), 30000)
})

test('split bill: saya tidak ikut menanggung', () => {
  assert.equal(bagianSplit(120000, 3, false), 40000)
})

test('split bill: dibulatkan ke rupiah terdekat', () => {
  assert.equal(bagianSplit(100000, 2, true), 33333)
})

test('nama teman: spasi & koma kosong diabaikan', () => {
  assert.deepEqual(daftarTeman(' Budi, Siti , ,Bima,'), ['Budi', 'Siti', 'Bima'])
})

test('link WhatsApp berisi pesan yang sudah di-encode', () => {
  const url = linkPengingatWA('Andi', 'Patungan makan', 28000)
  assert.ok(url.startsWith('https://wa.me/?text='))
  assert.equal(decodeURIComponent(url.split('text=')[1]), 'Halo Andi, sekadar mengingatkan untuk Patungan makan sebesar Rp 28.000. Terima kasih!')
})

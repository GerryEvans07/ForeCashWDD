import test from 'node:test'
import assert from 'node:assert/strict'
import { buatJawaban, deteksiIntent } from '../src/lib/chatbot.ts'
import { forecast } from '../src/lib/forecast.ts'

test('intent: pertanyaan umum dikenali', () => {
  assert.equal(deteksiIntent('Cek saldo'), 'saldo')
  assert.equal(deteksiIntent('Kapan uangku habis?'), 'habis')
  assert.equal(deteksiIntent('Tips hemat dong'), 'tips')
  assert.equal(deteksiIntent('berapa burn rate aku'), 'burn')
  assert.equal(deteksiIntent('Utang & piutang'), 'utang')
  assert.equal(deteksiIntent('Level aku'), 'badge')
  assert.equal(deteksiIntent('cara isi gopay'), 'transfer')
  assert.equal(deteksiIntent('upload foto struk gimana'), 'struk')
  assert.equal(deteksiIntent('cara catat pengeluaran'), 'catat')
  assert.equal(deteksiIntent('halo'), 'sapa')
  assert.equal(deteksiIntent('cuaca besok'), 'tidak_paham')
})

test('intent: "saldo cukup gak?" masuk ke prediksi, bukan cek saldo', () => {
  assert.equal(deteksiIntent('saldo aku cukup gak sampai kiriman?'), 'habis')
})

test('jawaban "kapan habis" memakai hasil forecast', () => {
  const f = forecast({
    hariIni: '2026-11-13', saldo: 100000, pengeluaranPertama: '2026-10-01',
    pengeluaran: [{ tanggal: '2026-11-13', nominal: 140000 }],
    jadwal: [{ id: 1, sumber: 'Uang saku', nominal: 1e6, tanggal_perkiraan: '2026-11-20', status: 'menunggu' }],
  })
  const j = buatJawaban('habis', { namaDepan: 'Momo', f })
  assert.match(j, /Rp 10\.000\/hari/)
  assert.match(j, /23 Nov 2026/) // 100.000 / 10.000 = 10 hari
  assert.match(j, /AMAN/)
})

test('jawaban utang kosong', () => {
  const j = buatJawaban('utang', { namaDepan: 'Momo', utang: { piutangTotal: 0, piutangN: 0, utangTotal: 0, utangN: 0 } })
  assert.equal(j, 'Tidak ada utang atau piutang yang belum lunas. Mantap!')
})

test('jawaban tips memakai kategori pengeluaran terbesar', () => {
  const j = buatJawaban('tips', { namaDepan: 'Momo', kategoriTeratas: { kategori: 'Makan & Minum', total: 245000, totalKeluar: 675000 } })
  assert.match(j, /Makan & Minum/)
  assert.match(j, /36%/)
  assert.match(j, /bawa bekal/)
})

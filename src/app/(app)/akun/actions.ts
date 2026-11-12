'use server'

// Aksi halaman Akun (port dari blok "if POST" di php-version/pages/akun.php).
import { revalidatePath } from 'next/cache'
import { wajibLogin } from '@/lib/auth'
import { angka, gagal, sukses, teks, type Hasil } from '@/lib/aksi'
import { validAvatar } from '@/components/Avatar'

export async function simpanProfil(_prev: Hasil, fd: FormData): Promise<Hasil> {
  const { supabase, user, profil } = await wajibLogin()
  const nama = teks(fd, 'nama').slice(0, 100)
  const email = teks(fd, 'email').toLowerCase()
  if (!nama || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return gagal('Nama dan email yang valid wajib diisi.')

  const { error } = await supabase.from('profiles').update({ nama, avatar: validAvatar(teks(fd, 'avatar')) }).eq('id', profil.id)
  if (error) return gagal('Gagal menyimpan: ' + error.message)
  revalidatePath('/', 'layout') // nama & avatar di sidebar ikut berubah

  // ganti email lewat Supabase Auth: link konfirmasi dikirim ke email baru
  if (email !== (user.email ?? '').toLowerCase()) {
    const { error: e } = await supabase.auth.updateUser({ email })
    if (e) {
      return gagal(/already|registered|exists/i.test(e.message) ? 'Email sudah dipakai akun lain.' : 'Profil disimpan, tapi email gagal diganti: ' + e.message)
    }
    return sukses('Profil diperbarui. Cek email baru untuk mengonfirmasi perubahan email.')
  }
  return sukses('Profil diperbarui.')
}

export async function gantiPassword(_prev: Hasil, fd: FormData): Promise<Hasil> {
  const { supabase, user } = await wajibLogin()
  const lama = String(fd.get('lama') ?? '')
  const baru = String(fd.get('baru') ?? '')
  if (baru.length < 8) return gagal('Kata sandi baru minimal 8 karakter.')

  // akun yang daftar lewat email wajib memasukkan kata sandi lama (sama seperti versi PHP).
  // akun Google belum punya kata sandi, jadi langsung dibuatkan.
  const punyaSandi = (user.identities ?? []).some((i) => i.provider === 'email')
  if (punyaSandi) {
    const { error } = await supabase.auth.signInWithPassword({ email: user.email!, password: lama })
    if (error) return gagal('Kata sandi lama salah.')
  }
  const { error } = await supabase.auth.updateUser({ password: baru })
  if (error) return gagal(/different from the old/i.test(error.message) ? 'Kata sandi baru harus berbeda dari yang lama.' : 'Gagal mengganti: ' + error.message)
  return sukses('Kata sandi diganti.')
}

export async function buatKodeBaru(): Promise<Hasil> {
  const { supabase } = await wajibLogin('mahasiswa')
  const { error } = await supabase.rpc('ganti_kode_hubung')
  if (error) return gagal(error.message)
  revalidatePath('/akun')
  return sukses('Kode hubung baru dibuat. Kode lama tidak berlaku lagi.')
}

export async function cabutAkses(_prev: Hasil, fd: FormData): Promise<Hasil> {
  const { supabase, profil } = await wajibLogin('mahasiswa')
  await supabase.from('parent_links').delete().eq('id', angka(fd, 'id')).eq('student_id', profil.id)
  revalidatePath('/akun')
  return sukses('Akses orang tua dicabut.')
}

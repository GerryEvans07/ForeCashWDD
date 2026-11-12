// Upload foto struk ke Supabase Storage (bucket privat "struk").
// Port dari php-version/includes/upload.php:
// - tipe file dicek dari ISI file (byte awal), bukan dari nama/ekstensi
// - ukuran maksimal 2 MB
// - nama file diganti acak, disimpan di folder <id-user>/
import type { SupabaseClient } from '@supabase/supabase-js'

export const STRUK_MAX = 2 * 1024 * 1024
const BUCKET = 'struk'

function jenisGambar(b: Uint8Array): { mime: string; ext: string } | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { mime: 'image/jpeg', ext: 'jpg' }
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return { mime: 'image/png', ext: 'png' }
  const ascii = (s: number, e: number) => String.fromCharCode(...b.slice(s, e))
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return { mime: 'image/webp', ext: 'webp' }
  return null
}

/** Ambil file dari form. null = tidak ada file dipilih. */
export function ambilFile(fd: FormData, nama = 'bukti'): File | null {
  const f = fd.get(nama)
  return f instanceof File && f.size > 0 ? f : null
}

/** Simpan foto. Hasil: { path } atau { error }. */
export async function simpanStruk(supabase: SupabaseClient, uid: string, file: File): Promise<{ path?: string; error?: string }> {
  if (file.size > STRUK_MAX) return { error: 'Ukuran foto struk maksimal 2 MB.' }
  const bytes = new Uint8Array(await file.arrayBuffer())
  const jenis = jenisGambar(bytes)
  if (!jenis) return { error: 'Foto struk harus berformat JPG, PNG, atau WEBP.' }

  const acak = Array.from(crypto.getRandomValues(new Uint8Array(16)), (x) => x.toString(16).padStart(2, '0')).join('')
  const path = `${uid}/${acak}.${jenis.ext}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, { contentType: jenis.mime, upsert: false })
  if (error) return { error: 'Foto struk gagal disimpan. Coba lagi.' }
  return { path }
}

export async function hapusStruk(supabase: SupabaseClient, path: string | null | undefined) {
  if (path) await supabase.storage.from(BUCKET).remove([path])
}

/** Link sementara (60 detik) untuk menampilkan foto. */
export async function linkStruk(supabase: SupabaseClient, path: string, detik = 60) {
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, detik)
  return data?.signedUrl ?? null
}

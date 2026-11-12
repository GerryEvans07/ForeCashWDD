'use client'

// Menjalankan Server Action dari form dan menyimpan hasilnya (pesan sukses/error).
// Isian form TIDAK hilang kalau ada error; form dikosongkan hanya kalau berhasil.
import { useActionState, useEffect, useRef, useTransition } from 'react'
import type { Hasil } from '@/lib/aksi'

type Opsi = {
  /** kosongkan form setelah berhasil (default: true) */
  resetOk?: boolean
  /** cek sebelum dikirim, misalnya konfirmasi nominal besar. false = batal kirim */
  sebelum?: (form: HTMLFormElement) => boolean
}

export function useAksi(aksi: (prev: Hasil, fd: FormData) => Promise<Hasil>, { resetOk = true, sebelum }: Opsi = {}) {
  const [hasil, dispatch, pending] = useActionState(aksi, null)
  const [, startTransition] = useTransition()
  const ref = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (hasil?.ok && resetOk) ref.current?.reset()
  }, [hasil, resetOk])

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    if (sebelum && !sebelum(form)) return
    const fd = new FormData(form)
    startTransition(() => dispatch(fd))
  }

  return { hasil, pending, onSubmit, ref }
}

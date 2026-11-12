// Next.js 16: "middleware.ts" sudah diganti namanya menjadi "proxy.ts".
// Berjalan sebelum setiap halaman dibuka. Isinya ada di src/lib/supabase/session.ts.
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/session'

export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  // semua alamat kecuali file statis (gambar, ikon, file build Next.js)
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}

-- =====================================================================
-- ForeCash — daftar orang tua yang terhubung (untuk halaman Akun mahasiswa)
-- Mahasiswa tidak boleh membaca profil orang lain lewat RLS, jadi nama & email
-- orang tua yang terhubung diambil lewat fungsi khusus ini (hanya miliknya sendiri).
-- =====================================================================

create or replace function public.daftar_orangtua()
returns table (link_id bigint, nama text, email text)
language sql stable security definer set search_path = public
as $$
  select l.id, p.nama, u.email::text
    from public.parent_links l
    join public.profiles p on p.id = l.parent_id
    join auth.users u on u.id = l.parent_id
   where l.student_id = auth.uid()
   order by l.created_at
$$;

revoke execute on function public.daftar_orangtua() from public, anon;
grant execute on function public.daftar_orangtua() to authenticated;

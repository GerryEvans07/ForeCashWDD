-- =====================================================================
-- ForeCash — catatan email peringatan "Kritis"
-- Email peringatan dikirim maksimal SEKALI per hari per user,
-- supaya tidak terkirim setiap kali Beranda dibuka.
-- =====================================================================

alter table public.profiles add column if not exists email_kritis_terakhir date;

-- Mengembalikan true (dan mencatat tanggal hari ini) kalau hari ini belum dikirim.
-- Dipanggil dari Beranda saat status Kritis.
create or replace function public.boleh_kirim_email_kritis()
returns boolean
language plpgsql security definer set search_path = public
as $$
begin
  update public.profiles
     set email_kritis_terakhir = public.hari_ini_wib()
   where id = auth.uid()
     and (email_kritis_terakhir is distinct from public.hari_ini_wib());
  return found;
end $$;

revoke execute on function public.boleh_kirim_email_kritis() from public, anon;
grant execute on function public.boleh_kirim_email_kritis() to authenticated;

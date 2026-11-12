-- =====================================================================
-- ForeCash — Row Level Security (RLS)
-- Aturan dasar: user hanya bisa melihat & mengubah datanya sendiri.
-- Pengecualian: orang tua yang sudah terhubung boleh MELIHAT (tidak mengubah)
-- data anaknya. Ini pengganti pengecekan "WHERE user_id = ?" di versi PHP.
-- =====================================================================

-- ---------- fungsi bantu
-- boleh_lihat(uid): true jika uid = saya, atau uid adalah anak yang terhubung dengan saya.
-- security definer: boleh membaca parent_links tanpa terhalang RLS (mencegah loop aturan).
create or replace function public.boleh_lihat(uid uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select uid = auth.uid()
      or exists (select 1 from public.parent_links l where l.parent_id = auth.uid() and l.student_id = uid)
$$;

-- versi teks, untuk nama folder di Storage (folder = id user)
create or replace function public.boleh_lihat_folder(folder text)
returns boolean
language sql stable security definer set search_path = public
as $$
  select folder = auth.uid()::text
      or exists (select 1 from public.parent_links l where l.parent_id = auth.uid() and l.student_id::text = folder)
$$;

-- wallet ini milik saya?
create or replace function public.wallet_milik_saya(wid bigint)
returns boolean
language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.wallets w where w.id = wid and w.user_id = auth.uid()) $$;

-- kategori ini boleh saya pakai? (bawaan atau buatan saya)
create or replace function public.kategori_boleh_dipakai(cid bigint)
returns boolean
language sql stable security definer set search_path = public
as $$ select cid is null or exists (select 1 from public.categories c where c.id = cid and (c.user_id is null or c.user_id = auth.uid())) $$;

-- ---------- nyalakan RLS di semua tabel
alter table public.profiles          enable row level security;
alter table public.parent_links      enable row level security;
alter table public.wallets           enable row level security;
alter table public.categories        enable row level security;
alter table public.transactions      enable row level security;
alter table public.income_schedules  enable row level security;
alter table public.debts             enable row level security;
alter table public.user_pets         enable row level security;

-- ---------- profiles
create policy "profil: lihat milik sendiri / anak" on public.profiles
  for select to authenticated using (public.boleh_lihat(id));
create policy "profil: ubah milik sendiri" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
-- kolom yang boleh diubah user hanya nama, batas harian, dan avatar
-- (role & kode hubung tidak bisa diubah sembarangan dari browser)
revoke update on public.profiles from authenticated, anon;
grant update (nama, batas_harian, avatar) on public.profiles to authenticated;

-- ---------- parent_links (dibuat lewat fungsi hubungkan_anak, boleh diputus kedua pihak)
create policy "hubungan: lihat" on public.parent_links
  for select to authenticated using (parent_id = (select auth.uid()) or student_id = (select auth.uid()));
create policy "hubungan: putus" on public.parent_links
  for delete to authenticated using (parent_id = (select auth.uid()) or student_id = (select auth.uid()));

-- ---------- wallets
create policy "wallet: lihat" on public.wallets
  for select to authenticated using (public.boleh_lihat(user_id));
create policy "wallet: tambah" on public.wallets
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "wallet: ubah" on public.wallets
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "wallet: hapus" on public.wallets
  for delete to authenticated using (user_id = (select auth.uid()));

-- ---------- categories
create policy "kategori: lihat bawaan & milik sendiri" on public.categories
  for select to authenticated using (user_id is null or public.boleh_lihat(user_id));
create policy "kategori: tambah" on public.categories
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "kategori: ubah" on public.categories
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "kategori: hapus" on public.categories
  for delete to authenticated using (user_id = (select auth.uid()));

-- ---------- transactions (wallet & kategori yang dipakai juga harus milik sendiri)
create policy "transaksi: lihat" on public.transactions
  for select to authenticated using (public.boleh_lihat(user_id));
create policy "transaksi: tambah" on public.transactions
  for insert to authenticated with check (
    user_id = (select auth.uid())
    and public.wallet_milik_saya(wallet_id)
    and (wallet_tujuan_id is null or public.wallet_milik_saya(wallet_tujuan_id))
    and public.kategori_boleh_dipakai(category_id)
  );
create policy "transaksi: ubah" on public.transactions
  for update to authenticated using (user_id = (select auth.uid())) with check (
    user_id = (select auth.uid())
    and public.wallet_milik_saya(wallet_id)
    and (wallet_tujuan_id is null or public.wallet_milik_saya(wallet_tujuan_id))
    and public.kategori_boleh_dipakai(category_id)
  );
create policy "transaksi: hapus" on public.transactions
  for delete to authenticated using (user_id = (select auth.uid()));

-- ---------- income_schedules, debts, user_pets: pola yang sama
create policy "jadwal: lihat" on public.income_schedules for select to authenticated using (public.boleh_lihat(user_id));
create policy "jadwal: tambah" on public.income_schedules for insert to authenticated with check (user_id = (select auth.uid()));
create policy "jadwal: ubah" on public.income_schedules for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "jadwal: hapus" on public.income_schedules for delete to authenticated using (user_id = (select auth.uid()));

create policy "utang: lihat" on public.debts for select to authenticated using (public.boleh_lihat(user_id));
create policy "utang: tambah" on public.debts for insert to authenticated with check (user_id = (select auth.uid()));
create policy "utang: ubah" on public.debts for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "utang: hapus" on public.debts for delete to authenticated using (user_id = (select auth.uid()));

create policy "pet: lihat" on public.user_pets for select to authenticated using (public.boleh_lihat(user_id));
create policy "pet: tambah" on public.user_pets for insert to authenticated with check (user_id = (select auth.uid()));
create policy "pet: ubah" on public.user_pets for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- view saldo ikut RLS tabel wallets & transactions (security_invoker)
grant select on public.wallet_saldo to authenticated;

-- ---------- fungsi yang dipanggil dari website (RPC)

-- Orang tua memasukkan kode hubung anak. Mengembalikan id & nama anak.
create or replace function public.hubungkan_anak(kode text)
returns table (id uuid, nama text)
language plpgsql security definer set search_path = public
as $$
declare
  anak public.profiles%rowtype;
begin
  if (select p.role from public.profiles p where p.id = auth.uid()) is distinct from 'orangtua' then
    raise exception 'Hanya akun orang tua yang bisa menghubungkan anak.';
  end if;
  select * into anak from public.profiles p
   where p.kode_hubung = upper(trim(kode)) and p.role = 'mahasiswa';
  if not found then
    raise exception 'Kode tidak ditemukan. Minta kode terbaru di menu Akun milik mahasiswa.';
  end if;
  insert into public.parent_links (parent_id, student_id) values (auth.uid(), anak.id)
  on conflict (parent_id, student_id) do nothing;
  return query select anak.id, anak.nama;
end $$;

-- Mahasiswa membuat kode hubung baru (kode lama tidak berlaku lagi).
create or replace function public.ganti_kode_hubung()
returns text
language plpgsql security definer set search_path = public
as $$
declare
  kode text := public.buat_kode_hubung();
begin
  update public.profiles set kode_hubung = kode where id = auth.uid() and role = 'mahasiswa';
  if not found then raise exception 'Hanya akun mahasiswa yang punya kode hubung.'; end if;
  return kode;
end $$;

-- Pilih teman hemat yang menemani (hanya satu yang dipakai pada satu waktu).
create or replace function public.pakai_pet(p_pet text)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not exists (select 1 from public.user_pets where user_id = auth.uid() and pet_id = p_pet) then
    raise exception 'Teman hemat ini belum menetas.';
  end if;
  update public.user_pets set dipakai = (pet_id = p_pet) where user_id = auth.uid();
end $$;

-- fungsi bantu internal tidak perlu dipanggil dari browser
revoke execute on function public.buat_kode_hubung() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.hubungkan_anak(text) from public, anon;
revoke execute on function public.ganti_kode_hubung() from public, anon;
revoke execute on function public.pakai_pet(text) from public, anon;
grant execute on function public.hubungkan_anak(text) to authenticated;
grant execute on function public.ganti_kode_hubung() to authenticated;
grant execute on function public.pakai_pet(text) to authenticated;

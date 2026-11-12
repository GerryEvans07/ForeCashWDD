-- =====================================================================
-- ForeCash — skema database (Supabase / PostgreSQL)
-- Pindahan dari php-version/database/schema.sql (MySQL).
--
-- Cara menjalankan: Supabase → SQL Editor → New query → tempel isi file
-- ini → Run. Jalankan file migrations berurutan (0001, 0002, 0003).
--
-- Perbedaan dengan versi MySQL:
-- * Tabel users diganti "profiles". Email & password diurus Supabase Auth
--   (tabel auth.users), jadi tabel password_resets tidak diperlukan lagi.
-- * ID user berupa UUID dari Supabase Auth.
-- * Kolom user_id otomatis terisi auth.uid() (user yang sedang login).
-- * Tanggal default memakai zona waktu Asia/Jakarta.
-- =====================================================================

-- ---------- tanggal hari ini di WIB (dipakai sebagai default kolom tanggal)
create or replace function public.hari_ini_wib()
returns date
language sql stable
as $$ select (now() at time zone 'Asia/Jakarta')::date $$;

-- ---------- profil pengguna (1 baris per akun di auth.users)
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  nama          text not null check (char_length(nama) between 1 and 100),
  role          text not null default 'mahasiswa' check (role in ('mahasiswa', 'orangtua')),
  kode_hubung   text unique,                      -- kode 8 huruf yang dibagikan mahasiswa ke orang tua
  batas_harian  numeric(12,2) not null default 0 check (batas_harian >= 0),
  avatar        text not null default 'a1' check (avatar in ('a1','a2','a3','a4','a5','a6')),
  created_at    timestamptz not null default now()
);

-- ---------- relasi orang tua <-> mahasiswa (many-to-many)
create table public.parent_links (
  id          bigint generated always as identity primary key,
  parent_id   uuid not null references public.profiles(id) on delete cascade,
  student_id  uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (parent_id, student_id)
);

-- ---------- wallet (setiap mahasiswa otomatis punya wallet "Utama")
create table public.wallets (
  id          bigint generated always as identity primary key,
  user_id     uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  nama        text not null check (char_length(nama) between 1 and 50),
  tipe        text not null default 'tunai' check (tipe in ('tunai', 'bank', 'ewallet')),
  saldo_awal  numeric(12,2) not null default 0,
  created_at  timestamptz not null default now()
);
create index wallets_user_idx on public.wallets(user_id);

-- ---------- kategori (user_id NULL = kategori bawaan untuk semua pengguna)
create table public.categories (
  id       bigint generated always as identity primary key,
  user_id  uuid references public.profiles(id) on delete cascade default auth.uid(),
  nama     text not null check (char_length(nama) between 1 and 50),
  jenis    text not null check (jenis in ('pemasukan', 'pengeluaran'))
);
create index categories_user_idx on public.categories(user_id);

-- ---------- transaksi
-- jenis 'transfer' = pindah saldo antar wallet, TIDAK dihitung sebagai pemasukan/pengeluaran
create table public.transactions (
  id                bigint generated always as identity primary key,
  user_id           uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  wallet_id         bigint not null references public.wallets(id) on delete cascade,
  wallet_tujuan_id  bigint references public.wallets(id) on delete cascade,
  category_id       bigint references public.categories(id) on delete set null,
  jenis             text not null check (jenis in ('pemasukan', 'pengeluaran', 'transfer')),
  nominal           numeric(12,2) not null check (nominal > 0),
  keterangan        text not null check (char_length(keterangan) between 1 and 150),
  tanggal           date not null default public.hari_ini_wib(),
  bukti             text,                          -- path foto struk di Storage bucket "struk"
  created_at        timestamptz not null default now(),
  -- transfer wajib punya wallet tujuan yang berbeda; jenis lain tidak boleh punya wallet tujuan
  constraint transfer_valid check (
    (jenis = 'transfer' and wallet_tujuan_id is not null and wallet_tujuan_id <> wallet_id)
    or (jenis <> 'transfer' and wallet_tujuan_id is null)
  )
);
create index transactions_user_tanggal_idx on public.transactions(user_id, tanggal desc);

-- ---------- jadwal pemasukan (uang saku, honor, beasiswa) untuk prediksi
create table public.income_schedules (
  id                 bigint generated always as identity primary key,
  user_id            uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  sumber             text not null check (char_length(sumber) between 1 and 50),
  nominal            numeric(12,2) not null check (nominal > 0),
  tanggal_perkiraan  date not null,
  status             text not null default 'menunggu' check (status in ('menunggu', 'diterima'))
);
create index income_user_idx on public.income_schedules(user_id, tanggal_perkiraan);

-- ---------- utang & piutang
create table public.debts (
  id           bigint generated always as identity primary key,
  user_id      uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  nama_teman   text not null check (char_length(nama_teman) between 1 and 100),
  keterangan   text not null check (char_length(keterangan) between 1 and 150),
  nominal      numeric(12,2) not null check (nominal > 0),
  arah         text not null check (arah in ('piutang', 'utang')),   -- piutang = teman utang ke saya
  status       text not null default 'belum' check (status in ('belum', 'lunas')),
  jatuh_tempo  date,
  created_at   timestamptz not null default now()
);
create index debts_user_idx on public.debts(user_id, status);

-- ---------- teman hemat (hewan dari telur, fitur Petualangan)
create table public.user_pets (
  id            bigint generated always as identity primary key,
  user_id       uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  pet_id        text not null,                     -- kunci katalog di src/lib/pets.ts
  menetas_pada  date not null default public.hari_ini_wib(),
  dipakai       boolean not null default false,    -- true = sedang menemani di peta & dashboard
  unique (user_id, pet_id)
);

-- ---------- saldo per wallet (pengganti wallets_with_balance() di PHP)
-- saldo = saldo awal + pemasukan - pengeluaran - transfer keluar + transfer masuk
-- security_invoker = true: view ikut aturan RLS milik user yang membuka.
create view public.wallet_saldo
with (security_invoker = true) as
select
  w.id, w.user_id, w.nama, w.tipe, w.saldo_awal,
  w.saldo_awal
    + coalesce((select sum(t.nominal) from public.transactions t where t.wallet_id = w.id and t.jenis = 'pemasukan'), 0)
    - coalesce((select sum(t.nominal) from public.transactions t where t.wallet_id = w.id and t.jenis in ('pengeluaran', 'transfer')), 0)
    + coalesce((select sum(t.nominal) from public.transactions t where t.wallet_tujuan_id = w.id and t.jenis = 'transfer'), 0)
    as saldo
from public.wallets w;

-- ---------- kategori bawaan (sama dengan versi PHP)
insert into public.categories (user_id, nama, jenis) values
  (null, 'Makan & Minum', 'pengeluaran'),
  (null, 'Transportasi', 'pengeluaran'),
  (null, 'Kos / Sewa', 'pengeluaran'),
  (null, 'Kebutuhan Kuliah', 'pengeluaran'),
  (null, 'Hiburan', 'pengeluaran'),
  (null, 'Lainnya', 'pengeluaran'),
  (null, 'Uang Saku', 'pemasukan'),
  (null, 'Kerja Sampingan', 'pemasukan'),
  (null, 'Beasiswa', 'pemasukan'),
  (null, 'Pelunasan Utang/Piutang', 'pemasukan'),
  (null, 'Pelunasan Utang/Piutang', 'pengeluaran');

-- =====================================================================
-- Otomatis saat ada akun baru di Supabase Auth (daftar email atau Google):
-- buat profil + wallet "Utama" (khusus mahasiswa) + kode hubung.
-- Data nama/role/avatar dikirim dari form daftar lewat options.data.
-- =====================================================================
create or replace function public.buat_kode_hubung()
returns text
language plpgsql
as $$
declare
  huruf constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';  -- tanpa O/0/I/1 supaya tidak tertukar
  kode text;
begin
  loop
    kode := '';
    for i in 1..8 loop
      kode := kode || substr(huruf, 1 + floor(random() * length(huruf))::int, 1);
    end loop;
    exit when not exists (select 1 from public.profiles where kode_hubung = kode);
  end loop;
  return kode;
end $$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  meta  jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_role text := case when meta->>'role' = 'orangtua' then 'orangtua' else 'mahasiswa' end;
  v_nama text := left(coalesce(nullif(trim(meta->>'nama'), ''), nullif(trim(meta->>'full_name'), ''),
                               nullif(trim(meta->>'name'), ''), split_part(new.email, '@', 1)), 100);
  v_avatar text := case when meta->>'avatar' in ('a1','a2','a3','a4','a5','a6') then meta->>'avatar' else 'a1' end;
begin
  insert into public.profiles (id, nama, role, avatar, kode_hubung)
  values (new.id, v_nama, v_role, v_avatar,
          case when v_role = 'mahasiswa' then public.buat_kode_hubung() end);

  if v_role = 'mahasiswa' then
    insert into public.wallets (user_id, nama, tipe) values (new.id, 'Utama', 'tunai');
  end if;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

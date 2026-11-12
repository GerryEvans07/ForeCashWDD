-- =====================================================================
-- ForeCash — Storage untuk foto struk
-- Bucket "struk" bersifat PRIVAT (tidak bisa dibuka lewat link biasa),
-- sama seperti folder uploads/struk yang dikunci .htaccess di versi PHP.
-- Aturan versi PHP tetap berlaku: JPG/PNG/WEBP, maksimal 2 MB.
--
-- Setiap file disimpan di folder bernama id user, contoh:
--   struk/<id-user>/<nama-acak>.jpg
-- Gambar ditampilkan lewat "signed URL" yang hanya berlaku beberapa menit.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('struk', 'struk', false, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "struk: lihat milik sendiri / anak" on storage.objects
  for select to authenticated
  using (bucket_id = 'struk' and public.boleh_lihat_folder((storage.foldername(name))[1]));

create policy "struk: unggah ke folder sendiri" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'struk' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "struk: ganti milik sendiri" on storage.objects
  for update to authenticated
  using (bucket_id = 'struk' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "struk: hapus milik sendiri" on storage.objects
  for delete to authenticated
  using (bucket_id = 'struk' and (storage.foldername(name))[1] = (select auth.uid())::text);

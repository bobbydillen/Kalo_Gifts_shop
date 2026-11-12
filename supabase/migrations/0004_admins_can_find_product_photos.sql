-- Applied after 0003.
--
-- Deleting a photo through the Storage service first has to find it, which needs permission to
-- read it. Without this rule a delete silently did nothing and the file stayed behind.
-- Visitors still view photos through the bucket's public address; this only lets admins look them up.
create policy "admins read product photos" on storage.objects
  for select to authenticated
  using (bucket_id = 'product-images' and (select private.is_admin()));

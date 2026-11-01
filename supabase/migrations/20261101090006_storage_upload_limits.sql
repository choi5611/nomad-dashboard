-- 버킷 용량·형식 제한 (예전엔 무제한·아무 형식이라 한 사람이 무료 저장 공간을 다 채울 수 있었음)
update storage.buckets set file_size_limit = 2 * 1024 * 1024,  allowed_mime_types = array['image/*'] where id = 'avatars';
update storage.buckets set file_size_limit = 10 * 1024 * 1024, allowed_mime_types = array['image/*'] where id = 'post-images';
update storage.buckets set file_size_limit = 50 * 1024 * 1024, allowed_mime_types = array['video/*'] where id = 'post-videos';

-- post-images 업로드도 avatars·post-videos처럼 본인 폴더(user id)로만
-- 되돌리기: create policy "Authenticated Upload" on storage.objects for insert with check ((bucket_id = 'post-images') and (auth.role() = 'authenticated'));
drop policy if exists "Authenticated Upload" on storage.objects;
create policy "Users can upload post-images to own folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'post-images' and (storage.foldername(name))[1] = auth.uid()::text);

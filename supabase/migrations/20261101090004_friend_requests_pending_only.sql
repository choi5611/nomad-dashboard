-- 친구 요청은 pending으로만 만들 수 있게 (예전엔 status: 'accepted'로 넣으면 동의 없이 바로 친구가 됨)
-- 되돌리기: ... with check (auth.uid() = user_id)
drop policy if exists "Users can send friend requests" on public.friendships;
create policy "Users can send friend requests" on public.friendships
  for insert with check (auth.uid() = user_id and friend_id <> user_id and status = 'pending');

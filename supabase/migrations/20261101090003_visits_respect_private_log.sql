-- "여행 기록 숨기기"(is_private_log)를 DB에서도 지킨다: 본인 또는 공개한 사람의 방문만 보임
-- 되돌리기: create policy "Visits are viewable by everyone" on public.visits for select using (true);
--          create policy "Users can view their own visits" on public.visits for select using (auth.uid() = user_id);
drop policy if exists "Visits are viewable by everyone" on public.visits;
drop policy if exists "Users can view their own visits" on public.visits;
create policy "Visits viewable unless travel log is private" on public.visits
  for select using (
    auth.uid() = user_id
    or not exists (select 1 from public.profiles p where p.id = visits.user_id and p.is_private_log)
  );

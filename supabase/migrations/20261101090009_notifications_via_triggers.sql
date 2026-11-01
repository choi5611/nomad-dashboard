-- 알림을 DB 트리거가 만든다. 클라이언트 INSERT는 막는다 (예전엔 아무에게나 알림을 무제한으로 보낼 수 있었음)
-- 되돌리기: create policy "Anyone can create notifications" on public.notifications for insert with check (auth.uid() = sender_id);

create or replace function public.notify_on_like()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_author uuid;
begin
  select author_id into v_author from posts where id = new.post_id;
  -- 좋아요를 눌렀다 뺐다 반복해도 같은 사람의 같은 글 좋아요 알림은 한 번만
  if v_author is not null and v_author <> new.user_id and not exists (
    select 1 from notifications where type = 'like' and sender_id = new.user_id and post_id = new.post_id
  ) then
    insert into notifications (receiver_id, sender_id, type, post_id)
    values (v_author, new.user_id, 'like', new.post_id);
  end if;
  return new;
end $$;

-- 클라이언트 규칙과 같음: 답글(부모 댓글 작성자) → 멘션(@닉네임) → 게시글 작성자, 한 사람에게 한 번, 본인 제외
create or replace function public.notify_on_comment()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_notified uuid[] := array[new.author_id];
  v_target uuid;
begin
  if new.parent_id is not null then
    select author_id into v_target from comments where id = new.parent_id;
    if v_target is not null and not v_target = any(v_notified) then
      insert into notifications (receiver_id, sender_id, type, post_id, comment_id)
      values (v_target, new.author_id, 'reply', new.post_id, new.id);
      v_notified := v_notified || v_target;
    end if;
  end if;

  for v_target in
    select p.id from profiles p
    where p.username in (select (regexp_matches(new.content, '@([A-Za-z0-9_.가-힣]+)', 'g'))[1])
  loop
    if not v_target = any(v_notified) then
      insert into notifications (receiver_id, sender_id, type, post_id, comment_id)
      values (v_target, new.author_id, 'mention', new.post_id, new.id);
      v_notified := v_notified || v_target;
    end if;
  end loop;

  select author_id into v_target from posts where id = new.post_id;
  if v_target is not null and not v_target = any(v_notified) then
    insert into notifications (receiver_id, sender_id, type, post_id, comment_id)
    values (v_target, new.author_id, 'comment', new.post_id, new.id);
  end if;
  return new;
end $$;

create or replace function public.notify_on_friend_request()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'pending' then
    insert into notifications (receiver_id, sender_id, type)
    values (new.friend_id, new.user_id, 'friend_request');
  end if;
  return new;
end $$;

revoke execute on function public.notify_on_like() from public, anon, authenticated;
revoke execute on function public.notify_on_comment() from public, anon, authenticated;
revoke execute on function public.notify_on_friend_request() from public, anon, authenticated;

drop trigger if exists trg_notify_like on public.likes;
create trigger trg_notify_like after insert on public.likes
  for each row execute function public.notify_on_like();
drop trigger if exists trg_notify_comment on public.comments;
create trigger trg_notify_comment after insert on public.comments
  for each row execute function public.notify_on_comment();
drop trigger if exists trg_notify_friend_request on public.friendships;
create trigger trg_notify_friend_request after insert on public.friendships
  for each row execute function public.notify_on_friend_request();

drop policy if exists "Anyone can create notifications" on public.notifications;

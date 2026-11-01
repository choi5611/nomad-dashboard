-- 죽은 객체 정리 + 보안 점검(advisor) 경고 해소
-- 없는 테이블(group_messages)에 쓰던 함수, 권한 회수 후 안 쓰는 XP RPC
drop function if exists public.send_leave_message(uuid, uuid, text);
drop function if exists public.increment_xp(uuid, integer);

-- 똑같은 likes 읽기 정책 3개 → 1개
drop policy if exists "Likes Public View" on public.likes;
drop policy if exists "Public likes are viewable by everyone." on public.likes;

-- 트리거 함수: search_path 고정, API로 직접 호출 못 하게
alter function public.handle_new_user() set search_path = public;
alter function public.delete_empty_room_on_exit() set search_path = public;
alter function public.handle_visit_xp_reward() set search_path = public;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.delete_empty_room_on_exit() from public, anon, authenticated;
revoke execute on function public.handle_visit_xp_reward() from public, anon, authenticated;

-- 검색 뷰: 조회하는 사람의 RLS를 따르게(security_invoker), 필요 없는 GROUP BY 제거 (컬럼은 그대로)
create or replace view public.searchable_posts with (security_invoker = true) as
select p.id,
    p.author_id,
    p.city_id,
    p.category,
    p.content,
    p.created_at,
    p.image_urls,
    pr.username as author_username,
    pr.avatar_url as author_avatar_url,
    pr.xp as author_xp,
    case
        when pr.xp >= 1000 then 'Grand Nomad'::text
        when pr.xp >= 500 then 'Elite Explorer'::text
        when pr.xp >= 200 then 'Steady Traveler'::text
        when pr.xp >= 50 then 'Active Voyager'::text
        else 'Newcomer'::text
    end as author_rank,
    (((coalesce(p.content, ''::text) || ' '::text) || coalesce(pr.username, ''::text)) || ' '::text)
      || coalesce((select string_agg(c.content, ' '::text) from comments c where c.post_id = p.id), ''::text) as search_blob,
    (select count(*) from likes l where l.post_id = p.id) as likes_count,
    (select count(*) from comments c2 where c2.post_id = p.id) as comments_count
from posts p
left join profiles pr on p.author_id = pr.id;

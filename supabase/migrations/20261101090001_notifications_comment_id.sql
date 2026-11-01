-- 클라이언트·알림센터가 쓰는 comment_id 컬럼이 없어 댓글/답글/멘션 알림 insert가 전부 거부되고 있었음
alter table public.notifications
  add column if not exists comment_id uuid references public.comments(id) on delete cascade;

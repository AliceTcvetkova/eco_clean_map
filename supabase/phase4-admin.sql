-- Phase 4: admin moderation — approve/reject reports & submissions, award points
-- Run in Supabase → SQL Editor after phase3b-task-reporter.sql
--
-- After your admin account exists, run once (replace username):
--   update public.profiles set is_admin = true where display_name = 'yourusername';

alter table public.profiles add column if not exists is_admin boolean not null default false;

create or replace function public.admin_assert()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.profiles where id = auth.uid() and is_admin = true
  ) then
    raise exception 'Forbidden: admin only';
  end if;
end;
$$;

create or replace function public.admin_list_pending()
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.admin_assert();

  return json_build_object(
    'reports', coalesce((
      select json_agg(row_to_json(r) order by r.created_at desc)
      from (
        select
          rep.id,
          rep.user_id,
          rep.location_name,
          rep.category,
          rep.severity,
          rep.reward_points,
          rep.photo_path,
          rep.created_at,
          pr.display_name as user_name
        from public.reports rep
        left join public.profiles pr on pr.id = rep.user_id
        where rep.status = 'pending'
      ) r
    ), '[]'::json),
    'submissions', coalesce((
      select json_agg(row_to_json(s) order by s.created_at desc)
      from (
        select
          sub.id,
          sub.task_id,
          sub.user_id,
          sub.before_photo_path,
          sub.after_photo_path,
          sub.created_at,
          pr.display_name as user_name,
          tk.title as task_title,
          tk.reward_points,
          tk.location_name
        from public.submissions sub
        left join public.profiles pr on pr.id = sub.user_id
        left join public.tasks tk on tk.id = sub.task_id
        where sub.status = 'pending'
      ) s
    ), '[]'::json)
  );
end;
$$;

create or replace function public.admin_approve_report(p_report_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.admin_assert();

  update public.reports
  set status = 'approved'
  where id = p_report_id and status = 'pending';

  if not found then
    raise exception 'Report not found or not pending';
  end if;
end;
$$;

create or replace function public.admin_reject_report(p_report_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.admin_assert();

  update public.reports
  set status = 'rejected'
  where id = p_report_id and status = 'pending';

  if not found then
    raise exception 'Report not found or not pending';
  end if;

  update public.tasks
  set status = 'completed'
  where report_id = p_report_id and status = 'open';
end;
$$;

create or replace function public.admin_approve_submission(p_submission_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_task_id uuid;
  v_user_id uuid;
  v_points integer;
begin
  perform public.admin_assert();

  select s.task_id, s.user_id, coalesce(t.reward_points, 240)
  into v_task_id, v_user_id, v_points
  from public.submissions s
  join public.tasks t on t.id = s.task_id
  where s.id = p_submission_id and s.status = 'pending';

  if v_task_id is null then
    raise exception 'Submission not found or not pending';
  end if;

  update public.submissions set status = 'approved' where id = p_submission_id;
  update public.tasks set status = 'completed' where id = v_task_id;
  update public.profiles
  set points = points + v_points, cleanups = cleanups + 1
  where id = v_user_id;

  update public.reports rep
  set status = 'approved'
  from public.tasks t
  where t.id = v_task_id
    and rep.id = t.report_id
    and rep.status = 'pending';
end;
$$;

create or replace function public.admin_reject_submission(p_submission_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.admin_assert();

  update public.submissions
  set status = 'rejected'
  where id = p_submission_id and status = 'pending';

  if not found then
    raise exception 'Submission not found or not pending';
  end if;
end;
$$;

grant execute on function public.admin_list_pending() to authenticated;
grant execute on function public.admin_approve_report(uuid) to authenticated;
grant execute on function public.admin_reject_report(uuid) to authenticated;
grant execute on function public.admin_approve_submission(uuid) to authenticated;
grant execute on function public.admin_reject_submission(uuid) to authenticated;

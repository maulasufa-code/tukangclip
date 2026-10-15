-- Klaim job untuk worker render. Analisis menulis status 'rendering' saat selesai.
create or replace function public.claim_next_render_job()
returns public.ai_jobs language plpgsql security definer set search_path = public as $$
declare
  v_job public.ai_jobs;
begin
  select * into v_job from public.ai_jobs
  where status = 'rendering' and (lease_until is null or lease_until < now())
  order by created_at asc
  for update skip locked
  limit 1;

  if not found then
    return null;
  end if;

  update public.ai_jobs
  set attempts = v_job.attempts + 1,
      lease_until = now() + interval '30 minutes',
      last_error = null
  where id = v_job.id
  returning * into v_job;

  return v_job;
end $$;

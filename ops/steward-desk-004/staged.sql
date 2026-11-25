-- Stage only after separate OAuth registration and review; no members seeded.
begin;
create table jubilee_private.desk_grant (
 subject uuid not null, client_id text not null check(length(client_id) between 8 and 256),
 expires_at timestamptz not null, revoked_at timestamptz, primary key(subject,client_id)
);
alter table jubilee_private.desk_grant enable row level security;
revoke all on jubilee_private.desk_grant from public,anon,authenticated;
create table jubilee_private.desk_audit (
 id bigint generated always as identity primary key, actor uuid not null, intake_id uuid not null references jubilee_private.intake(id),
 disposition text not null check(disposition in ('hold','contact_candidate','no_action')), at timestamptz not null default now()
);
alter table jubilee_private.desk_audit enable row level security;
revoke all on jubilee_private.desk_audit from public,anon,authenticated;
create function jubilee_private.desk_check() returns uuid language plpgsql security invoker set search_path='' as $$
declare u uuid:=auth.uid(); cid text:=auth.jwt()->>'client_id';
begin
 if u is null or cid is null or not exists(select 1 from jubilee_private.desk_grant g where g.subject=u and g.client_id=cid and g.expires_at>now() and g.revoked_at is null) then raise exception 'Jubilee authorization required' using errcode='42501';end if;
 return u;
end $$;
-- Private security-definer functions: exact whitelist, fixed output, no dynamic SQL.
create function jubilee_private.desk_read() returns jsonb language plpgsql security definer set search_path='' as $$
begin
 perform jubilee_private.desk_check();
 return jsonb_build_object(
 'queue',coalesce((select jsonb_agg(to_jsonb(q)) from (select id,created_at,lane,route,proposed_question,has_reply_channel,warning_category from jubilee_private.dispatch_queue order by created_at,id limit 100) q),'[]'::jsonb),
 'pending_count',(select count(*) from jubilee_private.dispatch_queue),
 'routes',coalesce((select jsonb_agg(to_jsonb(p)) from (select path,title,disposition,missing_gates,execution_allowed from jubilee_private.concord_paths where case_key='JUB-HON-001' order by path) p),'[]'::jsonb),
 'questions',coalesce((select jsonb_agg(to_jsonb(q)) from (select gate,question,paths_unlocked_by_answer from jubilee_private.concord_next_questions where case_key='JUB-HON-001' order by review_priority,paths_unlocked_by_answer desc,gate limit 6) q),'[]'::jsonb),
 'totals',coalesce((select jsonb_agg(to_jsonb(t)) from (select currency,stage,amount,commitments from jubilee_private.treasury_totals where case_key='JUB-HON-001') t),'[]'::jsonb));
end $$;
create function jubilee_private.desk_review(p_id uuid,p_disposition text,p_basis text) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid; ln text; reply_available boolean;
begin
 u:=jubilee_private.desk_check();
 if p_disposition is null or p_disposition not in ('hold','contact_candidate','no_action') or p_basis is null or length(trim(p_basis)) not between 1 and 300 then raise exception 'invalid review' using errcode='22023';end if;
 select lane,contact<>'' into ln,reply_available from jubilee_private.intake where id=p_id and state='pending' for update;
 if not found or exists(select 1 from jubilee_private.dispatch_review where intake_id=p_id) then raise exception 'stale review' using errcode='40001';end if;
 if p_disposition='contact_candidate' and (ln='signal' or not reply_available) then raise exception 'no safe reply channel for contact candidate' using errcode='42501';end if;
 insert into jubilee_private.dispatch_review(intake_id,disposition,basis) values(p_id,p_disposition,p_basis);
 update jubilee_private.intake set state='reviewed' where id=p_id;
 insert into jubilee_private.desk_audit(actor,intake_id,disposition) values(u,p_id,p_disposition);
 return jsonb_build_object('reviewed',true,'disposition',p_disposition);
end $$;
revoke all on function jubilee_private.desk_check(),jubilee_private.desk_read(),jubilee_private.desk_review(uuid,text,text) from public,anon,authenticated;
-- Public invoker wrappers; underlying private functions enforce grant every call.
create function public.jubilee_desk_read_v1() returns jsonb language sql security invoker set search_path='' as $$select jubilee_private.desk_read()$$;
create function public.jubilee_desk_review_v1(p_id uuid,p_disposition text,p_basis text) returns jsonb language sql security invoker set search_path='' as $$select jubilee_private.desk_review(p_id,p_disposition,p_basis)$$;
revoke all on function public.jubilee_desk_read_v1(),public.jubilee_desk_review_v1(uuid,text,text) from public,anon,authenticated;
-- Intentionally dormant. Activation is a separate migration after live review:
-- grant usage on schema jubilee_private to authenticated;
-- grant execute on function jubilee_private.desk_read(),jubilee_private.desk_review(uuid,text,text) to authenticated;
-- grant execute on function public.jubilee_desk_read_v1(),public.jubilee_desk_review_v1(uuid,text,text) to authenticated;
commit;

-- EXODUS 006: dormant shared ciphertext ledger. No grants or real data.
create table jubilee_private.common_case (
 case_id text primary key check(case_id ~ '^[a-f0-9]{32}$'),
 client_id text not null check(length(client_id) between 8 and 256),
 head integer not null check(head between 1 and 100),
 epoch integer not null check(epoch between 1 and 100),
 rotation_required boolean not null default false,
 changed_at timestamptz not null default now()
);
create table jubilee_private.common_member (
 case_id text not null references jubilee_private.common_case(case_id),
 subject uuid not null, role text not null check(role in ('owner','editor','reader')),
 expires_at timestamptz not null, revoked_at timestamptz, primary key(case_id,subject)
);
create table jubilee_private.common_revision (
 case_id text not null references jubilee_private.common_case(case_id),
 revision integer not null check(revision between 1 and 100), epoch integer not null,
 envelope jsonb not null, actor uuid not null, created_at timestamptz not null default now(),
 primary key(case_id,revision)
);
create table jubilee_private.common_audit (
 id bigint generated always as identity primary key, case_id text not null references jubilee_private.common_case(case_id),
 actor uuid not null, action text not null check(action in ('create','save','grant','revoke','rotate')),
 target uuid, revision integer, at timestamptz not null default now()
);
alter table jubilee_private.common_case enable row level security;
alter table jubilee_private.common_member enable row level security;
alter table jubilee_private.common_revision enable row level security;
alter table jubilee_private.common_audit enable row level security;
revoke all on jubilee_private.common_case,jubilee_private.common_member,jubilee_private.common_revision,jubilee_private.common_audit from public,anon,authenticated;

create function jubilee_private.common_actor() returns uuid language plpgsql security invoker set search_path='' as $$
declare u uuid:=auth.uid(); cid text:=auth.jwt()->>'client_id';
begin
 if u is null or cid is null or length(cid) not between 8 and 256 or auth.jwt()->>'is_anonymous'='true' then
  raise exception 'Common Table authorization required' using errcode='42501';
 end if; return u;
end $$;
create function jubilee_private.common_role(p_case text) returns text language plpgsql security invoker set search_path='' as $$
declare u uuid:=jubilee_private.common_actor(); r text;
begin
 select m.role into r from jubilee_private.common_member m join jubilee_private.common_case c using(case_id)
 where m.case_id=p_case and m.subject=u and m.revoked_at is null and m.expires_at>now()
 and c.client_id=auth.jwt()->>'client_id'
 and (m.role<>'owner' or exists(select 1 from jubilee_private.desk_grant g where g.subject=u and g.client_id=c.client_id and g.revoked_at is null and g.expires_at>now()));
 if r is null then raise exception 'Common Table authorization required' using errcode='42501';end if;return r;
end $$;
create function jubilee_private.common_needs_rotation(p_case text) returns boolean language sql security invoker set search_path='' as $$
 select c.rotation_required or exists(select 1 from jubilee_private.common_member m where m.case_id=c.case_id and m.role<>'owner' and m.revoked_at is null and m.expires_at<=now()) from jubilee_private.common_case c where c.case_id=p_case
$$;
create function jubilee_private.common_envelope(p_case text,p_rev integer,p_epoch integer,p_e jsonb) returns void language plpgsql security invoker set search_path='' as $$
begin
 if p_e is null or jsonb_typeof(p_e)<>'object' then raise exception 'Invalid ciphertext envelope' using errcode='22023';end if;
 if (select count(*) from jsonb_object_keys(p_e))<>7 or not (p_e ?& array['schema','caseId','revision','epoch','salt','iv','ciphertext'])
 or p_e->>'schema' is distinct from 'jubilee.common.encrypted/v1' or p_e->>'caseId' is distinct from p_case
 or p_e->'revision' is distinct from to_jsonb(p_rev) or p_e->'epoch' is distinct from to_jsonb(p_epoch)
 or jsonb_typeof(p_e->'salt') is distinct from 'string' or coalesce(p_e->>'salt','') !~ '^[a-f0-9]{32}$'
 or jsonb_typeof(p_e->'iv') is distinct from 'string' or coalesce(p_e->>'iv','') !~ '^[a-f0-9]{24}$'
 or jsonb_typeof(p_e->'ciphertext') is distinct from 'string' or length(coalesce(p_e->>'ciphertext','')) not between 32 and 262144
 or length(p_e->>'ciphertext')%2<>0 or (p_e->>'ciphertext') !~ '^[a-f0-9]+$' then
 raise exception 'Invalid ciphertext envelope' using errcode='22023';end if;
end $$;
create function jubilee_private.common_list() returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=jubilee_private.common_actor(); cid text:=auth.jwt()->>'client_id'; can_create boolean; cases jsonb;
begin
 select exists(select 1 from jubilee_private.desk_grant g where g.subject=u and g.client_id=cid and g.revoked_at is null and g.expires_at>now()) into can_create;
 select coalesce(jsonb_agg(jsonb_build_object('caseId',c.case_id,'role',m.role,'revision',c.head,'epoch',c.epoch,'rotationRequired',jubilee_private.common_needs_rotation(c.case_id),'changedAt',c.changed_at) order by c.changed_at desc),'[]'::jsonb) into cases
 from jubilee_private.common_member m join jubilee_private.common_case c using(case_id)
 where m.subject=u and m.revoked_at is null and m.expires_at>now() and c.client_id=cid and (m.role<>'owner' or can_create);
 if not can_create and jsonb_array_length(cases)=0 then raise exception 'Common Table authorization required' using errcode='42501';end if;
 return jsonb_build_object('canCreate',can_create,'cases',cases);
end $$;
create function jubilee_private.common_read(p_case text) returns jsonb language plpgsql security definer set search_path='' as $$
declare r text:=jubilee_private.common_role(p_case); out jsonb;
begin
 select jsonb_build_object('caseId',c.case_id,'role',r,'revision',c.head,'epoch',c.epoch,'rotationRequired',jubilee_private.common_needs_rotation(c.case_id),'envelope',v.envelope)
 into out from jubilee_private.common_case c join jubilee_private.common_revision v on v.case_id=c.case_id and v.revision=c.head where c.case_id=p_case;
 return out;
end $$;
create function jubilee_private.common_create(p_case text,p_envelope jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=jubilee_private.common_actor(); cid text:=auth.jwt()->>'client_id'; until_at timestamptz;
begin
 select expires_at into until_at from jubilee_private.desk_grant where subject=u and client_id=cid and revoked_at is null and expires_at>now() for update;
 if not found then raise exception 'Common Table authorization required' using errcode='42501';end if;
 if p_case is null or p_case !~ '^[a-f0-9]{32}$' then raise exception 'Invalid case' using errcode='22023';end if;
 if (select count(*) from jubilee_private.common_member where subject=u and role='owner')>=5 then raise exception 'Case limit' using errcode='22023';end if;
 perform jubilee_private.common_envelope(p_case,1,1,p_envelope);
 insert into jubilee_private.common_case(case_id,client_id,head,epoch) values(p_case,cid,1,1);
 insert into jubilee_private.common_member(case_id,subject,role,expires_at) values(p_case,u,'owner',until_at);
 insert into jubilee_private.common_revision(case_id,revision,epoch,envelope,actor) values(p_case,1,1,p_envelope,u);
 insert into jubilee_private.common_audit(case_id,actor,action,revision) values(p_case,u,'create',1);
 return jsonb_build_object('revision',1,'epoch',1);
end $$;
create function jubilee_private.common_write(p_case text,p_expected integer,p_rotate boolean,p_envelope jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=jubilee_private.common_actor(); r text; c jubilee_private.common_case%rowtype; next_epoch integer; rotate_needed boolean;
begin
 -- Check before locking to avoid foreign-case existence/lock probing; recheck after lock.
 perform jubilee_private.common_role(p_case);
 select * into c from jubilee_private.common_case where case_id=p_case for update;
 r:=jubilee_private.common_role(p_case);
 if r not in ('owner','editor') then raise exception 'Common Table authorization required' using errcode='42501';end if;
 if p_expected is distinct from c.head or c.head>=100 then raise exception 'Revision conflict or limit' using errcode='40001';end if;
 if p_rotate is null then raise exception 'Invalid rotation request' using errcode='22023';end if;
 rotate_needed:=jubilee_private.common_needs_rotation(p_case);
 if p_rotate then
  if r<>'owner' or not rotate_needed then raise exception 'Rotation not authorized' using errcode='42501';end if;
  next_epoch:=c.epoch+1;
 else
  if rotate_needed then raise exception 'Key rotation required' using errcode='40001';end if;
  next_epoch:=c.epoch;
 end if;
 perform jubilee_private.common_envelope(p_case,c.head+1,next_epoch,p_envelope);
 if p_rotate then update jubilee_private.common_member set revoked_at=now() where case_id=p_case and role<>'owner' and revoked_at is null and expires_at<=now();end if;
 insert into jubilee_private.common_revision(case_id,revision,epoch,envelope,actor) values(p_case,c.head+1,next_epoch,p_envelope,u);
 update jubilee_private.common_case set head=c.head+1,epoch=next_epoch,rotation_required=false,changed_at=now() where case_id=p_case;
 insert into jubilee_private.common_audit(case_id,actor,action,revision) values(p_case,u,case when p_rotate then 'rotate' else 'save' end,c.head+1);
 return jsonb_build_object('revision',c.head+1,'epoch',next_epoch);
end $$;
create function jubilee_private.common_grant(p_case text,p_subject uuid,p_role text,p_days integer) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=jubilee_private.common_actor(); until_at timestamptz;
begin
 if jubilee_private.common_role(p_case)<>'owner' then raise exception 'Common Table authorization required' using errcode='42501';end if;
 perform 1 from jubilee_private.common_case where case_id=p_case for update;
 if jubilee_private.common_role(p_case)<>'owner' then raise exception 'Common Table authorization required' using errcode='42501';end if;
 if p_subject is null or p_subject=u or p_role is null or p_role not in ('reader','editor') or p_days is null or p_days not between 1 and 30 then raise exception 'Invalid case grant' using errcode='22023';end if;
 if jubilee_private.common_needs_rotation(p_case) then raise exception 'Key rotation required' using errcode='40001';end if;
 if not exists(select 1 from auth.users where id=p_subject and confirmed_at is not null and not coalesce(is_anonymous,false)) then raise exception 'Verified account required' using errcode='22023';end if;
 if (select count(*) from jubilee_private.common_member where case_id=p_case and revoked_at is null)>=8 then raise exception 'Member limit' using errcode='22023';end if;
 select least(expires_at,now()+make_interval(days=>p_days)) into until_at from jubilee_private.common_member where case_id=p_case and subject=u;
 insert into jubilee_private.common_member(case_id,subject,role,expires_at) values(p_case,p_subject,p_role,until_at);
 insert into jubilee_private.common_audit(case_id,actor,action,target) values(p_case,u,'grant',p_subject);
 return jsonb_build_object('granted',true,'expiresAt',until_at);
end $$;
create function jubilee_private.common_revoke(p_case text,p_subject uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=jubilee_private.common_actor();
begin
 if jubilee_private.common_role(p_case)<>'owner' then raise exception 'Common Table authorization required' using errcode='42501';end if;
 perform 1 from jubilee_private.common_case where case_id=p_case for update;
 if jubilee_private.common_role(p_case)<>'owner' then raise exception 'Common Table authorization required' using errcode='42501';end if;
 update jubilee_private.common_member set revoked_at=now() where case_id=p_case and subject=p_subject and role<>'owner' and revoked_at is null;
 if not found then raise exception 'Invalid case revocation' using errcode='22023';end if;
 update jubilee_private.common_case set rotation_required=true where case_id=p_case;
 insert into jubilee_private.common_audit(case_id,actor,action,target) values(p_case,u,'revoke',p_subject);
 return jsonb_build_object('revoked',true,'rotationRequired',true);
end $$;
revoke all on function jubilee_private.common_actor(),jubilee_private.common_role(text),jubilee_private.common_needs_rotation(text),jubilee_private.common_envelope(text,integer,integer,jsonb),jubilee_private.common_list(),jubilee_private.common_read(text),jubilee_private.common_create(text,jsonb),jubilee_private.common_write(text,integer,boolean,jsonb),jubilee_private.common_grant(text,uuid,text,integer),jubilee_private.common_revoke(text,uuid) from public,anon,authenticated;
create function public.jubilee_common_list_v1() returns jsonb language sql security invoker set search_path='' as $$select jubilee_private.common_list()$$;
create function public.jubilee_common_read_v1(p_case text) returns jsonb language sql security invoker set search_path='' as $$select jubilee_private.common_read(p_case)$$;
create function public.jubilee_common_create_v1(p_case text,p_envelope jsonb) returns jsonb language sql security invoker set search_path='' as $$select jubilee_private.common_create(p_case,p_envelope)$$;
create function public.jubilee_common_write_v1(p_case text,p_expected integer,p_rotate boolean,p_envelope jsonb) returns jsonb language sql security invoker set search_path='' as $$select jubilee_private.common_write(p_case,p_expected,p_rotate,p_envelope)$$;
create function public.jubilee_common_grant_v1(p_case text,p_subject uuid,p_role text,p_days integer) returns jsonb language sql security invoker set search_path='' as $$select jubilee_private.common_grant(p_case,p_subject,p_role,p_days)$$;
create function public.jubilee_common_revoke_v1(p_case text,p_subject uuid) returns jsonb language sql security invoker set search_path='' as $$select jubilee_private.common_revoke(p_case,p_subject)$$;
revoke all on function public.jubilee_common_list_v1(),public.jubilee_common_read_v1(text),public.jubilee_common_create_v1(text,jsonb),public.jubilee_common_write_v1(text,integer,boolean,jsonb),public.jubilee_common_grant_v1(text,uuid,text,integer),public.jubilee_common_revoke_v1(text,uuid) from public,anon,authenticated;
-- No activation grants. Each public invoker wrapper needs authenticated EXECUTE plus its matching private function, and private schema usage. No table grants.

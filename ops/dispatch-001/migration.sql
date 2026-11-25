create table jubilee_private.dispatch_case (
 case_key text primary key, title text not null, reported_gap numeric(14,2) not null check(reported_gap>0), currency text not null, reported_deadline date not null, verification_state text not null default 'unverified' check(verification_state in ('unverified','reviewing','verified','closed'))
);
alter table jubilee_private.dispatch_case enable row level security;
insert into jubilee_private.dispatch_case(case_key,title,reported_gap,currency,reported_deadline) values('JUB-HON-001','Reported Pakistan church property need',8000,'USD','2026-11-30');
create table jubilee_private.dispatch_review(
 intake_id uuid primary key references jubilee_private.intake(id),
 reviewed_at timestamptz not null default now(),
 disposition text not null check(disposition in ('test','hold','contact_candidate','no_action')),
 basis text not null check(length(basis) between 1 and 500)
);
alter table jubilee_private.dispatch_review enable row level security;
create table jubilee_private.steward(
 id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(),
 name text not null check(length(name) between 1 and 150),
 role text not null check(role in ('collecting_church','receiving_partner','local_bridge','guarantor','professional')),
 authority_state text not null default 'candidate' check(authority_state in ('candidate','verified','withdrawn')),
 evidence_ref text,
 check(authority_state<>'verified' or length(coalesce(evidence_ref,''))>0)
);
alter table jubilee_private.steward enable row level security;
create table jubilee_private.relationship_candidate(
 id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(),
 intake_id uuid references jubilee_private.intake(id), steward_id uuid references jubilee_private.steward(id),
 purpose text not null check(length(purpose) between 1 and 300),
 state text not null default 'proposed' check(state in ('proposed','consent_requested','both_consented','declined','withdrawn')),
 consent_a_ref text, consent_b_ref text,
 check(state<>'both_consented' or (length(coalesce(consent_a_ref,''))>0 and length(coalesce(consent_b_ref,''))>0)),
 check(intake_id is not null or steward_id is not null)
);
alter table jubilee_private.relationship_candidate enable row level security;
create table jubilee_private.commitment(
 id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(),
 case_key text not null references jubilee_private.dispatch_case(case_key), intake_id uuid references jubilee_private.intake(id),
 steward_id uuid references jubilee_private.steward(id),
 source_ref text not null unique check(length(source_ref) between 1 and 200),
 amount numeric(14,2) not null check(amount>0), currency text not null check(currency in ('USD','PKR','NOK','EUR','GBP','CAD','AUD','OTHER'))
);
alter table jubilee_private.commitment enable row level security;
create table jubilee_private.commitment_event(
 id bigint generated always as identity primary key, commitment_id uuid not null references jubilee_private.commitment(id),
 created_at timestamptz not null default now(), stage text not null check(stage in ('offered','approved','church_held','transferred_reported','confirmed','withdrawn')),
 evidence_ref text not null check(length(evidence_ref) between 1 and 300), source_event_ref text not null unique
);
alter table jubilee_private.commitment_event enable row level security;
create function jubilee_private.check_commitment_transition() returns trigger language plpgsql security invoker set search_path='' as $$
declare prev text; custodian uuid; authority text; steward_role text;
begin
 select steward_id into custodian from jubilee_private.commitment where id=new.commitment_id for update;
 select stage into prev from jubilee_private.commitment_event where commitment_id=new.commitment_id order by id desc limit 1;
 if not ((prev is null and new.stage='offered') or (prev='offered' and new.stage in ('approved','withdrawn')) or (prev='approved' and new.stage in ('church_held','withdrawn')) or (prev='church_held' and new.stage in ('transferred_reported','withdrawn')) or (prev='transferred_reported' and new.stage='confirmed')) then raise exception 'invalid transition'; end if;
 if new.stage not in ('offered','withdrawn') then
 select authority_state,role into authority,steward_role from jubilee_private.steward where id=custodian;
 if authority is distinct from 'verified' or steward_role is distinct from 'collecting_church' then raise exception 'verified collecting church required'; end if;
 end if;
 return new;
end $$;
create trigger jubilee_commitment_transition before insert on jubilee_private.commitment_event for each row execute function jubilee_private.check_commitment_transition();
create function jubilee_private.reject_event_mutation() returns trigger language plpgsql security invoker set search_path='' as $$ begin raise exception 'event journal is append-only'; end $$;
create trigger jubilee_event_immutable before update or delete on jubilee_private.commitment_event for each row execute function jubilee_private.reject_event_mutation();
create view jubilee_private.dispatch_queue with (security_invoker=true) as
select i.id,i.created_at,i.lane,i.state,
case when i.lane='signal' then 'WITNESS_HOLD' when i.lane in ('individual','church') then 'CAPITAL' when i.lane='partner' then 'BRIDGE' when i.lane='expert' then 'KEYHOLE' when i.lane='introduction' then 'INTRODUCTION' else 'UPDATE' end as route,
case when i.lane='signal' then 'Review category privately; no attribution or outside contact.' when i.contact='' then 'No safe reply channel supplied; hold.' when i.lane='church' then 'Ask whether leadership approved offering and disclosed gift-use terms.' when i.lane='individual' then 'Ask permission to refer to an approved collecting church; no payment request.' when i.lane='partner' then 'Ask which institution has authority and which role it can consider.' when i.lane='expert' then 'Ask what bounded expertise and availability they offer.' when i.lane='introduction' then 'Ask for permission from each party before sharing details.' else 'Confirm consent and safe update channel.' end as proposed_question,
(i.contact<>'') as has_reply_channel,
case when i.lane='signal' then i.signal else null end as warning_category,
r.disposition
from jubilee_private.intake i left join jubilee_private.dispatch_review r on r.intake_id=i.id where i.state='pending' and r.intake_id is null;
create view jubilee_private.commitment_latest with (security_invoker=true) as
select c.id,c.case_key,c.currency,c.amount,e.stage from jubilee_private.commitment c join lateral(select stage from jubilee_private.commitment_event where commitment_id=c.id order by id desc limit 1)e on true;
create view jubilee_private.treasury_totals with (security_invoker=true) as select case_key,currency,stage,count(*) as commitments,sum(amount) as amount from jubilee_private.commitment_latest group by case_key,currency,stage;
revoke all on all tables in schema jubilee_private from public,anon,authenticated;
revoke all on function jubilee_private.check_commitment_transition(),jubilee_private.reject_event_mutation() from public,anon,authenticated;
-- Test-record disposition was executed separately in production; intentionally not exported.
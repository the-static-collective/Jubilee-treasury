create table jubilee_private.concord_gate (
 case_key text not null references jubilee_private.dispatch_case(case_key),
 gate text not null check(gate in ('deadline_confirmed','beneficiary_authority','seller_title','closing_terms','lawful_transfer','extension_agreed','local_bridge_agreed','guarantee_agreed','creditor_consent','independent_confirmation')),
 state text not null check(state in ('unknown','satisfied','blocked')),
 evidence_ref text not null check(length(evidence_ref) between 1 and 300),
 reviewed_at timestamptz not null default now(),
 valid_until timestamptz not null,
 primary key(case_key,gate),
 check(valid_until>reviewed_at)
);
alter table jubilee_private.concord_gate enable row level security;
revoke all on jubilee_private.concord_gate from public,anon,authenticated;
create view jubilee_private.concord_facts with (security_invoker=true) as
with rules(gate,question) as (values
 ('deadline_confirmed','What deadline and forfeiture terms are written in the agreement?'),
 ('beneficiary_authority','Who is authorized to act for the congregation, and may we verify that independently?'),
 ('seller_title','Can qualified local counsel verify ownership and seller authority?'),
 ('closing_terms','Can counsel identify a protected closing and preserve prior payments?'),
 ('lawful_transfer','Which verified institution and lawful transfer process can administer assistance?'),
 ('extension_agreed','Would the seller agree in writing to extend the deadline and preserve prior payments?'),
 ('local_bridge_agreed','Would an authorized local institution consider a documented bridge with independent funds?'),
 ('guarantee_agreed','Would an authorized guarantor consider a written capped guarantee?'),
 ('creditor_consent','Would the seller accept the documented alternative performance or guarantee?'),
 ('independent_confirmation','Can an independent reviewer confirm the resulting protected arrangement?'))
select c.case_key,r.gate,r.question,case when g.valid_until>now() then g.state else 'unknown' end as state
from jubilee_private.dispatch_case c cross join rules r left join jubilee_private.concord_gate g on g.case_key=c.case_key and g.gate=r.gate
union all
select c.case_key,'case_verified','Can the reported need and agreement be independently verified?',case when c.verification_state='verified' then 'satisfied' when c.verification_state='closed' then 'blocked' else 'unknown' end from jubilee_private.dispatch_case c
union all
select c.case_key,'church_held_capacity','Can authorized churches document sufficient held funds in the case currency?',case when coalesce((select sum(l.amount) from jubilee_private.commitment_latest l join jubilee_private.commitment m on m.id=l.id join jubilee_private.steward s on s.id=m.steward_id where l.case_key=c.case_key and l.currency=c.currency and l.stage='church_held' and s.authority_state='verified' and s.role='collecting_church'),0)>=c.reported_gap then 'satisfied' else 'unknown' end from jubilee_private.dispatch_case c;
create view jubilee_private.concord_paths with (security_invoker=true) as
with grammar(path,title,requires) as (values
 ('time','Written extension preserving prior payments',array['deadline_confirmed','beneficiary_authority','extension_agreed','independent_confirmation']),
 ('direct','Church-held offering and protected closing',array['case_verified','deadline_confirmed','beneficiary_authority','seller_title','closing_terms','lawful_transfer','church_held_capacity','independent_confirmation']),
 ('bridge','Local institutional bridge and protected closing',array['case_verified','deadline_confirmed','beneficiary_authority','seller_title','closing_terms','lawful_transfer','local_bridge_agreed','independent_confirmation']),
 ('guarantee','Seller-approved guarantee or deferred payment',array['case_verified','deadline_confirmed','beneficiary_authority','seller_title','closing_terms','guarantee_agreed','creditor_consent','independent_confirmation']))
select c.case_key,g.path,g.title,case when count(*) filter(where f.state='blocked')>0 then 'BLOCKED' when count(*) filter(where f.state is distinct from 'satisfied')>0 then 'HOLD' else 'REVIEW_READY' end as disposition,
array_agg(u.gate order by u.ord) filter(where f.state is distinct from 'satisfied') as missing_gates,
array_agg(u.gate order by u.ord) filter(where f.state='blocked') as blocked_gates,
false as execution_allowed
from jubilee_private.dispatch_case c cross join grammar g cross join lateral unnest(g.requires) with ordinality u(gate,ord) left join jubilee_private.concord_facts f on f.case_key=c.case_key and f.gate=u.gate
group by c.case_key,g.path,g.title;
create view jubilee_private.concord_next_questions with (security_invoker=true) as
select p.case_key,f.gate,f.question,count(*) as paths_unlocked_by_answer,
case when f.gate in ('deadline_confirmed','beneficiary_authority','case_verified') then 0 else 1 end as review_priority,
false as external_contact_allowed
from jubilee_private.concord_paths p cross join lateral unnest(p.missing_gates) g(gate)
join jubilee_private.concord_facts f on f.case_key=p.case_key and f.gate=g.gate
where p.disposition='HOLD' and f.state='unknown'
group by p.case_key,f.gate,f.question;
revoke all on jubilee_private.concord_facts,jubilee_private.concord_paths,jubilee_private.concord_next_questions from public,anon,authenticated;
alter table jubilee_private.commitment add column receiving_steward_id uuid references jubilee_private.steward(id);
create or replace function jubilee_private.check_commitment_transition() returns trigger language plpgsql security invoker set search_path='' as $$
declare prev text; custodian uuid; recipient uuid; ckey text; authority text; steward_role text; case_status text;
begin
 select steward_id,receiving_steward_id,case_key into custodian,recipient,ckey from jubilee_private.commitment where id=new.commitment_id for update;
 select stage into prev from jubilee_private.commitment_event where commitment_id=new.commitment_id order by id desc limit 1;
 if not coalesce(((prev is null and new.stage='offered') or (prev='offered' and new.stage in ('approved','withdrawn')) or (prev='approved' and new.stage in ('church_held','withdrawn')) or (prev='church_held' and new.stage in ('transferred_reported','withdrawn')) or (prev='transferred_reported' and new.stage='confirmed')),false) then raise exception 'invalid transition'; end if;
 if new.stage not in ('offered','withdrawn') then
 select authority_state,role into authority,steward_role from jubilee_private.steward where id=custodian;
 if authority is distinct from 'verified' or steward_role is distinct from 'collecting_church' then raise exception 'verified collecting church required'; end if;
 end if;
 if new.stage in ('transferred_reported','confirmed') then
 select verification_state into case_status from jubilee_private.dispatch_case where case_key=ckey;
 if case_status is distinct from 'verified' then raise exception 'verified case required'; end if;
 select authority_state,role into authority,steward_role from jubilee_private.steward where id=recipient;
 if authority is distinct from 'verified' or steward_role is distinct from 'receiving_partner' then raise exception 'verified receiving partner required'; end if;
 end if;
 return new;
end $$;
create function jubilee_private.protect_commitment_identity() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if exists(select 1 from jubilee_private.commitment_event where commitment_id=old.id) then
 if new.amount is distinct from old.amount or new.currency is distinct from old.currency or new.case_key is distinct from old.case_key or new.source_ref is distinct from old.source_ref or new.intake_id is distinct from old.intake_id or (old.steward_id is not null and new.steward_id is distinct from old.steward_id) or (old.receiving_steward_id is not null and new.receiving_steward_id is distinct from old.receiving_steward_id) then raise exception 'record a separate reviewed commitment instead of rewriting history'; end if;
 end if;
 return new;
end $$;
create trigger jubilee_commitment_identity before update on jubilee_private.commitment for each row execute function jubilee_private.protect_commitment_identity();
revoke all on function jubilee_private.protect_commitment_identity() from public,anon,authenticated;
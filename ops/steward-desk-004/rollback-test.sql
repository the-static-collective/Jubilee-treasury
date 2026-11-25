-- Append to staged.sql after removing its terminal COMMIT. Run only in isolated staging or explicit rollback transaction.

-- Synthetic grant only, all changes rolled back.
grant usage on schema jubilee_private to authenticated;
grant execute on function jubilee_private.desk_read(),jubilee_private.desk_review(uuid,text,text) to authenticated;
grant execute on function public.jubilee_desk_read_v1(),public.jubilee_desk_review_v1(uuid,text,text) to authenticated;
insert into jubilee_private.desk_grant(subject,client_id,expires_at) values('00000000-0000-4000-8000-000000004001','synthetic-desk-client',now()+interval '1 hour');
insert into jubilee_private.intake(id,lane,signal) values('00000000-0000-4000-8000-000000004002','signal','pressure');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000004001","client_id":"synthetic-desk-client","role":"authenticated"}',true);
do $$ declare r jsonb; rejected boolean; begin
 r:=public.jubilee_desk_read_v1();
 if not (r ? 'queue' and r ? 'routes' and r ? 'totals') then raise exception 'read failed';end if;
 if has_table_privilege('authenticated','jubilee_private.intake','SELECT') then raise exception 'raw read leaked';end if;
 rejected:=false;
 begin perform public.jubilee_desk_review_v1('00000000-0000-4000-8000-000000004002','contact_candidate','Potential follow-up for separate approval');exception when insufficient_privilege then rejected:=true;end;
 if not rejected then raise exception 'signal contact allowed';end if;
 r:=public.jubilee_desk_review_v1('00000000-0000-4000-8000-000000004002','hold','Needs human verification');
 if r->>'reviewed'<>'true' then raise exception 'review failed';end if;
 rejected:=false;
 begin perform public.jubilee_desk_review_v1('00000000-0000-4000-8000-000000004002','hold','Needs human verification');exception when serialization_failure then rejected:=true;end;
 if not rejected then raise exception 'duplicate review allowed';end if;
 perform set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000004001","client_id":"different-client","role":"authenticated"}',true);
 rejected:=false;begin perform public.jubilee_desk_read_v1();exception when insufficient_privilege then rejected:=true;end;
 if not rejected then raise exception 'wrong client allowed';end if;
end $$;
reset role;
update jubilee_private.desk_grant set revoked_at=now() where subject='00000000-0000-4000-8000-000000004001';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000004001","client_id":"synthetic-desk-client","role":"authenticated"}',true);
do $$ declare rejected boolean:=false; begin
 begin perform public.jubilee_desk_read_v1();exception when insufficient_privilege then rejected:=true;end;
 if not rejected then raise exception 'revoked grant accepted';end if;
end $$;
reset role;
do $$ begin
 if (select count(*) from jubilee_private.desk_audit where intake_id='00000000-0000-4000-8000-000000004002')<>1 then raise exception 'audit mismatch';end if;
end $$;
select 'PASS: grant read, raw denial, signal contact denial, review, duplicate refusal, wrong client denial, revocation, audit' as result;
rollback;
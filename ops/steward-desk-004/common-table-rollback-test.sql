-- Transaction-only test; never commit temporary grants or fixture rows.
begin;
grant usage on schema jubilee_private to authenticated;
grant execute on function jubilee_private.common_list(),jubilee_private.common_read(text),jubilee_private.common_create(text,jsonb),jubilee_private.common_write(text,integer,boolean,jsonb),jubilee_private.common_grant(text,uuid,text,integer),jubilee_private.common_revoke(text,uuid) to authenticated;
grant execute on function public.jubilee_common_list_v1(),public.jubilee_common_read_v1(text),public.jubilee_common_create_v1(text,jsonb),public.jubilee_common_write_v1(text,integer,boolean,jsonb),public.jubilee_common_grant_v1(text,uuid,text,integer),public.jubilee_common_revoke_v1(text,uuid) to authenticated;
insert into jubilee_private.desk_grant(subject,client_id,expires_at) values('e6000000-0000-4000-8000-000000000001','common-fixture-client',now()+interval '1 day');
set local role authenticated;
do $$
declare c text:='e6000000000040008000000000000001'; e jsonb:=jsonb_build_object('schema','jubilee.common.encrypted/v1','caseId',c,'revision',1,'epoch',1,'salt',repeat('a',32),'iv',repeat('b',24),'ciphertext',repeat('c',32)); out jsonb;
begin
 perform set_config('request.jwt.claims','{"sub":"e6000000-0000-4000-8000-000000000001","client_id":"common-fixture-client","role":"authenticated"}',true);
 out:=public.jubilee_common_create_v1(c,e);
 if out->>'revision'<>'1' then raise exception 'create failed';end if;
 if (public.jubilee_common_list_v1()->'cases'->0->>'caseId') is distinct from c then raise exception 'owner list failed';end if;
 begin perform public.jubilee_common_grant_v1(c,'e6000000-0000-4000-8000-000000000099','editor',1);raise exception 'unexpected unknown user grant';exception when invalid_parameter_value then null;end;
 begin perform count(*) from jubilee_private.common_revision;raise exception 'unexpected raw access';exception when insufficient_privilege then null;end;
end $$;
reset role;
insert into jubilee_private.common_member(case_id,subject,role,expires_at) values
 ('e6000000000040008000000000000001','e6000000-0000-4000-8000-000000000002','editor',now()+interval '1 day'),
 ('e6000000000040008000000000000001','e6000000-0000-4000-8000-000000000003','reader',now()+interval '1 day');
set local role authenticated;
do $$
declare c text:='e6000000000040008000000000000001'; e jsonb:=jsonb_build_object('schema','jubilee.common.encrypted/v1','caseId',c,'revision',2,'epoch',1,'salt',repeat('a',32),'iv',repeat('b',24),'ciphertext',repeat('d',32)); out jsonb;
begin
 perform set_config('request.jwt.claims','{"sub":"e6000000-0000-4000-8000-000000000002","client_id":"wrong-fixture-client","role":"authenticated"}',true);
 begin perform public.jubilee_common_read_v1(c);raise exception 'wrong client read';exception when insufficient_privilege then null;end;
 perform set_config('request.jwt.claims','{"sub":"e6000000-0000-4000-8000-000000000004","client_id":"common-fixture-client","role":"authenticated"}',true);
 begin perform public.jubilee_common_list_v1();raise exception 'nonmember list';exception when insufficient_privilege then null;end;
 begin perform public.jubilee_common_read_v1(c);raise exception 'nonmember read';exception when insufficient_privilege then null;end;
 perform set_config('request.jwt.claims','{"sub":"e6000000-0000-4000-8000-000000000003","client_id":"common-fixture-client","role":"authenticated"}',true);
 if public.jubilee_common_read_v1(c)->>'role'<>'reader' then raise exception 'reader read failed';end if;
 begin perform public.jubilee_common_write_v1(c,1,false,e);raise exception 'reader write';exception when insufficient_privilege then null;end;
 perform set_config('request.jwt.claims','{"sub":"e6000000-0000-4000-8000-000000000002","client_id":"common-fixture-client","role":"authenticated"}',true);
 begin perform public.jubilee_common_read_v1('ffffffffffffffffffffffffffffffff');raise exception 'foreign case read';exception when insufficient_privilege then null;end;
 begin perform public.jubilee_common_write_v1(c,1,false,e||jsonb_build_object('plaintext','blocked'));raise exception 'extra field accepted';exception when invalid_parameter_value then null;end;
 begin perform public.jubilee_common_revoke_v1(c,'e6000000-0000-4000-8000-000000000003');raise exception 'editor revoke';exception when insufficient_privilege then null;end;
 out:=public.jubilee_common_write_v1(c,1,false,e);if out->>'revision'<>'2' then raise exception 'editor save failed';end if;
 begin perform public.jubilee_common_write_v1(c,1,false,e);raise exception 'stale write';exception when serialization_failure then null;end;
 perform set_config('request.jwt.claims','{"sub":"e6000000-0000-4000-8000-000000000001","client_id":"common-fixture-client","role":"authenticated"}',true);
 perform public.jubilee_common_revoke_v1(c,'e6000000-0000-4000-8000-000000000002');
 e:=jsonb_set(e,'{revision}','3');
 begin perform public.jubilee_common_write_v1(c,2,false,e);raise exception 'write without rotation';exception when serialization_failure then null;end;
 e:=jsonb_set(e,'{epoch}','2');
 out:=public.jubilee_common_write_v1(c,2,true,e);if out->>'epoch'<>'2' then raise exception 'rotation failed';end if;
 perform set_config('request.jwt.claims','{"sub":"e6000000-0000-4000-8000-000000000002","client_id":"common-fixture-client","role":"authenticated"}',true);
 begin perform public.jubilee_common_read_v1(c);raise exception 'revoked read';exception when insufficient_privilege then null;end;
 perform set_config('request.jwt.claims','{"sub":"e6000000-0000-4000-8000-000000000003","client_id":"common-fixture-client","role":"authenticated"}',true);
 if public.jubilee_common_read_v1(c)->>'epoch'<>'2' then raise exception 'remaining reader not current';end if;
end $$;
reset role;
select count(*)=3 as three_revisions from jubilee_private.common_revision where case_id='e6000000000040008000000000000001';
rollback;
-- Opt-in SOURCE migration. Install in Garden's authority database, never a Treasury mirror.
-- Additive private inventory assertions and public-consent pointers; existing witness_events,
-- source membership, actor resolution, stale heads and human transitions remain authoritative.
BEGIN;
CREATE TABLE bananagram_private.public_need_selection (
  circle_id uuid NOT NULL REFERENCES public.circles,
  need_id uuid NOT NULL,
  manifest_hash text NOT NULL CHECK (manifest_hash ~ '^[a-f0-9]{64}$'),
  revision bigint NOT NULL CHECK (revision > 0),
  resource text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('goods','service')),
  region text NOT NULL,
  boundaries text[] NOT NULL,
  publication_allowed boolean NOT NULL,
  valid_from timestamptz NOT NULL,
  expires_at timestamptz NOT NULL CHECK(expires_at > valid_from),
  PRIMARY KEY(circle_id, need_id)
);
CREATE TABLE bananagram_private.available_capacity (
  id uuid PRIMARY KEY,
  helper uuid NOT NULL REFERENCES auth.users,
  manifest_hash text NOT NULL CHECK (manifest_hash ~ '^[a-f0-9]{64}$'),
  revision bigint NOT NULL CHECK (revision > 0),
  resource text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('goods','service')),
  unit text NOT NULL,
  quantity bigint NOT NULL CHECK (quantity BETWEEN 1 AND 10000),
  region text NOT NULL,
  boundaries text[] NOT NULL,
  valid_from timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  status text NOT NULL CHECK(status IN ('available','reserved','declined','withdrawn','expired','contested','unsafe')),
  CHECK (expires_at > valid_from)
);
CREATE TABLE bananagram_private.capacity_pledges (
  circle_id uuid NOT NULL,
  offer_id uuid NOT NULL,
  capacity_id uuid NOT NULL REFERENCES bananagram_private.available_capacity,
  need_id uuid NOT NULL,
  need_hash text NOT NULL,
  capacity_hash text NOT NULL,
  units bigint NOT NULL CHECK(units > 0),
  reserved boolean NOT NULL DEFAULT false,
  PRIMARY KEY(circle_id, offer_id)
);
ALTER TABLE bananagram_private.public_need_selection ENABLE ROW LEVEL SECURITY;
ALTER TABLE bananagram_private.available_capacity ENABLE ROW LEVEL SECURITY;
ALTER TABLE bananagram_private.capacity_pledges ENABLE ROW LEVEL SECURITY;
-- No client SELECT or writes: contacts/identities/allocations are not a public mirror surface.

CREATE FUNCTION public.rpc_select_public_need(_circle_id uuid, _need_id uuid, _manifest_hash text,
  _revision bigint, _resource text, _kind text, _region text, _boundaries text[], _publication_allowed boolean,
  _valid_from timestamptz, _expires_at timestamptz)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE n_hh uuid; n_status text; n_target bigint; n_confirmed bigint; n_unit text; n_label text; old bigint; old_allowed boolean;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthenticated' USING ERRCODE='42501'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('ledger:' || _circle_id::text, 0));
  SELECT * FROM bananagram_core.derive_need(_circle_id, _need_id) INTO n_hh,n_status,n_target,n_confirmed,n_unit,n_label;
  PERFORM bananagram_core.assert_household_authority(auth.uid(), _circle_id, n_hh);
  IF n_status <> 'open' AND _publication_allowed THEN RAISE EXCEPTION 'need not open'; END IF;
  IF _resource IS NULL OR _region IS NULL OR _boundaries IS NULL OR _publication_allowed IS NULL
    OR _manifest_hash IS NULL OR _revision IS NULL OR _kind IS NULL THEN RAISE EXCEPTION 'invalid publication'; END IF;
  SELECT revision,publication_allowed INTO old,old_allowed FROM bananagram_private.public_need_selection
    WHERE circle_id=_circle_id AND need_id=_need_id FOR UPDATE;
  IF (old IS NULL AND _revision<>1) OR (old IS NOT NULL AND _revision<>old+1) THEN
    RAISE EXCEPTION 'stale or missing public revision'; END IF;
  IF old_allowed=false AND _publication_allowed THEN RAISE EXCEPTION 'withdrawn publication cannot reactivate'; END IF;
  INSERT INTO bananagram_private.public_need_selection VALUES
    (_circle_id,_need_id,_manifest_hash,_revision,_resource,_kind,_region,_boundaries,_publication_allowed,_valid_from,_expires_at)
  ON CONFLICT(circle_id,need_id) DO UPDATE SET manifest_hash=EXCLUDED.manifest_hash, revision=EXCLUDED.revision,
    resource=EXCLUDED.resource,kind=EXCLUDED.kind,region=EXCLUDED.region,boundaries=EXCLUDED.boundaries,
    publication_allowed=EXCLUDED.publication_allowed,valid_from=EXCLUDED.valid_from,expires_at=EXCLUDED.expires_at;
END;
$$;
REVOKE ALL ON FUNCTION public.rpc_select_public_need(uuid,uuid,text,bigint,text,text,text,text[],boolean,timestamptz,timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_select_public_need(uuid,uuid,text,bigint,text,text,text,text[],boolean,timestamptz,timestamptz) TO authenticated;

-- Public freshness challenge returns ONLY a consented hash. Closed, revoked, expired,
-- missing and private needs are indistinguishable. It never returns contact or source text.
CREATE FUNCTION public.rpc_public_need_hash(_circle_id uuid, _need_id uuid)
RETURNS text LANGUAGE sql SECURITY DEFINER SET search_path = '' AS $$
  SELECT manifest_hash FROM bananagram_private.public_need_selection n
    WHERE n.circle_id=_circle_id AND n.need_id=_need_id AND n.publication_allowed
      AND clock_timestamp()>=n.valid_from AND clock_timestamp()<n.expires_at
      AND (SELECT status FROM bananagram_core.derive_need(n.circle_id,n.need_id))='open'
$$;
REVOKE ALL ON FUNCTION public.rpc_public_need_hash(uuid,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_public_need_hash(uuid,uuid) TO authenticated, anon;

CREATE FUNCTION public.rpc_public_capacity_hash(_capacity_id uuid)
RETURNS text LANGUAGE sql SECURITY DEFINER SET search_path = '' AS $$
  SELECT manifest_hash FROM bananagram_private.available_capacity
    WHERE id=_capacity_id AND status IN ('available','reserved')
      AND clock_timestamp()>=valid_from AND clock_timestamp()<expires_at
$$;
REVOKE ALL ON FUNCTION public.rpc_public_capacity_hash(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_public_capacity_hash(uuid) TO authenticated, anon;

CREATE FUNCTION public.rpc_assert_capacity(_id uuid, _manifest_hash text, _revision bigint, _resource text,
  _kind text, _unit text, _quantity bigint, _region text, _boundaries text[], _valid_from timestamptz,
  _expires_at timestamptz, _status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE old bananagram_private.available_capacity;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthenticated' USING ERRCODE='42501'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('capacity:' || _id::text, 0));
  SELECT * INTO old FROM bananagram_private.available_capacity WHERE id=_id FOR UPDATE;
  IF FOUND AND (old.helper <> auth.uid() OR _revision <> old.revision+1 OR old.status='withdrawn') THEN
    RAISE EXCEPTION 'foreign, stale or withdrawn capacity' USING ERRCODE='42501';
  END IF;
  IF old.id IS NULL AND _revision<>1 THEN RAISE EXCEPTION 'missing capacity origin'; END IF;
  IF old.id IS NOT NULL AND (old.resource<>_resource OR old.kind<>_kind OR old.unit<>_unit) THEN
    RAISE EXCEPTION 'resource identity cannot change'; END IF;
  IF _quantity < (SELECT COALESCE(sum(units),0) FROM bananagram_private.capacity_pledges WHERE capacity_id=_id AND reserved) THEN
    RAISE EXCEPTION 'cannot reduce below reserved units'; END IF;
  INSERT INTO bananagram_private.available_capacity VALUES
    (_id,auth.uid(),_manifest_hash,_revision,_resource,_kind,_unit,_quantity,_region,_boundaries,_valid_from,_expires_at,_status)
  ON CONFLICT(id) DO UPDATE SET manifest_hash=EXCLUDED.manifest_hash,revision=EXCLUDED.revision,
    quantity=EXCLUDED.quantity,region=EXCLUDED.region,boundaries=EXCLUDED.boundaries,
    valid_from=EXCLUDED.valid_from,expires_at=EXCLUDED.expires_at,status=EXCLUDED.status;
END;
$$;
REVOKE ALL ON FUNCTION public.rpc_assert_capacity(uuid,text,bigint,text,text,text,bigint,text,text[],timestamptz,timestamptz,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_assert_capacity(uuid,text,bigint,text,text,text,bigint,text,text[],timestamptz,timestamptz,text) TO authenticated;

-- A bound pledge must use the authenticated capacity helper. Creating a pledge consumes no stock.
CREATE FUNCTION public.rpc_pledge_capacity(_circle_id uuid, _expected_head text, _idempotency_key text,
  _need_id uuid, _capacity_id uuid, _need_hash text, _capacity_hash text, _units bigint)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE c bananagram_private.available_capacity; n bananagram_private.public_need_selection;
  receipt jsonb; n_hh uuid; n_status text; n_target bigint; n_confirmed bigint; n_unit text; n_label text;
  cmd_hash text; cached public.command_idempotency;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthenticated' USING ERRCODE='42501'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('capacity:' || _capacity_id::text, 0));
  PERFORM pg_advisory_xact_lock(hashtextextended('ledger:' || _circle_id::text, 0));
  cmd_hash := bananagram_core.sha256_hex(bananagram_core.canonical_json_text(jsonb_build_object(
    'head',_expected_head,'need',_need_id,'capacity',_capacity_id,'needHash',_need_hash,'capacityHash',_capacity_hash,'units',_units)));
  SELECT * INTO cached FROM public.command_idempotency WHERE actor_user_id=auth.uid()
    AND scope='capacity-pledge:'||_circle_id::text AND idempotency_key=_idempotency_key;
  IF FOUND THEN
    IF cached.command_hash<>cmd_hash THEN RAISE EXCEPTION 'idempotency_conflict'; END IF;
    RETURN cached.receipt || jsonb_build_object('replayed',true);
  END IF;
  SELECT * INTO c FROM bananagram_private.available_capacity WHERE id=_capacity_id;
  SELECT * INTO n FROM bananagram_private.public_need_selection WHERE circle_id=_circle_id AND need_id=_need_id;
  SELECT * FROM bananagram_core.derive_need(_circle_id,_need_id) INTO n_hh,n_status,n_target,n_confirmed,n_unit,n_label;
  IF c.id IS NULL OR n.need_id IS NULL OR c.helper<>auth.uid() OR NOT n.publication_allowed OR
    n.manifest_hash IS DISTINCT FROM _need_hash OR c.manifest_hash IS DISTINCT FROM _capacity_hash OR
    c.status<>'available' OR clock_timestamp()<c.valid_from OR clock_timestamp()>=c.expires_at OR
    clock_timestamp()<n.valid_from OR clock_timestamp()>=n.expires_at OR
    n_status<>'open' OR c.resource<>n.resource OR c.kind<>n.kind OR c.unit<>n_unit OR c.region<>n.region OR
    NOT n.boundaries <@ c.boundaries OR _units IS NULL OR _units<1 OR _units>LEAST(c.quantity,n_target-n_confirmed) THEN
    RAISE EXCEPTION 'stale, private, incompatible or unavailable capacity pledge';
  END IF;
  receipt := public.rpc_pledge_offer(_circle_id,_expected_head,_idempotency_key,_need_id,
    CASE c.kind WHEN 'service' THEN 'time' ELSE 'goods' END,c.resource,_units,NULL);
  INSERT INTO bananagram_private.capacity_pledges(circle_id,offer_id,capacity_id,need_id,need_hash,capacity_hash,units)
    VALUES(_circle_id,(receipt->'event'->>'aggregateId')::uuid,_capacity_id,_need_id,_need_hash,_capacity_hash,_units);
  INSERT INTO public.command_idempotency(actor_user_id,scope,idempotency_key,command_kind,command_hash,receipt)
    VALUES(auth.uid(),'capacity-pledge:'||_circle_id::text,_idempotency_key,'capacity-pledge',cmd_hash,receipt);
  RETURN receipt;
END;
$$;
REVOKE ALL ON FUNCTION public.rpc_pledge_capacity(uuid,text,text,uuid,uuid,text,text,bigint) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_pledge_capacity(uuid,text,text,uuid,uuid,text,text,bigint) TO authenticated;

-- Preserve the native acceptance implementation privately, closing the public bypass.
ALTER FUNCTION public.rpc_accept_offer(uuid,text,text,uuid) SET SCHEMA bananagram_core;
REVOKE ALL ON FUNCTION bananagram_core.rpc_accept_offer(uuid,text,text,uuid) FROM authenticated, anon, PUBLIC;
CREATE FUNCTION public.rpc_accept_offer(_circle_id uuid, _expected_head text, _idempotency_key text, _offer_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE p bananagram_private.capacity_pledges; c bananagram_private.available_capacity;
  n bananagram_private.public_need_selection; used bigint; receipt jsonb;
  cmd_hash text; cached public.command_idempotency;
  n_hh uuid; n_status text; n_target bigint; n_confirmed bigint; n_unit text; n_label text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthenticated' USING ERRCODE='42501'; END IF;
  SELECT * INTO p FROM bananagram_private.capacity_pledges WHERE circle_id=_circle_id AND offer_id=_offer_id;
  IF p.offer_id IS NOT NULL THEN
    PERFORM pg_advisory_xact_lock(hashtextextended('capacity:' || p.capacity_id::text, 0));
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('ledger:' || _circle_id::text, 0));
  cmd_hash := bananagram_core.sha256_hex(bananagram_core.canonical_json_text(jsonb_build_object('head',_expected_head,'offer',_offer_id)));
  SELECT * INTO cached FROM public.command_idempotency WHERE actor_user_id=auth.uid()
    AND scope='capacity-accept:'||_circle_id::text AND idempotency_key=_idempotency_key;
  IF FOUND THEN
    IF cached.command_hash<>cmd_hash THEN RAISE EXCEPTION 'idempotency_conflict'; END IF;
    RETURN cached.receipt || jsonb_build_object('replayed',true);
  END IF;
  IF p.offer_id IS NOT NULL THEN
    SELECT * INTO p FROM bananagram_private.capacity_pledges WHERE circle_id=_circle_id AND offer_id=_offer_id FOR UPDATE;
    SELECT * INTO c FROM bananagram_private.available_capacity WHERE id=p.capacity_id FOR UPDATE;
    SELECT * INTO n FROM bananagram_private.public_need_selection WHERE circle_id=_circle_id AND need_id=p.need_id;
    SELECT COALESCE(sum(units),0) INTO used FROM bananagram_private.capacity_pledges WHERE capacity_id=p.capacity_id AND reserved;
    IF p.reserved OR NOT n.publication_allowed OR n.manifest_hash IS DISTINCT FROM p.need_hash OR
      clock_timestamp()<n.valid_from OR clock_timestamp()>=n.expires_at OR
      c.manifest_hash IS DISTINCT FROM p.capacity_hash OR c.status<>'available' OR
      clock_timestamp()<c.valid_from OR clock_timestamp()>=c.expires_at OR used+p.units>c.quantity THEN
      RAISE EXCEPTION 'stale or already reserved capacity';
    END IF;
    SELECT * FROM bananagram_core.derive_need(_circle_id,p.need_id) INTO n_hh,n_status,n_target,n_confirmed,n_unit,n_label;
    IF n_status<>'open' OR p.units>n_target-n_confirmed THEN RAISE EXCEPTION 'need withdrawn or fulfilled'; END IF;
  END IF;
  receipt := bananagram_core.rpc_accept_offer(_circle_id,_expected_head,_idempotency_key,_offer_id);
  IF p.offer_id IS NOT NULL THEN
    UPDATE bananagram_private.capacity_pledges SET reserved=true WHERE circle_id=_circle_id AND offer_id=_offer_id;
  END IF;
  INSERT INTO public.command_idempotency(actor_user_id,scope,idempotency_key,command_kind,command_hash,receipt)
    VALUES(auth.uid(),'capacity-accept:'||_circle_id::text,_idempotency_key,'capacity-accept',cmd_hash,receipt);
  RETURN receipt;
END;
$$;
REVOKE ALL ON FUNCTION public.rpc_accept_offer(uuid,text,text,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_accept_offer(uuid,text,text,uuid) TO authenticated;

-- Private, revocable, two-party introduction consent. No contact values or consent
-- events enter the public ledger/mirrors. A trusted private provider owns actual delivery.
CREATE TABLE bananagram_private.capacity_contact_consent (
  circle_id uuid NOT NULL,
  offer_id uuid NOT NULL,
  actor uuid NOT NULL REFERENCES auth.users,
  decision text NOT NULL CHECK(decision IN ('allow','decline','withdraw')),
  expires_at timestamptz NOT NULL,
  PRIMARY KEY(circle_id,offer_id,actor),
  FOREIGN KEY(circle_id,offer_id) REFERENCES bananagram_private.capacity_pledges
);
ALTER TABLE bananagram_private.capacity_contact_consent ENABLE ROW LEVEL SECURITY;

CREATE FUNCTION public.rpc_consent_capacity_contact(_circle_id uuid, _offer_id uuid, _decision text, _expires_at timestamptz)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE p bananagram_private.capacity_pledges; requester uuid; helper uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthenticated' USING ERRCODE='42501'; END IF;
  SELECT * INTO p FROM bananagram_private.capacity_pledges WHERE circle_id=_circle_id AND offer_id=_offer_id;
  IF p.offer_id IS NULL THEN RAISE EXCEPTION 'bound pledge required'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('capacity:' || p.capacity_id::text, 0));
  PERFORM pg_advisory_xact_lock(hashtextextended('ledger:' || _circle_id::text, 0));
  SELECT actor_user_id INTO requester FROM public.witness_events WHERE circle_id=_circle_id AND aggregate_id=p.need_id AND kind='need.opened';
  SELECT c.helper INTO helper FROM bananagram_private.available_capacity c WHERE id=p.capacity_id;
  IF auth.uid() NOT IN(requester,helper) THEN RAISE EXCEPTION 'not an introduction party' USING ERRCODE='42501'; END IF;
  IF _expires_at IS NULL OR _expires_at<=clock_timestamp() OR _expires_at>clock_timestamp()+interval '7 days' THEN
    RAISE EXCEPTION 'invalid consent expiry'; END IF;
  INSERT INTO bananagram_private.capacity_contact_consent VALUES(_circle_id,_offer_id,auth.uid(),_decision,_expires_at)
    ON CONFLICT(circle_id,offer_id,actor) DO UPDATE SET decision=EXCLUDED.decision,expires_at=EXCLUDED.expires_at;
END;
$$;
REVOKE ALL ON FUNCTION public.rpc_consent_capacity_contact(uuid,uuid,text,timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_consent_capacity_contact(uuid,uuid,text,timestamptz) TO authenticated;

CREATE FUNCTION public.rpc_capacity_contact_allowed(_circle_id uuid, _offer_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE p bananagram_private.capacity_pledges; c bananagram_private.available_capacity;
  n bananagram_private.public_need_selection; requester uuid; approvals bigint;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthenticated' USING ERRCODE='42501'; END IF;
  SELECT * INTO p FROM bananagram_private.capacity_pledges WHERE circle_id=_circle_id AND offer_id=_offer_id;
  IF p.offer_id IS NULL THEN RAISE EXCEPTION 'bound pledge required'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('capacity:' || p.capacity_id::text, 0));
  PERFORM pg_advisory_xact_lock(hashtextextended('ledger:' || _circle_id::text, 0));
  SELECT * INTO p FROM bananagram_private.capacity_pledges WHERE circle_id=_circle_id AND offer_id=_offer_id;
  SELECT * INTO c FROM bananagram_private.available_capacity WHERE id=p.capacity_id;
  SELECT * INTO n FROM bananagram_private.public_need_selection WHERE circle_id=_circle_id AND need_id=p.need_id;
  SELECT actor_user_id INTO requester FROM public.witness_events WHERE circle_id=_circle_id AND aggregate_id=p.need_id AND kind='need.opened';
  IF auth.uid() NOT IN(requester,c.helper) THEN RAISE EXCEPTION 'not an introduction party' USING ERRCODE='42501'; END IF;
  SELECT count(*) INTO approvals FROM bananagram_private.capacity_contact_consent
    WHERE circle_id=_circle_id AND offer_id=_offer_id AND actor IN(requester,c.helper)
      AND decision='allow' AND clock_timestamp()<expires_at;
  RETURN approvals=2 AND p.reserved AND n.publication_allowed AND n.manifest_hash=p.need_hash AND
    (SELECT status FROM bananagram_core.derive_need(_circle_id,p.need_id))='open' AND
    c.manifest_hash=p.capacity_hash AND c.status IN ('available','reserved') AND
    clock_timestamp()>=c.valid_from AND clock_timestamp()<c.expires_at AND
    clock_timestamp()>=n.valid_from AND clock_timestamp()<n.expires_at;
END;
$$;
REVOKE ALL ON FUNCTION public.rpc_capacity_contact_allowed(uuid,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_capacity_contact_allowed(uuid,uuid) TO authenticated;
COMMIT;

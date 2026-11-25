import test from 'node:test';
import assert from 'node:assert/strict';
import {createPennyCampaignLab} from '../penny-campaign.mjs';

const make = () => createPennyCampaignLab({
  reserves: [
    {id:'sponsor', backingType:'usd-settled', availableCents:3},
    {id:'coinbox', backingType:'physical-pennies', availableCents:2},
  ],
  campaigns: [
    {id:'rent', requirementType:'electronic-bill', goalCents:2},
    {id:'cash-need', requirementType:'physical-cash', goalCents:2},
  ],
});
const c = (lab, id) => lab.inspect().campaigns.find(x => x.id === id);
const r = (lab, id) => lab.inspect().reserves.find(x => x.id === id);

test('one sponsored like costs exactly one prefunded fictional cent', () => {
  const lab = make();
  assert.equal(lab.sponsorLike({reserveId:'sponsor',campaignId:'rent',actorId:'person-a'}).status,'allocated-in-simulation');
  assert.equal(c(lab,'rent').allocatedCents,1);
  assert.equal(r(lab,'sponsor').availableCents,2);
  assert.equal(c(lab,'rent').phase,'open');
  assert.equal(c(lab,'rent').realFundsVerified,false);
  assert.equal(c(lab,'rent').externalPaymentMade,false);
});
test('two likes from distinct claimants reach goal, not payout', () => {
  const lab = make();
  lab.sponsorLike({reserveId:'sponsor',campaignId:'rent',actorId:'person-a'});
  lab.sponsorLike({reserveId:'sponsor',campaignId:'rent',actorId:'person-b'});
  assert.equal(c(lab,'rent').phase,'ready-for-payee-review');
  assert.equal(c(lab,'rent').allocatedCents,2);
  assert.equal(c(lab,'rent').externalPaymentMade,false);
  assert.throws(()=>lab.sponsorLike({reserveId:'sponsor',campaignId:'rent',actorId:'person-c'}),/closed/);
  assert.equal(r(lab,'sponsor').availableCents,1);
});
test('duplicate likes cannot mint extra pennies', () => {
  const lab = make();
  lab.sponsorLike({reserveId:'sponsor',campaignId:'rent',actorId:'a'});
  assert.equal(lab.sponsorLike({reserveId:'sponsor',campaignId:'rent',actorId:'a'}).status,'duplicate-like');
  assert.equal(r(lab,'sponsor').availableCents,2);
});
test('unfunded pledges are not spendable and cannot close campaign', () => {
  const lab = make();
  assert.equal(lab.pledge({campaignId:'rent',pledgeId:'pending-1',cents:250}).status,'pledged-not-funded');
  assert.equal(c(lab,'rent').pledgedCents,250);
  assert.equal(c(lab,'rent').allocatedCents,0);
  assert.equal(c(lab,'rent').phase,'open');
});
test('physical coins cannot be silently transformed into electronic bill payment', () => {
  const lab = make();
  assert.throws(()=>lab.allocate({reserveId:'coinbox',campaignId:'rent',eventId:'x',cents:1}),/cannot mix/);
  assert.equal(r(lab,'coinbox').availableCents,2);
  assert.equal(c(lab,'rent').allocatedCents,0);
});
test('local physical penny campaign can close as review-ready without actual payout', () => {
  const lab = make();
  lab.allocate({reserveId:'coinbox',campaignId:'cash-need',eventId:'coin1'});
  lab.allocate({reserveId:'coinbox',campaignId:'cash-need',eventId:'coin2'});
  assert.equal(c(lab,'cash-need').phase,'ready-for-payee-review');
  assert.equal(c(lab,'cash-need').externalPaymentMade,false);
  assert.equal(r(lab,'coinbox').availableCents,0);
});
test('idempotency detects conflicting duplicate event and keeps reserve conserved', () => {
  const lab = make();
  lab.allocate({reserveId:'sponsor',campaignId:'rent',eventId:'e1',cents:1});
  assert.equal(lab.allocate({reserveId:'sponsor',campaignId:'rent',eventId:'e1',cents:1}).status,'duplicate');
  assert.throws(()=>lab.allocate({reserveId:'sponsor',campaignId:'rent',eventId:'e1',cents:2}),/Conflicting/);
  assert.equal(r(lab,'sponsor').availableCents + c(lab,'rent').allocatedCents,3);
});
test('negative, fractional, exhausted and over-goal allocations are rejected', () => {
  const lab = make();
  assert.throws(()=>lab.allocate({reserveId:'sponsor',campaignId:'rent',eventId:'bad',cents:0}),/positive/);
  assert.throws(()=>lab.allocate({reserveId:'sponsor',campaignId:'rent',eventId:'bad2',cents:1.5}),/integer/);
  assert.throws(()=>lab.allocate({reserveId:'sponsor',campaignId:'rent',eventId:'exhaust',cents:4}),/exhausted/);
  assert.throws(()=>lab.allocate({reserveId:'sponsor',campaignId:'rent',eventId:'over',cents:3}),/exceed/);
  assert.equal(c(lab,'rent').allocatedCents,0);
});
test('fixture inputs cannot alias into live mutable balances', () => {
  const reserves=[{id:'r', backingType:'usd-settled', availableCents:1}];
  const campaigns=[{id:'c', requirementType:'electronic-bill', goalCents:1}];
  const lab=createPennyCampaignLab({reserves,campaigns});
  reserves[0].availableCents=999;
  const snap=lab.inspect();
  snap.reserves[0].availableCents=999;
  assert.equal(lab.inspect().reserves[0].availableCents,1);
  lab.allocate({reserveId:'r',campaignId:'c',eventId:'s'});
  assert.equal(lab.inspect().reserves[0].availableCents,0);
});
test('no external funding API or secret identity verification is implied', () => {
  const lab=make();
  assert.deepEqual(Object.keys(lab).sort(),['allocate','inspect','pledge','sponsorLike']);
  assert.equal(lab.inspect().syntheticOnly,true);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {makeMeaningFixture,validateExchange,proposeDirectExchange,previewForOwner} from '../meaning-exchange.mjs';
import {createDirectOfferLab} from '../consent-receipts.mjs';

const f=()=>makeMeaningFixture();
test('a personal birth-year relationship creates an ungraded direct offer without graded price',()=>{
  const output=proposeDirectExchange(f());
  assert.equal(output.policy,'meaning-first');
  const match=output.selected.find(x=>x.listingId==='cent-1978');
  assert.equal(match.seekerId,'birthday-collector');
  assert.equal(match.mode,'cash');
  assert.equal(match.proposedAskCents,800);
  assert.deepEqual(match.matchedTags,['1978','family-memory']);
  assert.equal(match.authenticityVerified,false);
  assert.equal(match.titleVerified,false);
  assert.equal(match.moneyMovedCents,0);
});
test('meaning-first creates noncash paths that a cash-only market misses',()=>{
  const all=proposeDirectExchange(f());
  const cash=proposeDirectExchange(f(),{policy:'cash-only'});
  const graded=proposeDirectExchange(f(),{policy:'grade-gate'});
  assert.equal(all.selected.length,3);
  assert.ok(all.selected.some(x=>x.mode==='trade'));
  assert.equal(cash.selected.length,1);
  assert.equal(graded.selected.length,0);
  assert.equal(all.realObjectsTransferred,0);
});
test('matching respects one buyer and one coin, not optimizing sale extraction',()=>{
  const p=proposeDirectExchange(f());
  assert.equal(new Set(p.selected.map(x=>x.listingId)).size,p.selected.length);
  assert.equal(new Set(p.selected.map(x=>x.seekerId)).size,p.selected.length);
  assert.ok(p.totalAffinityScore>0);
  assert.equal(p.selected.reduce((n,x)=>n+(x.proposedAskCents||0),0),800);
});
test('seller sees their own ask, not private buyer liquidity cap',()=>{
  const p=previewForOwner(f(),'family-collection');
  assert.equal(p.otherPartyPrivateBudgetWithheld,true);
  assert.equal(p.matches[0].listedAskCents,800);
  assert.equal(p.matches[0].seekerId,'birthday-collector');
  assert.equal(JSON.stringify(p).includes('maxPersonalCashCents'),false);
});
test('no participant is required to use PCGS, NGC or any grade for explicitly raw coin',()=>{
  const p=proposeDirectExchange(f());
  assert.equal(p.externalAuthenticatorsRequired,false);
  assert.equal(p.titleStillRequiresVerification,true);
  assert.equal(p.participantIdentitiesVerified,false);
  assert.equal(p.realWorldTradeAuthority,false);
});
test('raw grading objection, encumbrance or no shared interest blocks a route',()=>{
  const data=f();
  data.seekers[0].acceptsUngraded=false;
  assert.ok(!proposeDirectExchange(data).selected.some(x=>x.seekerId==='birthday-collector'));
  const other=f();
  other.listings[0].encumbered=true;
  assert.ok(!proposeDirectExchange(other).selected.some(x=>x.listingId==='cent-1978'));
  const zero=f();
  zero.seekers=zero.seekers.map(x=>({...x,interests:['irrelevant-feature']}));
  assert.equal(proposeDirectExchange(zero).selected.length,0);
});
test('unknown numerical prices, duplicate IDs and false title verification fail closed',()=>{
  const data=f(); data.listings[0].askCents=12.3;
  assert.throws(()=>validateExchange(data),/integer/);
  const two=f();two.listings.push({...two.listings[0]});
  assert.throws(()=>validateExchange(two),/Duplicate listing/);
  const title=f();title.listings[0].ownerTitleProof='verified-by-guess';
  assert.throws(()=>validateExchange(title),/cannot assert verified title/);
});
test('fictional offer captures subjective purpose separately from public rarity',()=>{
  const lab=createDirectOfferLab(f());
  const state=lab.propose({offerId:'offer1',listingId:'cent-1978',seekerId:'birthday-collector',
    mode:'cash',expressedMeaning:'I collect 1978 coins to remember a meaningful year.'});
  assert.equal(state.offers[0].expressedMeaning,'I collect 1978 coins to remember a meaningful year.');
  assert.equal(state.offers[0].disclosure.thirdPartyGrade,'NONE');
  assert.equal(state.offers[0].status,'buyer-interest-expressed');
  assert.equal(state.realMoneyMovedCents,0);
  assert.equal(state.cryptographicSignaturesVerified,false);
});
test('seller can say no and no obligation or trade is created',()=>{
  const lab=createDirectOfferLab(f());
  lab.propose({offerId:'no',listingId:'cent-1978',seekerId:'birthday-collector',
    mode:'cash',expressedMeaning:'The date matters to me.'});
  const state=lab.ownerRespond({offerId:'no',ownerId:'family-collection',accept:false});
  assert.equal(state.offers[0].status,'owner-declined');
  assert.equal(state.legalObligationsCreated,0);
  assert.throws(()=>lab.buyerRespond({offerId:'no',seekerId:'birthday-collector',accept:true}),/not available/);
});
test('two-sided acceptance remains a HOLD: no cash, title, item, labor or custody transferred',()=>{
  const lab=createDirectOfferLab(f());
  lab.propose({offerId:'a',listingId:'cent-1978',seekerId:'birthday-collector',
    mode:'cash',expressedMeaning:'I like the year.'});
  lab.ownerRespond({offerId:'a',ownerId:'family-collection',accept:true});
  const result=lab.buyerRespond({offerId:'a',seekerId:'birthday-collector',accept:true});
  assert.equal(result.offers[0].status,'mutually-affirmed-in-fixture-HOLD-not-settled');
  assert.equal(result.offers[0].ownerAffirmed,true);
  assert.equal(result.offers[0].buyerReaffirmed,true);
  assert.equal(result.realMoneyMovedCents,0);
  assert.equal(result.realCoinsDelivered,0);
  assert.equal(result.legalObligationsCreated,0);
  assert.equal(result.completedTradeRights,false);
});
test('cannot make multiple simultaneously confirmed fictional deals for same coin or person',()=>{
  const data=f();
  data.seekers.push({...data.seekers[0],id:'alternative-buyer'});
  const lab=createDirectOfferLab(data);
  lab.propose({offerId:'first',listingId:'cent-1978',seekerId:'birthday-collector',
    mode:'cash',expressedMeaning:'This is a personal year.'});
  lab.propose({offerId:'second',listingId:'cent-1978',seekerId:'alternative-buyer',
    mode:'cash',expressedMeaning:'The date means something to me.'});
  lab.ownerRespond({offerId:'first',ownerId:'family-collection',accept:true});
  lab.ownerRespond({offerId:'second',ownerId:'family-collection',accept:true});
  lab.buyerRespond({offerId:'first',seekerId:'birthday-collector',accept:true});
  assert.throws(()=>lab.buyerRespond({offerId:'second',seekerId:'alternative-buyer',accept:true}),/Conflict/);
});
test('buyer can choose a consensual barter that has no dollar price',()=>{
  const lab=createDirectOfferLab(f());
  lab.propose({offerId:'trade',listingId:'cent-1912',seekerId:'town-storyteller',
    mode:'trade',expressedMeaning:'For a neighborhood exhibit.'});
  lab.ownerRespond({offerId:'trade',ownerId:'neighborhood-archive',accept:true});
  const s=lab.buyerRespond({offerId:'trade',seekerId:'town-storyteller',accept:true});
  assert.equal(s.offers[0].terms.tradeCategory,'photography');
  assert.equal('proposedPaymentCents' in s.offers[0].terms,false);
  assert.equal(s.completedTradeRights,false);
});
test('possible gift does not create a fundraising payment, reserved balance, or obligation',()=>{
  const lab=createDirectOfferLab(f());
  const state=lab.propose({offerId:'g',listingId:'cent-1912',seekerId:'town-storyteller',
    mode:'gift',expressedMeaning:'A piece of community memory.'});
  assert.equal(state.offers[0].terms.noReciprocalConsiderationExpected,true);
  assert.equal(state.realMoneyMovedCents,0);
  assert.equal(state.realCoinsDelivered,0);
});
test('snapshot mutations cannot alter internal offer terms',()=>{
  const lab=createDirectOfferLab(f());
  const s=lab.propose({offerId:'s',listingId:'cent-1978',seekerId:'birthday-collector',
    mode:'cash',expressedMeaning:'Family story.'});
  s.offers[0].terms.proposedPaymentCents=100000;
  s.offers[0].sharedMeaningTags.push('faked');
  const t=lab.snapshot();
  assert.equal(t.offers[0].terms.proposedPaymentCents,800);
  assert.ok(!t.offers[0].sharedMeaningTags.includes('faked'));
});
test('both parties can withdraw nonbinding simulated proposal',()=>{
  const lab=createDirectOfferLab(f());
  lab.propose({offerId:'w',listingId:'cent-1978',seekerId:'birthday-collector',
    mode:'cash',expressedMeaning:'A year I care about.'});
  lab.ownerRespond({offerId:'w',ownerId:'family-collection',accept:true});
  lab.buyerRespond({offerId:'w',seekerId:'birthday-collector',accept:true});
  const state=lab.release({offerId:'w',actorId:'birthday-collector'});
  assert.equal(state.offers[0].status,'withdrawn');
  assert.equal(state.realMoneyMovedCents,0);
});

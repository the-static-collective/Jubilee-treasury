import { weaveToDestination } from './weave.mjs';
import { createStewardBankLab } from './penny-bank.mjs';
import { proposeBatchNetting } from './batch-net.mjs';
import { createPennyCampaignLab } from '../puddle-001/penny-campaign.mjs';

// Invented, non-personalized balances and fee assumptions; not provider quotes.
export const scenario = {
  goalCents:325,destinationId:'spendable-bank',
  sources:[
    {id:'bank',availableCents:100},
    {id:'wallet-a',availableCents:200},
    {id:'wallet-b',availableCents:58}
  ],
  routes:[
    {id:'bank-card',fromId:'bank',toId:'spendable-bank',minGrossCents:1,maxGrossCents:100,fixedFeeCents:0,feeBasisPoints:0,arrivalMinutes:0,consentedForModel:true,providerPermitted:true,evidence:'assumed',rail:'debit-card'},
    {id:'a-instant-example',fromId:'wallet-a',toId:'spendable-bank',minGrossCents:1,maxGrossCents:200,fixedFeeCents:25,feeBasisPoints:0,arrivalMinutes:30,consentedForModel:true,providerPermitted:true,evidence:'assumed',rail:'manual-wallet'},
    {id:'a-standard-example',fromId:'wallet-a',toId:'spendable-bank',minGrossCents:1,maxGrossCents:200,fixedFeeCents:0,feeBasisPoints:0,arrivalMinutes:4320,consentedForModel:true,providerPermitted:true,evidence:'assumed',rail:'manual-wallet'},
    {id:'b-instant-example',fromId:'wallet-b',toId:'spendable-bank',minGrossCents:1,maxGrossCents:58,fixedFeeCents:25,feeBasisPoints:0,arrivalMinutes:30,consentedForModel:true,providerPermitted:true,evidence:'assumed',rail:'manual-wallet'},
    {id:'b-standard-example',fromId:'wallet-b',toId:'spendable-bank',minGrossCents:1,maxGrossCents:58,fixedFeeCents:0,feeBasisPoints:0,arrivalMinutes:4320,consentedForModel:true,providerPermitted:true,evidence:'assumed',rail:'manual-wallet'}
  ],
};
export function runSyntheticEconomy() {
  const immediate=weaveToDestination({...scenario,horizonMinutes:30});
  const patient=weaveToDestination({...scenario,horizonMinutes:4320});
  const bank=createStewardBankLab({
    banks:[{id:'community-custodian-example',storageCapacityCoins:1000}],
    fictionalSponsorBudgetCents:10
  });
  bank.countCoins({bankId:'community-custodian-example',batchId:'physical-batch-1',reportedCoins:500,countedCoins:500,witnessIds:['witness-a','witness-b']});
  bank.earmark({bankId:'community-custodian-example',requestId:'neighbor-local-need-1',coins:50});
  bank.payForService({bankId:'community-custodian-example',serviceId:'counting-service-1',batchId:'physical-batch-1',category:'counting',cents:2});
  const campaign=createPennyCampaignLab({
    reserves:[{id:'sponsored-dollars-example',backingType:'usd-settled',availableCents:3}],
    campaigns:[{id:'one-cent-campaign',requirementType:'electronic-bill',goalCents:3}]
  });
  campaign.pledge({campaignId:'one-cent-campaign',pledgeId:'unfunded-interest',cents:3});
  for(const actorId of ['a','b','c']) campaign.sponsorLike({reserveId:'sponsored-dollars-example',campaignId:'one-cent-campaign',actorId});
  const netting=proposeBatchNetting({
    obligations:[
      {id:'one',from:'A',to:'B',cents:50},
      {id:'two',from:'B',to:'C',cents:50}
    ],
    explicitModelAuthorizations:['A','B','C']
  });
  return {
    labels:'ALL AMOUNTS, PARTICIPANTS, PERMISSIONS AND PENNY CUSTODY ARE FICTIONAL',
    comparison:{immediate,patient},
    localCoinSteward:bank.snapshot(),sponsoredCampaign:campaign.inspect(),netting,
    realMoneyMoved:false,pennyTokensIssued:0,authorizedCustodyCreated:false
  };
}
if (process.argv[1] && import.meta.url === new URL('file://' + process.argv[1]).href) {
  console.log(JSON.stringify(runSyntheticEconomy(),null,2));
}

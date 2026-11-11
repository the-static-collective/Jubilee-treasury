import { planPurchase, dollars } from './planner.mjs';
const form = document.querySelector('#planner');
const result = document.querySelector('#result');
function parseCents(input) {
  const raw = input.value.trim();
  if (!/^(?:\d+)(?:\.\d{1,2})?$/.test(raw)) throw new TypeError('Use nonnegative amounts with up to two decimal places.');
  const [whole, fraction = ''] = raw.split('.');
  const amount = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(amount)) throw new TypeError('The amount is too large to calculate safely.');
  return amount;
}
function clear(node) { node.replaceChildren(); }
function add(node, tag, text, cssClass) {
  const el = document.createElement(tag);
  el.textContent = text;
  if (cssClass) el.className = cssClass;
  node.append(el);
  return el;
}
function show(plan) {
  clear(result);
  result.hidden = false;
  add(result, 'div', 'AVAILABLE ACROSS SOURCES', 'eyebrow');
  add(result, 'strong', dollars(plan.totalCents), 'money');
  add(result, 'p', `${dollars(plan.tenderableCents)} entered as directly usable at this merchant. Both figures are self-reported, not verified.`, 'small');
  const states = {
    single: ['SINGLE PAYMENT MAY WORK', 'One reported spending source could cover the price. Merchant authorization is not guaranteed.'],
    split: ['SPLIT PAYMENT MAY WORK', 'A possible allocation exists, conditional on the merchant and each provider accepting these transactions.'],
    'needs-split-support': ['MONEY IS FRAGMENTED', 'The combined usable balances could cover this purchase, but no single payment method does and split tender has not been confirmed.'],
    inaccessible: ['NOT ALL FUNDS WORK HERE', 'There may be enough across accounts, but the declared spending methods do not cover this purchase.'],
    insufficient: ['NOT ENOUGH COMBINED', 'Even all the entered balances together fall short of this purchase.'],
  };
  const [status, explanation] = states[plan.status];
  add(result, 'div', status, 'state');
  add(result, 'p', explanation);
  const rows = plan.allocations.length ? plan.allocations : plan.conditionalAllocations || [];
  if (rows.length) {
    add(result, 'h3', plan.allocations.length ? 'Possible tender allocation' : 'Hypothetical split, if merchant support changes');
    const ul = document.createElement('ul');
    rows.forEach(row => add(ul, 'li', `${row.label}: ${dollars(row.cents)}`));
    result.append(ul);
  }
  if (plan.status === 'insufficient' || plan.status === 'inaccessible') {
    add(result, 'p', `Shortfall for this calculation: ${dollars(plan.shortfallCents)}.`);
  }
  add(result, 'p', 'No transfer was made. No fees, settlement delays, provider limits, holds, minimum purchases, or merchant rules have been verified.', 'small');
}
form.addEventListener('submit', event => {
  event.preventDefault();
  try {
    const sources = [
      { id:'bank', label:'Bank debit', balanceCents:parseCents(form.querySelector('#bank')), canTenderHere:form.querySelector('#bank-card').checked },
      { id:'wallet-a', label:'Wallet A', balanceCents:parseCents(form.querySelector('#wallet-a')), canTenderHere:form.querySelector('#wallet-a-card').checked },
      { id:'wallet-b', label:'Wallet B', balanceCents:parseCents(form.querySelector('#wallet-b')), canTenderHere:form.querySelector('#wallet-b-card').checked },
    ];
    show(planPurchase({ amountCents:parseCents(form.querySelector('#price')), sources, merchant:{ allowsSplitTender:form.querySelector('#split').checked } }));
  } catch (error) {
    clear(result);
    result.hidden = false;
    add(result, 'h2', 'Check the amounts');
    add(result, 'p', error instanceof Error ? error.message : 'Invalid input.');
  }
});
form.querySelector('#reset').addEventListener('click', () => {
  form.reset();
  clear(result);
  result.hidden = true;
});

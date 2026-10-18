#!/usr/bin/env node
import { createPennyBox } from '../src/server.mjs';
import { Journal, createNeed } from '../src/ledger.mjs';
import { resolve } from 'node:path';

const journalPath = resolve(process.env.PENNY_BOX_JOURNAL || './.local-demo/events.jsonl');
const store = new Journal(journalPath);
if (process.argv.includes('--seed')) {
  if (store.read().events.length)
    throw Error('Demo already seeded; refusing to overwrite or duplicate data');
  const needs = [
    {title:'Pantry coin box',summary:'Collect loose pennies for a fictional community pantry need.',goal:500,unit:'pennies'},
    {title:'Neighborhood grocery runs',summary:'Help deliver groceries through an approved local steward.',goal:8,unit:'deliveries'},
    {title:'Community computer shelf',summary:'Useful old devices for a future volunteer computing lab.',goal:2,unit:'devices'}
  ];
  for (const spec of needs) store.append(createNeed(spec));
  console.log(JSON.stringify({seeded:true,synthetic:true,journalPath,needs:3}));
  process.exit(0);
}
const port = Number(process.env.PENNY_BOX_PORT || 8797);
if (!Number.isInteger(port) || port < 1024 || port > 65535)
  throw Error('PENNY_BOX_PORT must be from 1024 to 65535');
createPennyBox({journalPath,stewardToken:process.env.PENNY_BOX_STEWARD_TOKEN||null})
  .listen(port,'127.0.0.1',()=>console.log(JSON.stringify({
    ready:true,origin:'http://127.0.0.1:'+port,
    publicInternetListener:false,stewardApiEnabled:!!process.env.PENNY_BOX_STEWARD_TOKEN
  })));

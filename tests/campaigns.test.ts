import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Wallet, verifyMessage } from 'ethers';
import { amountSchema, campaignFormSchema, demoCampaigns } from '../src/lib/campaigns';
import { metadataMessage } from '../src/lib/signature';

test('donations reject zero, negatives, exponential notation, and excessive decimals', () => {
  for (const value of ['0', '-1', '1e3', '.1', '0.0000000000000000001', 'NaN', '', '1000001']) assert.equal(amountSchema.safeParse(value).success, false, value);
  for (const value of ['0.01', '1', '0.000000000000000001']) assert.equal(amountSchema.safeParse(value).success, true, value);
});
test('campaign form requires future deadline and valid image URL', () => {
  const base = { ...demoCampaigns()[0], deadline: new Date(Date.now() + 86400000).toISOString() };
  assert.equal(campaignFormSchema.safeParse(base).success, true);
  assert.equal(campaignFormSchema.safeParse({ ...base, deadline: '2020-01-01' }).success, false);
  assert.equal(campaignFormSchema.safeParse({ ...base, image: 'javascript:alert(1)' }).success, false);
  assert.equal(campaignFormSchema.safeParse({ ...base, description: 'too short' }).success, false);
});
test('signed metadata binds the content, contract and transaction to the creator', async () => {
  const wallet = Wallet.createRandom();
  const contract = Wallet.createRandom().address;
  const metadata = demoCampaigns()[0];
  const tx = '0x' + 'ab'.repeat(32);
  const message = metadataMessage(tx, metadata, contract);
  const signature = await wallet.signMessage(message);
  assert.equal(verifyMessage(message, signature), wallet.address);
  assert.notEqual(verifyMessage(metadataMessage(tx, { ...metadata, title: 'Tampered campaign title' }, contract), signature), wallet.address);
  assert.notEqual(metadataMessage(tx, metadata, Wallet.createRandom().address), message);
  assert.notEqual(metadataMessage('0x' + 'cd'.repeat(32), metadata, contract), message);
});

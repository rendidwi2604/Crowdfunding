import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { BrowserProvider, Contract, ContractFactory, parseEther } from 'ethers';
const require = createRequire(import.meta.url);
const solc = require('solc');
const ganache = require('ganache');
const reverted = (promise: Promise<unknown>, reason: string) => assert.rejects(promise, (error: unknown) => {
  const e = error as { code?: string; reason?: string };
  return e.code === 'CALL_EXCEPTION' && e.reason === reason;
});

test('crowdfunding lifecycle and authorization on a local EVM', { timeout: 60000 }, async t => {
  const check = async (name: string, body: () => Promise<void>) => { await body(); t.diagnostic(name); };
  const source = readFileSync('contracts/Crowdfunding.sol', 'utf8');
  const output = JSON.parse(solc.compile(JSON.stringify({ language: 'Solidity', sources: { 'Crowdfunding.sol': { content: source } }, settings: { optimizer: { enabled: true, runs: 200 }, evmVersion: 'shanghai', outputSelection: { '*': { '*': ['abi', 'evm.bytecode'] } } } })));
  const errors = (output.errors || []).filter((e: { severity: string }) => e.severity === 'error');
  assert.deepEqual(errors, []);
  const compiled = output.contracts['Crowdfunding.sol'].Crowdfunding;
  const engine = ganache.provider({ logging: { quiet: true }, wallet: { deterministic: true }, chain: { hardfork: 'shanghai' } });
  const provider = new BrowserProvider(engine);
  provider.pollingInterval = 10;
  try {
  const owner = await provider.getSigner(0), donor = await provider.getSigner(1);
  const deployed = await new ContractFactory(compiled.abi, compiled.evm.bytecode.object, owner).deploy();
  await deployed.waitForDeployment();
  const contract = new Contract(await deployed.getAddress(), compiled.abi, owner);
  const donorContract = contract.connect(donor) as Contract;
  const now = (await provider.getBlock('latest'))!.timestamp;
  await check('reject invalid target, deadline and unknown campaign', async () => {
    await reverted(contract.createCampaign.staticCall(0, now + 3600), 'Target must be positive');
    await reverted(contract.createCampaign.staticCall(1, now - 1), 'Deadline must be future');
    await reverted(contract.getCampaignDetails(99), 'Campaign not found');
  });
  await (await contract.createCampaign(parseEther('1'), now + 3600)).wait();
  await check('record campaign and donation accurately', async () => {
    await reverted(donorContract.donateToCampaign.staticCall(0, { value: 0 }), 'Donation must be positive');
    const receipt = await (await donorContract.donateToCampaign(0, { value: parseEther('0.4') })).wait();
    const event = receipt.logs.map((l: { topics: string[]; data: string }) => contract.interface.parseLog(l)).find((e: { name?: string }) => e?.name === 'DonationReceived');
    assert.equal(event.args.amount, parseEther('0.4'));
    const c = await contract.getCampaignDetails(0);
    assert.equal(c.creator, await owner.getAddress());
    assert.equal(c.raised, parseEther('0.4'));
  });
  await check('block non-owner and early withdrawal', async () => {
    await reverted(donorContract.withdrawFunds.staticCall(0), 'Only creator');
    await reverted(contract.withdrawFunds.staticCall(0), 'Funding still active');
  });
  await check('allow owner withdrawal at target and prevent double spend', async () => {
    await (await donorContract.donateToCampaign(0, { value: parseEther('0.6') })).wait();
    await (await contract.withdrawFunds(0, { gasLimit: 150000 })).wait();
    assert.equal((await contract.getCampaignDetails(0)).withdrawn, true);
    assert.equal(BigInt(await engine.request({ method: 'eth_getBalance', params: [await contract.getAddress(), 'latest'] })), 0n);
    await reverted(contract.withdrawFunds.staticCall(0), 'Already withdrawn');
    await reverted(donorContract.donateToCampaign.staticCall(0, { value: 1 }), 'Funds already withdrawn');
  });
  await check('allow partial funding withdrawal after deadline and block late donations', async () => {
    await (await contract.createCampaign(parseEther('2'), now + 300)).wait();
    await (await donorContract.donateToCampaign(1, { value: parseEther('0.2') })).wait();
    await engine.request({ method: 'evm_increaseTime', params: [400] });
    await engine.request({ method: 'evm_mine', params: [] });
    await reverted(donorContract.donateToCampaign.staticCall(1, { value: 1 }), 'Campaign ended');
    await (await contract.withdrawFunds(1)).wait();
    assert.equal((await contract.getCampaignDetails(1)).raised, parseEther('0.2'));
  });
  } finally { provider.destroy(); await engine.disconnect(); }
});

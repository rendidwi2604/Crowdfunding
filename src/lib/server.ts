import 'server-only';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { Contract, JsonRpcProvider, isAddress } from 'ethers';
import { ABI, CONTRACT_ADDRESS, SEPOLIA_ID } from './contract';
export const configured = () => Boolean(isAddress(CONTRACT_ADDRESS) && process.env.DATABASE_URL && process.env.SEPOLIA_RPC_URL);
let database: ReturnType<typeof drizzle> | undefined;
export function db() {
  if (!process.env.DATABASE_URL) throw new Error('PostgreSQL belum dikonfigurasi.');
  return database ??= drizzle(postgres(process.env.DATABASE_URL, { max: 5, prepare: false }));
}
export async function blockchain() {
  if (!configured()) throw new Error('Integrasi Sepolia belum dikonfigurasi.');
  const provider = new JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const network = await provider.getNetwork();
  if (network.chainId !== BigInt(SEPOLIA_ID)) throw new Error('RPC harus menggunakan jaringan Sepolia.');
  return { provider, contract: new Contract(CONTRACT_ADDRESS, ABI, provider) };
}

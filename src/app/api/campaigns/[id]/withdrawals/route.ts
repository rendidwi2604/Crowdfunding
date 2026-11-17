import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { EventLog, formatEther } from 'ethers';
import { blockchain, configured, db } from '@/lib/server';
import { campaignMetadata } from '@/lib/schema';
import type { Withdrawal } from '@/lib/campaigns';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!configured()) return NextResponse.json({ error: 'Sepolia belum dikonfigurasi.' }, { status: 503 });
  const { id } = await context.params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: 'ID tidak valid.' }, { status: 400 });
  try {
    const [row] = await db().select().from(campaignMetadata).where(eq(campaignMetadata.id, id));
    if (!row) return NextResponse.json({ error: 'Kampanye tidak ditemukan.' }, { status: 404 });
    const { contract, provider } = await blockchain();
    const latest = await provider.getBlockNumber();
    const cursor = new URL(request.url).searchParams.get('cursor');
    if (cursor && !/^\d+$/.test(cursor)) return NextResponse.json({ error: 'Cursor tidak valid.' }, { status: 400 });
    let to = Math.min(cursor ? Number(cursor) : latest, latest);
    const withdrawals: Withdrawal[] = [];
    const filter = contract.filters.FundsWithdrawn(id);
    const batchSize = 4999;
    while (to >= row.creationBlock) {
      const from = Math.max(row.creationBlock, to - batchSize);
      const events = await contract.queryFilter(filter, from, to);
      withdrawals.push(...events.filter((e): e is EventLog => e instanceof EventLog).map(e => ({ address: String(e.args.creator), amount: formatEther(e.args.amount), totalWithdrawn: formatEther(e.args.totalWithdrawn), hash: e.transactionHash, date: new Date(Number(e.args.timestamp) * 1000).toISOString() })));
      to = from - 1;
    }
    withdrawals.sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
    return NextResponse.json({ withdrawals, nextCursor: null });
  } catch (error) {
    console.error('Withdrawal history failed:', error);
    return NextResponse.json({ error: 'Riwayat pencairan belum dapat dimuat.' }, { status: 503 });
  }
}

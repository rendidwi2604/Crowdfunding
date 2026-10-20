import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { EventLog, formatEther } from 'ethers';
import { blockchain, configured, db } from '@/lib/server';
import { campaignMetadata } from '@/lib/schema';
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
    const to = Math.min(cursor ? Number(cursor) : latest, latest);
    const from = Math.max(row.creationBlock, to - 4999);
    if (to < row.creationBlock) return NextResponse.json({ donations: [], nextCursor: null });
    const events = await contract.queryFilter(contract.filters.DonationReceived(id), from, to);
    const donations = events.filter((e): e is EventLog => e instanceof EventLog).reverse().map(e => ({ address: String(e.args.donor), amount: formatEther(e.args.amount), hash: e.transactionHash, date: new Date(Number(e.args.timestamp) * 1000).toISOString() }));
    return NextResponse.json({ donations, nextCursor: from > row.creationBlock ? from - 1 : null });
  } catch (error) { console.error('Donation history failed:', error); return NextResponse.json({ error: 'Riwayat transaksi belum dapat dimuat.' }, { status: 503 }); }
}

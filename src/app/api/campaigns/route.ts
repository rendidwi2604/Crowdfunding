import { NextResponse } from 'next/server';
import { formatEther, Interface, verifyMessage } from 'ethers';
import { z } from 'zod';
import { blockchain, configured, db } from '@/lib/server';
import { campaignMetadata, users } from '@/lib/schema';
import { metadataSchema } from '@/lib/campaigns';
import { ABI, CONTRACT_ADDRESS } from '@/lib/contract';
import { metadataMessage } from '@/lib/signature';
export const dynamic = 'force-dynamic';
export async function GET() {
  if (!configured()) return NextResponse.json({ mode: 'demo', campaigns: [] });
  try {
    const rows = await db().select().from(campaignMetadata);
    const { contract } = await blockchain();
    const campaigns = await Promise.all(rows.map(async row => {
      const c = await contract.getCampaignDetails(row.id);
      return { id: row.id, title: row.title, description: row.description, category: row.category, image: row.imageUrl, location: row.location, creator: c.creator, organizer: row.organizer, target: formatEther(c.target), raised: formatEther(c.raised), deadline: new Date(Number(c.deadline) * 1000).toISOString(), withdrawn: c.withdrawn, donations: [], demo: false, creationBlock: row.creationBlock };
    }));
    return NextResponse.json({ mode: 'live', campaigns });
  } catch (error) { console.error('Campaign read failed:', error); return NextResponse.json({ error: 'Kampanye belum dapat dimuat dari Sepolia. Coba muat ulang.' }, { status: 503 }); }
}
const requestSchema = z.object({ transactionHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/), signature: z.string().max(500), metadata: metadataSchema });
export async function POST(request: Request) {
  if (!configured()) return NextResponse.json({ error: 'Integrasi Sepolia belum dikonfigurasi.' }, { status: 503 });
  try {
    const raw = await request.text();
    if (raw.length > 20000) return NextResponse.json({ error: 'Data terlalu besar.' }, { status: 413 });
    const { transactionHash, signature, metadata } = requestSchema.parse(JSON.parse(raw));
    const { provider } = await blockchain();
    const receipt = await provider.getTransactionReceipt(transactionHash);
    if (!receipt || receipt.status !== 1 || receipt.to?.toLowerCase() !== CONTRACT_ADDRESS.toLowerCase()) return NextResponse.json({ error: 'Transaksi kontrak belum terkonfirmasi.' }, { status: 400 });
    const abi = new Interface(ABI);
    const event = receipt.logs.filter(l => l.address.toLowerCase() === CONTRACT_ADDRESS.toLowerCase()).map(l => { try { return abi.parseLog(l); } catch { return null; } }).find(l => l?.name === 'CampaignCreated');
    if (!event) return NextResponse.json({ error: 'Transaksi bukan pembuatan kampanye.' }, { status: 400 });
    const creator = String(event.args.creator).toLowerCase();
    if (verifyMessage(metadataMessage(transactionHash, metadata, CONTRACT_ADDRESS), signature).toLowerCase() !== creator) return NextResponse.json({ error: 'Tanda tangan harus berasal dari pembuat kampanye.' }, { status: 403 });
    await db().transaction(async tx => {
      await tx.insert(users).values({ walletAddress: creator, name: metadata.organizer }).onConflictDoNothing();
      await tx.insert(campaignMetadata).values({ id: String(event.args.campaignId), creatorAddress: creator, title: metadata.title, description: metadata.description, imageUrl: metadata.image, category: metadata.category, location: metadata.location, organizer: metadata.organizer, creationBlock: receipt.blockNumber, transactionHash }).onConflictDoNothing();
    });
    return NextResponse.json({ id: String(event.args.campaignId) }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) return NextResponse.json({ error: 'Metadata kampanye tidak valid.' }, { status: 400 });
    console.error('Metadata save failed:', error);
    return NextResponse.json({ error: 'Metadata belum tersimpan. Transaksi tetap aman; coba simpan metadata kembali.' }, { status: 503 });
  }
}

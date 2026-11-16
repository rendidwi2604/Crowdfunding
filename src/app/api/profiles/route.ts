import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getAddress, isAddress, verifyMessage } from 'ethers';
import { z } from 'zod';
import { databaseConfigured, db } from '@/lib/server';
import { users } from '@/lib/schema';
import { profileMessage } from '@/lib/signature';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!databaseConfigured()) return NextResponse.json({ error: 'PostgreSQL belum dikonfigurasi.' }, { status: 503 });
  const address = new URL(request.url).searchParams.get('address') || '';
  if (!isAddress(address)) return NextResponse.json({ error: 'Alamat wallet tidak valid.' }, { status: 400 });
  try {
    const [profile] = await db().select().from(users).where(eq(users.walletAddress, address.toLowerCase()));
    return NextResponse.json({ profile: profile || null });
  } catch (error) {
    console.error('Profile read failed:', error);
    return NextResponse.json({ error: 'Identitas wallet belum dapat dimuat.' }, { status: 503 });
  }
}

const profileSchema = z.object({
  address: z.string().refine(isAddress),
  name: z.string().trim().min(3).max(100),
  bio: z.string().trim().max(500).default(''),
  signature: z.string().max(500),
});

export async function POST(request: Request) {
  if (!databaseConfigured()) return NextResponse.json({ error: 'PostgreSQL belum dikonfigurasi.' }, { status: 503 });
  try {
    const raw = await request.text();
    if (raw.length > 3000) return NextResponse.json({ error: 'Data terlalu besar.' }, { status: 413 });
    const data = profileSchema.parse(JSON.parse(raw));
    const address = getAddress(data.address).toLowerCase();
    const signer = verifyMessage(profileMessage(address, data.name, data.bio), data.signature).toLowerCase();
    if (signer !== address) return NextResponse.json({ error: 'Tanda tangan harus berasal dari wallet yang didaftarkan.' }, { status: 403 });
    await db().insert(users).values({ walletAddress: address, name: data.name, bio: data.bio || null }).onConflictDoUpdate({ target: users.walletAddress, set: { name: data.name, bio: data.bio || null } });
    return NextResponse.json({ address, name: data.name, bio: data.bio });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) return NextResponse.json({ error: 'Data identitas tidak valid.' }, { status: 400 });
    console.error('Profile save failed:', error);
    return NextResponse.json({ error: 'Identitas wallet belum dapat disimpan.' }, { status: 503 });
  }
}

// app/api/user/limits/route.ts  (or /usage/route.ts)

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { getUserUsage } from '@/lib/subscription';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();

  try {
    const usage = await getUserUsage(session.user.id);

    return NextResponse.json({
      success: true,
      data: usage,
    });
  } catch (err) {
    console.error('Error fetching user limits:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch usage data' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { getRoastsByTargetUser, getUserRoastStats } from '@/app/actions/roast';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const userId = searchParams.get('userId');
  const stats = searchParams.get('stats');

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  try {
    if (stats === 'true') {
      const roastStats = await getUserRoastStats(userId);
      return NextResponse.json({ stats: roastStats });
    } else {
      const roasts = await getRoastsByTargetUser(userId);
      return NextResponse.json({ roasts });
    }
  } catch (error) {
    console.error('Error in roasts API route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

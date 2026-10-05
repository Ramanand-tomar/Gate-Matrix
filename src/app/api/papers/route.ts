import { NextResponse } from 'next/server';
import { getPapers, createPaper, PaperModel } from '@/lib/firebase/models';

export const dynamic = 'force-dynamic';

// GET /api/papers?branch=CS
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const branch = searchParams.get('branch') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const papers = await getPapers(branch, limit);
    return NextResponse.json({ success: true, count: papers.length, papers, source: 'firestore_db' });
  } catch (error: any) {
    console.error('Error fetching papers:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/papers (Add new paper doc to Firestore)
export async function POST(request: Request) {
  try {
    const body: PaperModel = await request.json();
    if (!body.paper_id || !body.title || !body.branch) {
      return NextResponse.json({ success: false, error: 'paper_id, title, and branch are required' }, { status: 400 });
    }

    const ok = await createPaper(body);
    if (!ok) {
      return NextResponse.json({ success: false, error: 'Failed to create paper document in Firestore' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Paper added to Firestore successfully', paper_id: body.paper_id });
  } catch (error: any) {
    console.error('Error adding paper:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

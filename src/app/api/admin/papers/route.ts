import { NextResponse } from 'next/server';
import { getPapers, getPaperById, createPaper, updatePaper, deletePaper, PaperModel, QuestionModel } from '@/lib/firebase/models';

export const dynamic = 'force-dynamic';

function isAuthorizedAdminCall(request: Request): boolean {
  const secret = request.headers.get('x-admin-secret');
  return secret === (process.env.ADMIN_SECRET_KEY || 'GATE_MATRIX_SECURE_ADMIN_2026');
}

// GET /api/admin/papers - Fetch all paper records and question metrics
export async function GET(request: Request) {
  if (!isAuthorizedAdminCall(request)) {
    return NextResponse.json({ success: false, error: 'Route not found' }, { status: 404 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const branch = searchParams.get('branch') || undefined;
    const paperId = searchParams.get('paper_id');

    if (paperId) {
      const singlePaper = await getPaperById(paperId);
      if (!singlePaper) {
        return NextResponse.json({ success: false, error: 'Test paper not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, paper: singlePaper });
    }

    const { papers, total } = await getPapers(branch, 5000);

    const totalQuestionsCount = papers.reduce((sum, p) => sum + (p.total_questions || 0), 0);
    const branchCounts: Record<string, number> = {};
    papers.forEach((p) => {
      const b = p.branch || 'GENERAL';
      branchCounts[b] = (branchCounts[b] || 0) + 1;
    });

    return NextResponse.json({
      success: true,
      totalPapers: total,
      totalQuestionsCount,
      branchCounts,
      papers,
    });
  } catch (error: any) {
    console.error('Error fetching admin test papers:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch test papers' },
      { status: 500 }
    );
  }
}

// POST /api/admin/papers - Create a new test paper release
export async function POST(request: Request) {
  if (!isAuthorizedAdminCall(request)) {
    return NextResponse.json({ success: false, error: 'Route not found' }, { status: 404 });
  }
  try {
    const body = await request.json();
    const { title, branch, series, provider, total_questions, questions } = body as {
      title: string;
      branch: string;
      series?: string;
      provider?: string;
      total_questions?: number;
      questions?: QuestionModel[];
    };

    if (!title || !branch) {
      return NextResponse.json({ success: false, error: 'Title and Branch are required' }, { status: 400 });
    }

    const cleanBranch = branch.toUpperCase();
    const paperId = `${cleanBranch.toLowerCase()}_mock_${Date.now()}`;
    const defaultQCount = total_questions || (questions ? questions.length : 15);

    // Initial question templates if none supplied
    const initialQuestions: QuestionModel[] = questions && questions.length > 0
      ? questions
      : Array.from({ length: defaultQCount }).map((_, idx) => ({
          question_id: `${paperId}_q${idx + 1}`,
          question_number: idx + 1,
          type: idx % 3 === 0 ? 'MSQ' : idx % 4 === 0 ? 'NAT' : 'MCQ',
          section: idx < 10 ? 'Core Technical' : 'General Aptitude',
          marks: idx < 10 ? 2 : 1,
          negative_marks: idx % 3 === 0 ? 0 : 0.66,
          question_html: `<p>Sample practice question #${idx + 1} for ${title}. Select the correct answer.</p>`,
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          correct_answer: 'Option A',
          solution_html: `<p>Detailed solution step-by-step for question #${idx + 1}.</p>`,
        }));

    const newPaper: PaperModel = {
      paper_id: paperId,
      title: title.trim(),
      branch: cleanBranch,
      provider: provider?.trim() || 'GATE Matrix CMS',
      series: series?.trim() || 'Official 2026 Mock Series',
      total_questions: initialQuestions.length,
      questions: initialQuestions,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const ok = await createPaper(newPaper);
    if (!ok) {
      return NextResponse.json({ success: false, error: 'Failed to create paper' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      paper: newPaper,
      message: `Successfully created test paper: ${title}`,
    });
  } catch (error: any) {
    console.error('Error creating paper via admin API:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create test paper' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/papers - Edit test paper metadata or question payload
export async function PATCH(request: Request) {
  if (!isAuthorizedAdminCall(request)) {
    return NextResponse.json({ success: false, error: 'Route not found' }, { status: 404 });
  }
  try {
    const body = await request.json();
    const { paper_id, updates } = body as {
      paper_id: string;
      updates: Partial<PaperModel>;
    };

    if (!paper_id || !updates) {
      return NextResponse.json({ success: false, error: 'paper_id and updates are required' }, { status: 400 });
    }

    if (updates.questions) {
      updates.total_questions = updates.questions.length;
    }
    updates.updated_at = new Date().toISOString();

    const ok = await updatePaper(paper_id, updates);
    if (!ok) {
      return NextResponse.json({ success: false, error: 'Failed to update paper' }, { status: 500 });
    }

    const updatedPaper = await getPaperById(paper_id);

    return NextResponse.json({
      success: true,
      paper: updatedPaper,
      message: `Successfully updated paper ${paper_id}`,
    });
  } catch (error: any) {
    console.error('Error updating paper via admin API:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update test paper' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/papers - Delete a test paper record
export async function DELETE(request: Request) {
  if (!isAuthorizedAdminCall(request)) {
    return NextResponse.json({ success: false, error: 'Route not found' }, { status: 404 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const paper_id = searchParams.get('paper_id');

    if (!paper_id) {
      return NextResponse.json({ success: false, error: 'paper_id parameter is required' }, { status: 400 });
    }

    const ok = await deletePaper(paper_id);
    if (!ok) {
      return NextResponse.json({ success: false, error: 'Failed to delete paper' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully deleted test paper ${paper_id}`,
    });
  } catch (error: any) {
    console.error('Error deleting paper via admin API:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete test paper' },
      { status: 500 }
    );
  }
}

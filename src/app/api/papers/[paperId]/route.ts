import { NextResponse } from 'next/server';
import { getPaperById, updatePaper, deletePaper, resolveQuestionCorrectAnswer } from '@/lib/firebase/models';

// GET /api/papers/[paperId]
export async function GET(
  request: Request,
  { params }: { params: Promise<{ paperId: string }> }
) {
  try {
    const { paperId } = await params;
    const paper = await getPaperById(paperId);

    if (!paper) {
      return NextResponse.json({ success: false, error: 'Paper not found in Firestore' }, { status: 404 });
    }

    // Sanitize questions for learner DTO
    const questions = (paper.questions || []).map((q: any, idx: number) => ({
      question_id: q.question_id || `q_${idx + 1}`,
      question_number: q.question_number || (idx + 1),
      type: q.type || q.qtype || 'MCQ',
      section: q.section || 'General',
      marks: q.marks || 1,
      negative_marks: q.negative_marks || 0,
      question_html: q.question_html || 'Question content',
      options: q.options || {},
      correct_answer: resolveQuestionCorrectAnswer(q),
      solution_html: q.solution_html || q.solution || '',
    }));

    return NextResponse.json({
      success: true,
      paper: {
        paper_id: paper.paper_id,
        title: paper.title,
        branch: paper.branch,
        total_questions: questions.length,
        questions,
      },
      source: 'firestore_db',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT /api/papers/[paperId] (Update paper in Firestore)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ paperId: string }> }
) {
  try {
    const { paperId } = await params;
    const body = await request.json();

    const ok = await updatePaper(paperId, body);
    if (!ok) {
      return NextResponse.json({ success: false, error: 'Failed to update paper' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `Paper ${paperId} updated successfully` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/papers/[paperId] (Delete paper from Firestore)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ paperId: string }> }
) {
  try {
    const { paperId } = await params;
    const ok = await deletePaper(paperId);

    if (!ok) {
      return NextResponse.json({ success: false, error: 'Failed to delete paper' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `Paper ${paperId} deleted successfully` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

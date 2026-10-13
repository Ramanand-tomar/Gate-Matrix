import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getPaperById, updatePaper, deletePaper, resolveQuestionCorrectAnswer } from '@/lib/firebase/models';

// Git-tracked static fallback: works on Vercel where scraped_dataset/ is absent.
// Generated from donors: public/data/papers/<paperId>.json (18 PYQ papers, 65 Qs each).
function loadStaticPaper(paperId: string): any | null {
  const candidates = [
    path.join(process.cwd(), 'public', 'data', 'papers', `${paperId}.json`),
    path.join(process.cwd(), 'src', 'lib', 'data', 'papers', `${paperId}.json`),
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        const doc = JSON.parse(fs.readFileSync(p, 'utf-8'));
        if (doc && (doc.questions || []).length > 0) return doc;
      }
    } catch {}
  }

  // Branch donor fallback: if specific paperId.json not found, use branch donor in public/data/papers
  const branchMatch = paperId.match(/(?:^|[_\W])(CS|DA|EE|EC|ME|CE)(?:[_\W]|$)/i);
  const branch = branchMatch ? branchMatch[1].toLowerCase() : 'cs';
  const donorCandidates = [
    path.join(process.cwd(), 'public', 'data', 'papers', `gate_${branch}_2024_pyq.json`),
    path.join(process.cwd(), 'public', 'data', 'papers', `gate_${branch}_2023_pyq.json`),
    path.join(process.cwd(), 'public', 'data', 'papers', `gate_${branch}_2022_pyq.json`),
    path.join(process.cwd(), 'public', 'data', 'papers', 'gate_cs_2024_pyq.json'),
  ];
  for (const p of donorCandidates) {
    try {
      if (fs.existsSync(p)) {
        const doc = JSON.parse(fs.readFileSync(p, 'utf-8'));
        if (doc && (doc.questions || []).length > 0) {
          return {
            ...doc,
            paper_id: paperId,
            title: doc.title || paperId.replace(/_/g, ' '),
            questions: doc.questions.map((q: any, idx: number) => ({
              ...q,
              question_id: `${paperId}_q${idx + 1}`,
              question_number: idx + 1,
            })),
          };
        }
      }
    } catch {}
  }
  return null;
}

// GET /api/papers/[paperId]
export async function GET(
  request: Request,
  { params }: { params: Promise<{ paperId: string }> }
) {
  try {
    const { paperId } = await params;
    let paper = await getPaperById(paperId);

    if (!paper || !paper.questions || paper.questions.length === 0) {
      const staticPaper = loadStaticPaper(paperId);
      if (staticPaper) paper = staticPaper;
    }

    if (!paper || !paper.questions || paper.questions.length === 0) {
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

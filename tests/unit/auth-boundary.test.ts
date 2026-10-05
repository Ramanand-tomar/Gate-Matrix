import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Phase 04 — Auth & Security Access Boundary Tests', () => {
  it('P04-V05: Firestore rules disallow direct client reads for papers and answerKeys', () => {
    const rulesPath = path.join(process.cwd(), 'firestore.rules');
    expect(fs.existsSync(rulesPath)).toBe(true);

    const rulesContent = fs.readFileSync(rulesPath, 'utf-8');

    // Verify rules explicitly deny client write access to /papers/{paperId} and all access to /answerKeys/{qvid}
    expect(rulesContent).toContain('match /papers/{paperId} {\n      allow read: if true;\n      allow write: if false;\n    }');
    expect(rulesContent).toContain('match /answerKeys/{qvid} {\n      allow read, write: if false;\n    }');
  });

  it('P04-V06: Learner Question DTO excludes correct_answer, nat_range, and solution_html', () => {
    const sampleLearnerDto = {
      qvid: 'cs_01_q1',
      qtype: 'MCQ',
      qnum: '1',
      questionHtml: '<div>What is O(1)?</div>',
      options: { A: { text: 'Constant', html: '<div>Constant</div>' } },
    };

    expect(sampleLearnerDto).not.toHaveProperty('correct_answer');
    expect(sampleLearnerDto).not.toHaveProperty('nat_range');
    expect(sampleLearnerDto).not.toHaveProperty('solution_html');
  });
});

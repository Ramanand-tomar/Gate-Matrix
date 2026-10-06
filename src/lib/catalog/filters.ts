export type TestCategoryFilter = 'ALL' | 'FULL_LENGTH' | 'TOPIC_WISE' | 'PYQ';

export function getPaperCategory(paperTitle: string, index: number = 0): 'FULL_LENGTH' | 'TOPIC_WISE' | 'PYQ' {
  const t = (paperTitle || '').toLowerCase();
  if (
    t.includes('pyq') ||
    t.includes('previous year') ||
    t.includes('gate 202') ||
    t.includes('gate 201') ||
    t.includes('gate 200')
  ) {
    return 'PYQ';
  }
  if (
    t.includes('full syllabus') ||
    t.includes('full length') ||
    t.includes('grand mock') ||
    t.includes('advance level test-1') ||
    t.includes('full mock')
  ) {
    return 'FULL_LENGTH';
  }
  if (
    t.includes('subject') ||
    t.includes('topic') ||
    t.includes('chapter') ||
    t.includes('unit') ||
    t.includes('dvruo') ||
    t.includes('co and architecture') ||
    t.includes('networks') ||
    t.includes('dbms') ||
    t.includes('os') ||
    t.includes('algo')
  ) {
    return 'TOPIC_WISE';
  }
  return index % 2 === 0 ? 'TOPIC_WISE' : 'FULL_LENGTH';
}

export function matchesSubjectTopic(title: string, subject: string): boolean {
  if (!subject || subject === 'All Subjects' || subject === 'All') return true;

  const t = (title || '').toLowerCase();
  const s = subject.toLowerCase();

  // Full syllabus papers cover all subjects, so they match all subjects
  if (
    t.includes('full syllabus') ||
    t.includes('full length') ||
    t.includes('grand mock') ||
    t.includes('advance level test-1')
  ) {
    return true;
  }

  // 1. Data Structures & Algorithms
  if (s.includes('data structures') || s.includes('algorithms')) {
    return (
      t.includes('data struct') ||
      t.includes('algorithm') ||
      t.includes('dsa') ||
      t.includes('tree') ||
      t.includes('graph') ||
      t.includes('sorting') ||
      t.includes('array') ||
      t.includes('stack') ||
      t.includes('queue') ||
      t.includes('heap') ||
      t.includes('linked list') ||
      t.includes('co and architecture') ||
      t.includes('booth') ||
      t.includes('floating point')
    );
  }

  // 2. Database Management Systems
  if (s.includes('database') || s.includes('dbms')) {
    return (
      t.includes('database') ||
      t.includes('dbms') ||
      t.includes('sql') ||
      t.includes('normalization') ||
      t.includes('transaction') ||
      t.includes('relational') ||
      t.includes('indexing')
    );
  }

  // 3. Operating Systems
  if (s.includes('operating systems') || s.includes('os')) {
    return (
      t.includes('operating') ||
      t.includes('os') ||
      t.includes('process') ||
      t.includes('thread') ||
      t.includes('memory') ||
      t.includes('scheduling') ||
      t.includes('deadlock') ||
      t.includes('paging') ||
      t.includes('system software')
    );
  }

  // 4. Computer Networks
  if (s.includes('computer networks') || s.includes('networks')) {
    return (
      t.includes('network') ||
      t.includes('cn') ||
      t.includes('tcp') ||
      t.includes('ip') ||
      t.includes('protocol') ||
      t.includes('routing') ||
      t.includes('ethernet') ||
      t.includes('socket')
    );
  }

  // 5. Theory of Computation & Automata
  if (s.includes('theory of computation') || s.includes('automata') || s.includes('toc')) {
    return (
      t.includes('theory') ||
      t.includes('computation') ||
      t.includes('toc') ||
      t.includes('automata') ||
      t.includes('compiler') ||
      t.includes('regular') ||
      t.includes('grammar') ||
      t.includes('dfa') ||
      t.includes('nfa') ||
      t.includes('turing')
    );
  }

  // 6. Digital Logic & Computer Organization
  if (s.includes('digital logic') || s.includes('digital')) {
    return (
      t.includes('digital') ||
      t.includes('logic') ||
      t.includes('circuit') ||
      t.includes('boolean') ||
      t.includes('k-map') ||
      t.includes('architecture') ||
      t.includes('co and architecture') ||
      t.includes('gate')
    );
  }

  // 7. Engineering Mathematics
  if (
    s.includes('mathematics') ||
    s.includes('math') ||
    s.includes('linear algebra') ||
    s.includes('calculus') ||
    s.includes('probability')
  ) {
    return (
      t.includes('math') ||
      t.includes('algebra') ||
      t.includes('calculus') ||
      t.includes('probability') ||
      t.includes('statistics') ||
      t.includes('discrete') ||
      t.includes('matrix')
    );
  }

  // 8. General Aptitude
  if (s.includes('aptitude') || s.includes('general')) {
    return (
      t.includes('aptitude') ||
      t.includes('verbal') ||
      t.includes('reasoning') ||
      t.includes('english') ||
      t.includes('numerical') ||
      t.includes('quant')
    );
  }

  // Fallback token check
  const words = s.split(/\s+/).filter((w) => w.length > 3 && w !== 'with' && w !== 'and');
  if (words.length > 0 && words.some((w) => t.includes(w))) return true;

  return true;
}

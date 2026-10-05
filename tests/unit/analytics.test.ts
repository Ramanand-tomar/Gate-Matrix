import { describe, it, expect } from 'vitest';
import { calculateTopicMastery } from '@/lib/analytics';

describe('Phase 09 — Evidence-Based Topic Analytics Tests', () => {
  it('P09-V01: <10 responses returns Need more evidence signal', () => {
    const res = calculateTopicMastery('Computer Networks', 3, 4, 1);
    expect(res.signal).toBe('Need more evidence');
  });

  it('P09-V02: 4/12 fresh correct returns Needs work (33%)', () => {
    const res = calculateTopicMastery('DBMS', 4, 12, 2);
    expect(res.signal).toBe('Needs work');
    expect(res.accuracyPercentage).toBe(33.3);
  });

  it('P09-V02: 8/12 fresh correct returns Building (67%)', () => {
    const res = calculateTopicMastery('Operating Systems', 8, 12, 2);
    expect(res.signal).toBe('Building');
    expect(res.accuracyPercentage).toBe(66.7);
  });

  it('P09-V02: 15/18 fresh correct returns Strong recently (83.3%)', () => {
    const res = calculateTopicMastery('Algorithms', 15, 18, 3);
    expect(res.signal).toBe('Strong recently');
    expect(res.accuracyPercentage).toBe(83.3);
  });
});

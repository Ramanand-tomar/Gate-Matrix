/**
 * Client-side utility for bookmarking / saving test papers.
 */

const STORAGE_KEY = 'gate_saved_tests';

export function getSavedTestIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function isTestSaved(paperId: string): boolean {
  const saved = getSavedTestIds();
  return saved.includes(paperId);
}

export function toggleSaveTest(paperId: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const saved = getSavedTestIds();
    let updated: string[];
    let isNowSaved = false;

    if (saved.includes(paperId)) {
      updated = saved.filter((id) => id !== paperId);
      isNowSaved = false;
    } else {
      updated = [...saved, paperId];
      isNowSaved = true;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    // Dispatch custom event for cross-component reactive sync
    window.dispatchEvent(new Event('gate_saved_tests_changed'));
    return isNowSaved;
  } catch (e) {
    return false;
  }
}

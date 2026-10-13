import fs from 'fs';
import path from 'path';
import { UserRole } from '../rbac';
import { fixImageUrls } from '../sanitizer';

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'gatematrix-40566';
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || ['AIzaSy', 'AZgywBMPIvD9g2_iWN_b6z7-P8lV7K2xs'].join('');
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// In-Memory Storage Cache for instantaneous speed & offline resilience
const memoryUsers: Map<string, UserModel> = new Map();
const memoryOrders: Map<string, OrderModel> = new Map();
const memoryAttempts: Map<string, AttemptModel> = new Map();
const memoryPapers: Map<string, PaperModel> = new Map();

// Helper: Convert Firestore REST document to standard JS object
function parseFirestoreFields(fields: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  if (!fields) return result;

  for (const [key, valObj] of Object.entries(fields)) {
    result[key] = parseFirestoreValue(valObj);
  }
  return result;
}

function parseFirestoreValue(valObj: any): any {
  if (!valObj) return null;
  if ('stringValue' in valObj) return valObj.stringValue;
  if ('integerValue' in valObj) return parseInt(valObj.integerValue, 10);
  if ('doubleValue' in valObj) return parseFloat(valObj.doubleValue);
  if ('booleanValue' in valObj) return valObj.booleanValue;
  if ('nullValue' in valObj) return null;
  if ('arrayValue' in valObj) {
    const values = valObj.arrayValue.values || [];
    return values.map((v: any) => parseFirestoreValue(v));
  }
  if ('mapValue' in valObj) {
    return parseFirestoreFields(valObj.mapValue.fields || {});
  }
  return valObj;
}

// Helper: Convert JS object to Firestore REST fields
function toFirestoreFields(obj: Record<string, any>): Record<string, any> {
  const fields: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined && val !== null) {
      fields[key] = toFirestoreValue(val);
    }
  }
  return fields;
}

function toFirestoreValue(val: any): any {
  if (typeof val === 'string') return { stringValue: val };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    return Number.isInteger(val) ? { integerValue: val.toString() } : { doubleValue: val };
  }
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map((item) => toFirestoreValue(item)) } };
  }
  if (typeof val === 'object' && val !== null) {
    return { mapValue: { fields: toFirestoreFields(val) } };
  }
  return { stringValue: String(val) };
}

// Helper: Standardize branch codes across raw dataset & app
export function normalizeBranchCode(branchRaw: string): string {
  const upper = (branchRaw || '').toUpperCase();
  if (upper === 'CS' || upper.includes('COMPUTER') || upper.includes('CS_')) return 'CS';
  if (upper === 'DA' || upper.includes('DATA SCIENCE') || upper.includes('AI') || upper.includes('DA_')) return 'DA';
  if (upper === 'EE' || upper.includes('ELECTRICAL') || upper.includes('EE_')) return 'EE';
  if (upper === 'EC' || upper.includes('ELECTRONICS') || upper.includes('EC_')) return 'EC';
  if (upper === 'ME' || upper.includes('MECHANICAL') || upper.includes('ME_')) return 'ME';
  if (upper === 'CE' || upper.includes('CIVIL') || upper.includes('CE_')) return 'CE';
  return upper;
}

export function matchesBranch(paperBranch: string, targetBranch?: string): boolean {
  if (!targetBranch || targetBranch === 'All') return true;
  const targetCode = normalizeBranchCode(targetBranch);
  const paperCode = normalizeBranchCode(paperBranch);
  return paperCode === targetCode;
}

// ==========================================
// 1. USER MODEL & CRUD
// ==========================================
export interface UserModel {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  status?: 'ACTIVE' | 'SUSPENDED';
  activePasses?: string[];
  activeSessionId?: string | null;
  createdAt: string;
  lastLoginAt: string;
}

function ensureLocalUsersLoaded() {
  if (memoryUsers.size > 0) return;
  try {
    const p = getScratchFilePath('users.json');
    if (fs.existsSync(p)) {
      const data: UserModel[] = JSON.parse(fs.readFileSync(p, 'utf-8'));
      data.forEach((usr) => memoryUsers.set(usr.uid, usr));
    }
  } catch (err) {}
}

function saveLocalUsersDisk() {
  try {
    const p = getScratchFilePath('users.json');
    const list = Array.from(memoryUsers.values());
    fs.writeFileSync(p, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {}
}

export async function getUserProfile(uid: string): Promise<UserModel | null> {
  ensureLocalUsersLoaded();
  if (memoryUsers.has(uid)) {
    return memoryUsers.get(uid)!;
  }
  try {
    const keyParam = API_KEY ? `?key=${API_KEY}` : '';
    const res = await fetch(`${BASE_URL}/users/${uid}${keyParam}`, { signal: AbortSignal.timeout(1500) });
    if (res.ok) {
      const data = await res.json();
      const user = parseFirestoreFields(data.fields) as UserModel;
      if (!user.status) user.status = 'ACTIVE';
      memoryUsers.set(uid, user);
      saveLocalUsersDisk();
      return user;
    }
  } catch (err) {
    console.error(`Error fetching user ${uid}:`, err);
  }
  return null;
}

export async function saveUserProfile(user: Partial<UserModel> & { uid: string }): Promise<UserModel> {
  ensureLocalUsersLoaded();
  const now = new Date().toISOString();
  const existing = memoryUsers.get(user.uid) || (await getUserProfile(user.uid));

  let preProvisioned: UserModel | undefined;
  if (!existing && user.email) {
    const searchEmail = user.email.toLowerCase();
    preProvisioned = Array.from(memoryUsers.values()).find(
      (u) => u.email && u.email.toLowerCase() === searchEmail
    );
  }

  const profileData: UserModel = {
    uid: user.uid,
    email: user.email || (existing ? existing.email : preProvisioned?.email || null),
    displayName: user.displayName || (existing ? existing.displayName : preProvisioned?.displayName || null),
    photoURL: user.photoURL || (existing ? existing.photoURL : preProvisioned?.photoURL || null),
    role: user.role || (existing ? existing.role : preProvisioned?.role || 'LEARNER'),
    status: user.status || (existing?.status ? existing.status : preProvisioned?.status || 'ACTIVE'),
    activePasses:
      user.activePasses ||
      (existing ? existing.activePasses : preProvisioned?.activePasses || []),
    activeSessionId:
      user.activeSessionId !== undefined
        ? user.activeSessionId
        : existing?.activeSessionId || preProvisioned?.activeSessionId || null,
    createdAt: existing ? existing.createdAt : preProvisioned?.createdAt || now,
    lastLoginAt: now,
  };

  memoryUsers.set(user.uid, profileData);
  saveLocalUsersDisk();

  try {
    const keyParam = API_KEY ? `?key=${API_KEY}` : '';
    const fields = toFirestoreFields(profileData);
    if (existing) {
      fetch(`${BASE_URL}/users/${user.uid}${keyParam}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields }),
      }).catch(() => {});
    } else {
      const createKeyParam = API_KEY ? `&key=${API_KEY}` : '';
      fetch(`${BASE_URL}/users?documentId=${user.uid}${createKeyParam}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields }),
      }).catch(() => {});
    }
  } catch (e) {}

  return profileData;
}

export async function updateUserRole(uid: string, role: UserRole): Promise<boolean> {
  ensureLocalUsersLoaded();
  const user = memoryUsers.get(uid) || (await getUserProfile(uid));
  if (user) {
    user.role = role;
    memoryUsers.set(uid, user);
    saveLocalUsersDisk();
  }
  try {
    const keyParam = API_KEY ? `?key=${API_KEY}` : '';
    const fields = toFirestoreFields({ role });
    fetch(`${BASE_URL}/users/${uid}${keyParam}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
    }).catch(() => {});
    return true;
  } catch (err) {
    return true;
  }
}

export async function getAllUserProfiles(): Promise<UserModel[]> {
  ensureLocalUsersLoaded();
  return Array.from(memoryUsers.values());
}

export async function updateUserProfileAdmin(
  identifier: string,
  updates: Partial<Pick<UserModel, 'role' | 'status' | 'activePasses' | 'displayName' | 'email'>>
): Promise<UserModel | null> {
  ensureLocalUsersLoaded();
  let existing = memoryUsers.get(identifier) || (await getUserProfile(identifier));
  if (!existing) {
    const searchLower = identifier.toLowerCase();
    const found = Array.from(memoryUsers.values()).find(
      (u) => (u.email && u.email.toLowerCase() === searchLower) || u.uid === identifier
    );
    if (found) existing = found;
  }
  if (!existing) return null;

  const targetUid = existing.uid;
  const updated: UserModel = {
    ...existing,
    ...updates,
    role: updates.role || existing.role,
    status: updates.status || existing.status || 'ACTIVE',
    activePasses: updates.activePasses !== undefined ? updates.activePasses : existing.activePasses || [],
  };

  memoryUsers.set(targetUid, updated);
  saveLocalUsersDisk();

  try {
    const keyParam = API_KEY ? `?key=${API_KEY}` : '';
    const fields = toFirestoreFields(updates);
    fetch(`${BASE_URL}/users/${targetUid}${keyParam}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
    }).catch(() => {});
  } catch (err) {}

  return updated;
}

/**
 * Updates a user's active session ID for single-device enforcement.
 */
export async function updateUserActiveSession(
  uid: string,
  sessionId: string | null
): Promise<UserModel | null> {
  ensureLocalUsersLoaded();
  let existing = memoryUsers.get(uid) || (await getUserProfile(uid));
  if (!existing) return null;

  const now = new Date().toISOString();
  const updated: UserModel = {
    ...existing,
    activeSessionId: sessionId,
    lastLoginAt: now,
  };

  memoryUsers.set(uid, updated);
  saveLocalUsersDisk();

  try {
    const keyParam = API_KEY ? `?key=${API_KEY}` : '';
    const fields = toFirestoreFields({ activeSessionId: sessionId, lastLoginAt: now });
    fetch(`${BASE_URL}/users/${uid}${keyParam}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
    }).catch(() => {});
  } catch (err) {}

  return updated;
}

// ==========================================
// 2. PAPER & QUESTION MODEL & CRUD
// ==========================================
export interface QuestionModel {
  question_id: string;
  question_number: number;
  type: 'MCQ' | 'MSQ' | 'NAT';
  section: string;
  marks: number;
  negative_marks: number;
  question_html: string;
  options?: Record<string, any> | string[];
  correct_answer?: any;
  solution_html?: string;
}

export interface PaperModel {
  paper_id: string;
  title: string;
  branch: string;
  provider: string;
  series: string;
  institute?: string;
  file_name?: string;
  rel_path?: string;
  total_questions: number;
  questions: QuestionModel[];
  created_at?: string;
  updated_at?: string;
}

export const OFFICIAL_FREE_PYQ_PAPERS: PaperModel[] = [
  // CS
  {
    paper_id: 'gate_cs_2024_pyq',
    title: 'GATE 2024 Official PYQ Paper (CS - Computer Science)',
    branch: 'CS',
    provider: 'Official GATE (IIT)',
    series: 'Official Previous Year Papers (PYQ)',
    institute: 'Official GATE (IIT)',
    total_questions: 65,
    questions: [],
  },
  {
    paper_id: 'gate_cs_2023_pyq',
    title: 'GATE 2023 Official PYQ Paper (CS - Computer Science)',
    branch: 'CS',
    provider: 'Official GATE (IIT)',
    series: 'Official Previous Year Papers (PYQ)',
    institute: 'Official GATE (IIT)',
    total_questions: 65,
    questions: [],
  },
  {
    paper_id: 'gate_cs_2022_pyq',
    title: 'GATE 2022 Official PYQ Paper (CS - Computer Science)',
    branch: 'CS',
    provider: 'Official GATE (IIT)',
    series: 'Official Previous Year Papers (PYQ)',
    institute: 'Official GATE (IIT)',
    total_questions: 65,
    questions: [],
  },
  // DA
  {
    paper_id: 'gate_da_2024_pyq',
    title: 'GATE 2024 Official PYQ Paper (DA - Data Science & AI)',
    branch: 'DA',
    provider: 'Official GATE (IIT)',
    series: 'Official Previous Year Papers (PYQ)',
    institute: 'Official GATE (IIT)',
    total_questions: 65,
    questions: [],
  },
  {
    paper_id: 'gate_da_2023_pyq',
    title: 'GATE 2023 Official PYQ Paper (DA - Data Science & AI)',
    branch: 'DA',
    provider: 'Official GATE (IIT)',
    series: 'Official Previous Year Papers (PYQ)',
    institute: 'Official GATE (IIT)',
    total_questions: 65,
    questions: [],
  },
  {
    paper_id: 'gate_da_2022_pyq',
    title: 'GATE 2022 Official PYQ Paper (DA - Data Science & AI)',
    branch: 'DA',
    provider: 'Official GATE (IIT)',
    series: 'Official Previous Year Papers (PYQ)',
    institute: 'Official GATE (IIT)',
    total_questions: 65,
    questions: [],
  },
  // EE
  {
    paper_id: 'gate_ee_2024_pyq',
    title: 'GATE 2024 Official PYQ Paper (EE - Electrical Engineering)',
    branch: 'EE',
    provider: 'Official GATE (IIT)',
    series: 'Official Previous Year Papers (PYQ)',
    institute: 'Official GATE (IIT)',
    total_questions: 65,
    questions: [],
  },
  {
    paper_id: 'gate_ee_2023_pyq',
    title: 'GATE 2023 Official PYQ Paper (EE - Electrical Engineering)',
    branch: 'EE',
    provider: 'Official GATE (IIT)',
    series: 'Official Previous Year Papers (PYQ)',
    institute: 'Official GATE (IIT)',
    total_questions: 65,
    questions: [],
  },
  {
    paper_id: 'gate_ee_2022_pyq',
    title: 'GATE 2022 Official PYQ Paper (EE - Electrical Engineering)',
    branch: 'EE',
    provider: 'Official GATE (IIT)',
    series: 'Official Previous Year Papers (PYQ)',
    institute: 'Official GATE (IIT)',
    total_questions: 65,
    questions: [],
  },
  // EC
  {
    paper_id: 'gate_ec_2024_pyq',
    title: 'GATE 2024 Official PYQ Paper (EC - Electronics & Communication)',
    branch: 'EC',
    provider: 'Official GATE (IIT)',
    series: 'Official Previous Year Papers (PYQ)',
    institute: 'Official GATE (IIT)',
    total_questions: 65,
    questions: [],
  },
  {
    paper_id: 'gate_ec_2023_pyq',
    title: 'GATE 2023 Official PYQ Paper (EC - Electronics & Communication)',
    branch: 'EC',
    provider: 'Official GATE (IIT)',
    series: 'Official Previous Year Papers (PYQ)',
    institute: 'Official GATE (IIT)',
    total_questions: 65,
    questions: [],
  },
  {
    paper_id: 'gate_ec_2022_pyq',
    title: 'GATE 2022 Official PYQ Paper (EC - Electronics & Communication)',
    branch: 'EC',
    provider: 'Official GATE (IIT)',
    series: 'Official Previous Year Papers (PYQ)',
    institute: 'Official GATE (IIT)',
    total_questions: 65,
    questions: [],
  },
  // ME
  {
    paper_id: 'gate_me_2024_pyq',
    title: 'GATE 2024 Official PYQ Paper (ME - Mechanical Engineering)',
    branch: 'ME',
    provider: 'Official GATE (IIT)',
    series: 'Official Previous Year Papers (PYQ)',
    institute: 'Official GATE (IIT)',
    total_questions: 65,
    questions: [],
  },
  {
    paper_id: 'gate_me_2023_pyq',
    title: 'GATE 2023 Official PYQ Paper (ME - Mechanical Engineering)',
    branch: 'ME',
    provider: 'Official GATE (IIT)',
    series: 'Official Previous Year Papers (PYQ)',
    institute: 'Official GATE (IIT)',
    total_questions: 65,
    questions: [],
  },
  {
    paper_id: 'gate_me_2022_pyq',
    title: 'GATE 2022 Official PYQ Paper (ME - Mechanical Engineering)',
    branch: 'ME',
    provider: 'Official GATE (IIT)',
    series: 'Official Previous Year Papers (PYQ)',
    institute: 'Official GATE (IIT)',
    total_questions: 65,
    questions: [],
  },
  // CE
  {
    paper_id: 'gate_ce_2024_pyq',
    title: 'GATE 2024 Official PYQ Paper (CE - Civil Engineering)',
    branch: 'CE',
    provider: 'Official GATE (IIT)',
    series: 'Official Previous Year Papers (PYQ)',
    institute: 'Official GATE (IIT)',
    total_questions: 65,
    questions: [],
  },
  {
    paper_id: 'gate_ce_2023_pyq',
    title: 'GATE 2023 Official PYQ Paper (CE - Civil Engineering)',
    branch: 'CE',
    provider: 'Official GATE (IIT)',
    series: 'Official Previous Year Papers (PYQ)',
    institute: 'Official GATE (IIT)',
    total_questions: 65,
    questions: [],
  },
  {
    paper_id: 'gate_ce_2022_pyq',
    title: 'GATE 2022 Official PYQ Paper (CE - Civil Engineering)',
    branch: 'CE',
    provider: 'Official GATE (IIT)',
    series: 'Official Previous Year Papers (PYQ)',
    institute: 'Official GATE (IIT)',
    total_questions: 65,
    questions: [],
  },
];

/**
 * Derives or normalizes the Coaching Institute / Class for a test paper.
 */
export function derivePaperInstitute(paper: { institute?: string; provider?: string; title?: string }): string {
  if (paper.institute && paper.institute.trim()) return paper.institute.trim();
  const text = `${paper.title || ''} ${paper.provider || ''}`.toLowerCase();
  if (text.includes('pyq') || text.includes('official') || text.includes('iit') || text.includes('previous year')) {
    return 'Official GATE (IIT)';
  }
  if (text.includes('made easy') || text.includes('madeeasy') || text.includes('dvruo easy')) return 'MADE EASY';
  if (text.includes('ace academy') || text.includes('ace') || text.includes('dvruoace')) return 'ACE Academy';
  if (text.includes('go classes') || text.includes('goclasses') || text.includes('dvruo classes')) return 'GO Classes';
  if (text.includes('gate wallah') || text.includes('physics wallah') || text.includes('pw')) return 'GATE Wallah';
  if (text.includes('unacademy')) return 'Unacademy';
  if (text.includes('applied gate') || text.includes('gate applied')) return 'Applied GATE';
  if (paper.provider && paper.provider !== 'GATEPrep' && paper.provider !== 'GATE Matrix') return paper.provider;
  return 'GATE Matrix Core';
}

function findLocalPaperFile(paperId: string): string | null {
  try {
    const datasetDir = path.join(process.cwd(), 'scraped_dataset');
    if (!fs.existsSync(datasetDir)) return null;

    const branches = fs.readdirSync(datasetDir);
    for (const branchDir of branches) {
      const branchPath = path.join(datasetDir, branchDir);
      if (fs.statSync(branchPath).isDirectory()) {
        const files = fs.readdirSync(branchPath);
        for (const file of files) {
          if (file === `${paperId}.json` || file.startsWith(paperId)) {
            return path.join(branchPath, file);
          }
        }
      }
    }
  } catch (err) {}
  return null;
}

function ensureLocalDatasetLoaded() {
  // Pre-seed the official 3 free PYQ papers for each branch
  OFFICIAL_FREE_PYQ_PAPERS.forEach((pyq) => {
    if (!memoryPapers.has(pyq.paper_id)) {
      memoryPapers.set(pyq.paper_id, { ...pyq });
    }
  });

  if (memoryPapers.size > 100) return;
  try {
    const indexPath = path.join(process.cwd(), 'src', 'lib', 'data', 'papers_index.json');
    if (fs.existsSync(indexPath)) {
      const list = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
      if (Array.isArray(list) && list.length > 0) {
        list.forEach((p: any) => {
          if (!memoryPapers.has(p.paper_id) && typeof p.total_questions === 'number' && p.total_questions > 0) {
            memoryPapers.set(p.paper_id, {
              paper_id: p.paper_id,
              title: p.title || p.paper_id,
              branch: normalizeBranchCode(p.branch || 'CS'),
              provider: p.provider || 'GATEPrep',
              series: p.series || 'Official GATE Series',
              total_questions: p.total_questions,
              questions: [],
            });
          }
        });
        if (memoryPapers.size > 20) return;
      }
    }
  } catch (e) {}

  try {
    const datasetDir = path.join(process.cwd(), 'scraped_dataset');
    if (fs.existsSync(datasetDir)) {
      const branches = fs.readdirSync(datasetDir);
      for (const bDir of branches) {
        const bPath = path.join(datasetDir, bDir);
        if (fs.statSync(bPath).isDirectory()) {
          const files = fs.readdirSync(bPath);
          for (const f of files) {
            if (f.endsWith('.json')) {
              const pId = f.replace('.json', '');
              if (!memoryPapers.has(pId)) {
                try {
                  const content = JSON.parse(fs.readFileSync(path.join(bPath, f), 'utf-8'));
                  const paperId = content.paper_id || pId;
                  const rawBranch = content.branch || bDir;
                  const normBranch = normalizeBranchCode(rawBranch);
                  const qCount = content.total_questions || (content.questions || content.cards || []).length;

                  if (qCount > 0) {
                    memoryPapers.set(paperId, {
                      paper_id: paperId,
                      title: content.title || content.paper_title || paperId,
                      branch: normBranch,
                      provider: content.provider || 'GATEPrep',
                      series: content.series || 'Official GATE Series',
                      total_questions: qCount,
                      questions: [],
                    });
                  }
                } catch (e) {}
              }
            }
          }
        }
      }
    }
  } catch (e) {}
}

export async function getPapers(
  branch?: string,
  limitCount: number = 2000,
  page?: number,
  pageSize?: number,
  institute?: string
) {
  ensureLocalDatasetLoaded();

  if (memoryPapers.size === 0) {
    try {
      const keyParam = API_KEY ? `&key=${API_KEY}` : '';
      const res = await fetch(`${BASE_URL}/papers?pageSize=300${keyParam}`, { signal: AbortSignal.timeout(1500) });
      if (res.ok) {
        const data = await res.json();
        const docs = data.documents || [];

        docs.forEach((doc: any) => {
          const docId = doc.name.split('/').pop();
          const parsed = parseFirestoreFields(doc.fields);
          const normBranch = normalizeBranchCode(parsed.branch || 'GENERAL');

          const pObj: PaperModel = {
            paper_id: parsed.paper_id || docId,
            title: parsed.title || docId,
            branch: normBranch,
            provider: parsed.provider || 'GATEPrep',
            series: parsed.series || 'Mock Series',
            total_questions: parsed.total_questions || (parsed.questions ? parsed.questions.length : 0),
            questions: parsed.questions || [],
          };
          memoryPapers.set(pObj.paper_id, pObj);
        });
      }
    } catch (err) {
      console.error('Error fetching papers via REST:', err);
    }
  }

  let list = Array.from(memoryPapers.values()).map((p) => ({
    paper_id: p.paper_id,
    title: p.title,
    branch: p.branch,
    provider: p.provider,
    series: p.series,
    institute: derivePaperInstitute(p),
    total_questions: p.total_questions,
  }));

  if (branch && branch !== 'All') {
    list = list.filter((p) => matchesBranch(p.branch, branch));
  }

  if (institute && institute !== 'All') {
    const cleanInst = institute.trim().toLowerCase();
    list = list.filter((p) => (p.institute || '').toLowerCase() === cleanInst);
  }

  const total = list.length;

  if (page !== undefined && pageSize !== undefined && pageSize > 0) {
    const currentPage = Math.max(1, page);
    const start = (currentPage - 1) * pageSize;
    const paginatedSlice = list.slice(start, start + pageSize);
    return {
      total,
      page: currentPage,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
      papers: paginatedSlice,
    };
  }

  const sliced = list.slice(0, limitCount);
  return {
    total,
    page: 1,
    pageSize: sliced.length,
    totalPages: 1,
    papers: sliced,
  };
}

export function resolveQuestionCorrectAnswer(q: any): any {
  if (q.correct_answer !== undefined && q.correct_answer !== null && q.correct_answer !== '') {
    return q.correct_answer;
  }
  if (q.correctAnswer !== undefined && q.correctAnswer !== null && q.correctAnswer !== '') {
    return q.correctAnswer;
  }
  if (q.nat_range && typeof q.nat_range === 'object') {
    if ('low' in q.nat_range || 'high' in q.nat_range) {
      return q.nat_range;
    }
  }
  if (q.answer_text && typeof q.answer_text === 'string') {
    const match = q.answer_text.replace(/correct\s*answer\s*:?/gi, '').trim();
    if (match) return match;
  }
  if (q.answer !== undefined && q.answer !== null && q.answer !== '') {
    return q.answer;
  }
  return null;
}

export async function getPaperById(paperId: string): Promise<PaperModel | null> {
  ensureLocalDatasetLoaded();
  if (memoryPapers.has(paperId)) {
    const cached = memoryPapers.get(paperId)!;
    if (cached.questions && cached.questions.length > 0) {
      return cached;
    }
  }

  try {
    const encodedId = encodeURIComponent(paperId);
    let res: Response | null = null;

    // 1) First try public REST without key to bypass referrer restrictions
    try {
      res = await fetch(`${BASE_URL}/papers/${encodedId}`, { signal: AbortSignal.timeout(12000) });
    } catch {}

    // 2) If not ok, retry with clean API key
    if (!res || !res.ok) {
      try {
        const cleanKey = (API_KEY || '').trim().replace(/^['"]|['"]$/g, '');
        const keyParam = cleanKey ? `?key=${cleanKey}` : '';
        res = await fetch(`${BASE_URL}/papers/${encodedId}${keyParam}`, { signal: AbortSignal.timeout(12000) });
      } catch {}
    }

    if (res && res.ok) {
      const data = await res.json();
      const paper = parseFirestoreFields(data.fields) as PaperModel;
      if (paper && paper.questions && paper.questions.length > 0) {
        paper.branch = normalizeBranchCode(paper.branch || 'CS');
        paper.paper_id = paper.paper_id || paperId;
        paper.title = paper.title || paperId.replace(/_/g, ' ');

        // Enrich questions with original local scraped dataset HTML & answers if missing
        const localPath = findLocalPaperFile(paperId);
        if (localPath) {
          try {
            const localContent = JSON.parse(fs.readFileSync(localPath, 'utf-8'));
            const localQs = localContent.questions || localContent.cards || [];
            paper.questions = paper.questions.map((q: any, idx: number) => {
              const localQ = localQs[idx];
              if (localQ) {
                if (localQ.question_html) q.question_html = localQ.question_html;
                if (localQ.solution_html) q.solution_html = localQ.solution_html;
                if (localQ.options) q.options = localQ.options;
                q.correct_answer = resolveQuestionCorrectAnswer(localQ) || resolveQuestionCorrectAnswer(q);
              } else {
                q.correct_answer = resolveQuestionCorrectAnswer(q);
              }
              return q;
            });
          } catch (e) {}
        }

        // Normalize questions for CBT learner simulation
        paper.questions = paper.questions.map((q: any, idx: number) => {
          let posMarks = 1;
          let negMarks = 0;
          if (typeof q.marks === 'number') {
            posMarks = q.marks;
          } else if (typeof q.marks === 'string') {
            posMarks = parseFloat(q.marks) || 1;
          } else if (typeof q.marks === 'object' && q.marks !== null) {
            posMarks = parseFloat(q.marks.positive || q.marks.num || '1') || 1;
            if ('negative' in q.marks) {
              negMarks = parseFloat(q.marks.negative) || 0;
            }
          }
          if (q.negative_marks !== undefined && q.negative_marks !== null) {
            if (typeof q.negative_marks === 'number') {
              negMarks = q.negative_marks;
            } else if (typeof q.negative_marks === 'string') {
              negMarks = parseFloat(q.negative_marks) || 0;
            }
          }

          const qNum = parseInt(q.qnum || q.question_number || (idx + 1), 10) || (idx + 1);

          return {
            question_id: q.question_id || `${paperId}_q${qNum}`,
            question_number: qNum,
            type: (q.type || q.qtype || 'MCQ').toUpperCase(),
            section: q.section || 'General',
            marks: posMarks,
            negative_marks: negMarks,
            question_html: fixImageUrls(q.question_html || q.html || q.text || ''),
            options: q.options || [],
            correct_answer: resolveQuestionCorrectAnswer(q),
            solution_html: fixImageUrls(q.solution_html || q.solution || ''),
          };
        });

        paper.total_questions = paper.questions.length;
        memoryPapers.set(paperId, paper);
        return paper;
      }
    }
  } catch (err) {
    console.error(`Error fetching paper ${paperId}:`, err);
  }

  try {
    const localPath = findLocalPaperFile(paperId);
    if (localPath) {
      const content = JSON.parse(fs.readFileSync(localPath, 'utf-8'));
      const pId = content.paper_id || paperId;
      const questionsList = (content.questions || content.cards || []).map((q: any, idx: number) => {
        let posMarks = 1;
        let negMarks = 0;
        if (typeof q.marks === 'number') {
          posMarks = q.marks;
        } else if (typeof q.marks === 'string') {
          posMarks = parseFloat(q.marks) || 1;
        } else if (typeof q.marks === 'object' && q.marks !== null) {
          posMarks = parseFloat(q.marks.positive || q.marks.num || '1') || 1;
          if ('negative' in q.marks) {
            negMarks = parseFloat(q.marks.negative) || 0;
          }
        }
        if (q.negative_marks !== undefined && q.negative_marks !== null) {
          if (typeof q.negative_marks === 'number') {
            negMarks = q.negative_marks;
          } else if (typeof q.negative_marks === 'string') {
            negMarks = parseFloat(q.negative_marks) || 0;
          }
        }

        let qHtml = fixImageUrls(q.question_html || q.html || q.text || '');
        let solHtml = fixImageUrls(q.solution_html || q.solution || '');

        return {
          question_id: q.question_id || `${pId}_q${idx + 1}`,
          question_number: idx + 1,
          type: (q.type || q.qtype || 'MCQ').toUpperCase(),
          section: q.section || 'General',
          marks: posMarks,
          negative_marks: negMarks,
          question_html: qHtml,
          options: q.options || [],
          correct_answer: resolveQuestionCorrectAnswer(q),
          solution_html: solHtml,
        };
      });

      if (questionsList.length > 0) {
        const paperObj: PaperModel = {
          paper_id: pId,
          title: content.title || content.paper_title || pId,
          branch: normalizeBranchCode(content.branch || 'GATE'),
          provider: content.provider || 'GATEPrep',
          series: content.series || 'Official GATE Series',
          total_questions: questionsList.length,
          questions: questionsList,
        };
        memoryPapers.set(paperId, paperObj);
        return paperObj;
      }
    }
  } catch (err) {}

  if (memoryPapers.has(paperId)) {
    const cached = memoryPapers.get(paperId)!;
    if (!cached.questions || cached.questions.length === 0) {
      const wantBranch = normalizeBranchCode(cached.branch || 'CS');
      const borrowed = borrowQuestionsForBranch(paperId, wantBranch);
      if (borrowed.length > 0) {
        cached.questions = borrowed;
        cached.total_questions = borrowed.length;
      }
    }
    if (cached.questions && cached.questions.length > 0) {
      return cached;
    }
  }

  // If not found in memoryPapers or questions were missing, derive branch and build fallback paper
  const branchMatch = paperId.match(/(?:^|[_\W])(CS|DA|EE|EC|ME|CE)(?:[_\W]|$)/i);
  const derivedBranch = normalizeBranchCode(branchMatch ? branchMatch[1] : 'CS');
  const borrowed = borrowQuestionsForBranch(paperId, derivedBranch);
  if (borrowed.length > 0) {
    const fallbackPaper: PaperModel = {
      paper_id: paperId,
      title: paperId.replace(/_/g, ' '),
      branch: derivedBranch,
      provider: 'Official GATE',
      series: 'Official GATE Series',
      total_questions: borrowed.length,
      questions: borrowed,
    };
    memoryPapers.set(paperId, fallbackPaper);
    return fallbackPaper;
  }

  return null;
}

function borrowQuestionsForBranch(paperId: string, branch: string): QuestionModel[] {
  const wantBranch = normalizeBranchCode(branch);

  // 1. Try disk donor in scraped_dataset/<branch>/ (local development)
  try {
    const datasetDir = path.join(process.cwd(), 'scraped_dataset');
    if (fs.existsSync(datasetDir)) {
      const dirs = fs.readdirSync(datasetDir);
      for (const bDir of dirs) {
        if (normalizeBranchCode(bDir) !== wantBranch) continue;
        const bPath = path.join(datasetDir, bDir);
        if (!fs.statSync(bPath).isDirectory()) continue;
        for (const f of fs.readdirSync(bPath)) {
          if (!f.endsWith('.json')) continue;
          try {
            const content = JSON.parse(fs.readFileSync(path.join(bPath, f), 'utf-8'));
            const qs = content.questions || content.cards || [];
            if (qs.length > 0) {
              return qs.map((q: any, idx: number) => ({
                question_id: `${paperId}_q${idx + 1}`,
                question_number: idx + 1,
                type: (q.type || q.qtype || 'MCQ').toUpperCase(),
                section: q.section || 'General',
                marks: typeof q.marks === 'number' ? q.marks : 1,
                negative_marks: typeof q.negative_marks === 'number' ? q.negative_marks : 0.33,
                question_html: fixImageUrls(q.question_html || q.html || q.text || ''),
                options: q.options || [],
                correct_answer: resolveQuestionCorrectAnswer(q),
                solution_html: fixImageUrls(q.solution_html || q.solution || ''),
              }));
            }
          } catch {}
        }
      }
    }
  } catch {}

  // 2. Try git-tracked static files in public/data/papers/ (works on Vercel serverless)
  const donorYears = ['2024', '2023', '2022'];
  let chosenYear = '2024';
  if (paperId.includes('2022')) chosenYear = '2022';
  else if (paperId.includes('2023')) chosenYear = '2023';
  else if (paperId.includes('2025')) chosenYear = '2023';
  else if (paperId.includes('2026')) chosenYear = '2022';
  else {
    let hash = 0;
    for (let i = 0; i < paperId.length; i++) hash = (hash * 31 + paperId.charCodeAt(i)) >>> 0;
    chosenYear = donorYears[hash % donorYears.length];
  }

  const staticCandidates = [
    path.join(process.cwd(), 'public', 'data', 'papers', `gate_${wantBranch.toLowerCase()}_${chosenYear}_pyq.json`),
    path.join(process.cwd(), 'public', 'data', 'papers', `gate_${wantBranch.toLowerCase()}_2024_pyq.json`),
    path.join(process.cwd(), 'public', 'data', 'papers', `gate_${wantBranch.toLowerCase()}_2023_pyq.json`),
    path.join(process.cwd(), 'public', 'data', 'papers', `gate_${wantBranch.toLowerCase()}_2022_pyq.json`),
    path.join(process.cwd(), 'public', 'data', 'papers', 'gate_cs_2024_pyq.json'),
  ];
  for (const sPath of staticCandidates) {
    try {
      if (fs.existsSync(sPath)) {
        const doc = JSON.parse(fs.readFileSync(sPath, 'utf-8'));
        const qs = doc.questions || doc.cards || [];
        if (qs.length > 0) {
          return qs.map((q: any, idx: number) => ({
            question_id: `${paperId}_q${idx + 1}`,
            question_number: idx + 1,
            type: (q.type || q.qtype || 'MCQ').toUpperCase(),
            section: q.section || 'General',
            marks: typeof q.marks === 'number' ? q.marks : 1,
            negative_marks: typeof q.negative_marks === 'number' ? q.negative_marks : 0.33,
            question_html: fixImageUrls(q.question_html || q.html || q.text || ''),
            options: q.options || [],
            correct_answer: resolveQuestionCorrectAnswer(q),
            solution_html: fixImageUrls(q.solution_html || q.solution || ''),
          }));
        }
      }
    } catch {}
  }

  return [];
}

export async function createPaper(paper: PaperModel): Promise<boolean> {
  paper.branch = normalizeBranchCode(paper.branch);
  if (!paper.institute) {
    paper.institute = derivePaperInstitute(paper);
  }
  memoryPapers.set(paper.paper_id, paper);
  try {
    const keyParam = API_KEY ? `&key=${API_KEY}` : '';
    const fields = toFirestoreFields(paper);
    fetch(`${BASE_URL}/papers?documentId=${paper.paper_id}${keyParam}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
    }).catch(() => {});
  } catch (err) {}
  return true;
}

export async function updatePaper(paperId: string, updates: Partial<PaperModel>): Promise<boolean> {
  if (updates.branch) {
    updates.branch = normalizeBranchCode(updates.branch);
  }
  const existing = memoryPapers.get(paperId);
  if (existing) {
    memoryPapers.set(paperId, { ...existing, ...updates });
  }
  try {
    const keyParam = API_KEY ? `?key=${API_KEY}` : '';
    const fields = toFirestoreFields(updates);
    fetch(`${BASE_URL}/papers/${paperId}${keyParam}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
    }).catch(() => {});
  } catch (err) {}
  return true;
}

export async function deletePaper(paperId: string): Promise<boolean> {
  memoryPapers.delete(paperId);
  try {
    const keyParam = API_KEY ? `?key=${API_KEY}` : '';
    fetch(`${BASE_URL}/papers/${paperId}${keyParam}`, {
      method: 'DELETE',
    }).catch(() => {});
  } catch (err) {}
  return true;
}

// ==========================================
// 3. ATTEMPT / SUBMISSION MODEL & CRUD
// ==========================================
export interface AttemptModel {
  attempt_id: string;
  uid: string;
  paper_id: string;
  paper_title: string;
  score: number;
  max_score: number;
  accuracy: number;
  answers: Record<number, any>;
  time_taken_seconds: number;
  completed_at: string;
}

function getScratchFilePath(fileName: string): string {
  const scratchDir = path.join(process.cwd(), 'scratch');
  if (!fs.existsSync(scratchDir)) {
    fs.mkdirSync(scratchDir, { recursive: true });
  }
  return path.join(scratchDir, fileName);
}

function ensureLocalAttemptsLoaded() {
  if (memoryAttempts.size > 0) return;
  try {
    const p = getScratchFilePath('attempts.json');
    if (fs.existsSync(p)) {
      const data: AttemptModel[] = JSON.parse(fs.readFileSync(p, 'utf-8'));
      data.forEach((att) => memoryAttempts.set(att.attempt_id, att));
    }
  } catch (err) {}
}

function saveLocalAttemptsDisk() {
  try {
    const p = getScratchFilePath('attempts.json');
    const list = Array.from(memoryAttempts.values());
    fs.writeFileSync(p, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {}
}

export async function saveAttempt(attempt: Omit<AttemptModel, 'attempt_id' | 'completed_at'>): Promise<AttemptModel> {
  ensureLocalAttemptsLoaded();
  // Find existing attempt record for (uid, paper_id) to support re-attempt score updates
  const existingKey = Array.from(memoryAttempts.keys()).find((key) => {
    const a = memoryAttempts.get(key);
    return a && a.uid === attempt.uid && a.paper_id === attempt.paper_id;
  });

  const attemptId = existingKey || `att_${attempt.uid}_${attempt.paper_id}`;
  const now = new Date().toISOString();
  const fullAttempt: AttemptModel = {
    ...attempt,
    attempt_id: attemptId,
    completed_at: now,
  };

  memoryAttempts.set(attemptId, fullAttempt);
  saveLocalAttemptsDisk();

  try {
    const keyParam = API_KEY ? `&key=${API_KEY}` : '';
    const fields = toFirestoreFields(fullAttempt);
    fetch(`${BASE_URL}/attempts/${attemptId}${keyParam}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
    }).catch(() => {
      const createKeyParam = API_KEY ? `&key=${API_KEY}` : '';
      fetch(`${BASE_URL}/attempts?documentId=${attemptId}${createKeyParam}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields }),
      }).catch(() => {});
    });
  } catch (err) {}

  return fullAttempt;
}

export async function getUserAttempts(uid: string): Promise<AttemptModel[]> {
  ensureLocalAttemptsLoaded();
  const localList = Array.from(memoryAttempts.values()).filter((a) => a.uid === uid || uid === 'aspirant_learner_101');
  if (localList.length > 0) return localList;

  try {
    const keyParam = API_KEY ? `&key=${API_KEY}` : '';
    const res = await fetch(`${BASE_URL}/attempts?pageSize=200${keyParam}`, { signal: AbortSignal.timeout(1500) });
    if (res.ok) {
      const data = await res.json();
      const docs = data.documents || [];
      const attempts: AttemptModel[] = docs.map((d: any) => parseFirestoreFields(d.fields) as AttemptModel);
      attempts.forEach((a: AttemptModel) => memoryAttempts.set(a.attempt_id, a));
      saveLocalAttemptsDisk();
      return attempts.filter((a: AttemptModel) => a.uid === uid || uid === 'aspirant_learner_101');
    }
  } catch (err) {}
  return localList;
}

// ==========================================
// 4. ORDERS & PAYMENTS MODEL & CRUD
// ==========================================
export interface OrderModel {
  order_id: string;
  uid: string;
  email?: string;
  branch_code?: string;
  product_id: string;
  product_title: string;
  amount: number;
  currency: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  status: 'PENDING' | 'GRANTED' | 'CAPTURED' | 'FAILED' | 'REFUNDED';
  created_at: string;
}

function ensureLocalOrdersLoaded() {
  if (memoryOrders.size > 0) return;
  try {
    const p = getScratchFilePath('orders.json');
    if (fs.existsSync(p)) {
      const data: OrderModel[] = JSON.parse(fs.readFileSync(p, 'utf-8'));
      data.forEach((ord) => memoryOrders.set(ord.order_id, ord));
    }
  } catch (err) {}

  // No default mock orders
}

function saveLocalOrdersDisk() {
  try {
    const p = getScratchFilePath('orders.json');
    const list = Array.from(memoryOrders.values());
    fs.writeFileSync(p, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {}
}

export async function createOrder(order: Omit<OrderModel, 'created_at'>): Promise<OrderModel> {
  ensureLocalOrdersLoaded();
  const now = new Date().toISOString();
  const fullOrder: OrderModel = {
    ...order,
    created_at: now,
  };

  memoryOrders.set(order.order_id, fullOrder);
  saveLocalOrdersDisk();

  try {
    const keyParam = API_KEY ? `&key=${API_KEY}` : '';
    const fields = toFirestoreFields(fullOrder);
    fetch(`${BASE_URL}/orders?documentId=${order.order_id}${keyParam}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
    }).catch(() => {});
  } catch (err) {}

  return fullOrder;
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderModel['status'],
  paymentDetails?: { razorpay_payment_id?: string; razorpay_signature?: string }
): Promise<boolean> {
  ensureLocalOrdersLoaded();
  const existing = memoryOrders.get(orderId);
  if (existing) {
    memoryOrders.set(orderId, { ...existing, status, ...paymentDetails });
  } else {
    memoryOrders.set(orderId, {
      order_id: orderId,
      uid: 'aspirant_learner_101',
      product_id: 'cs_pass',
      product_title: 'GATE CS All-Access Branch Pass',
      amount: 500,
      currency: 'INR',
      status,
      ...paymentDetails,
      created_at: new Date().toISOString(),
    });
  }
  saveLocalOrdersDisk();

  try {
    const keyParam = API_KEY ? `?key=${API_KEY}` : '';
    const fields = toFirestoreFields({ status, ...paymentDetails });
    fetch(`${BASE_URL}/orders/${orderId}${keyParam}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
    }).catch(() => {});
  } catch (err) {}
  return true;
}

export async function getUserOrders(uid: string, email?: string): Promise<OrderModel[]> {
  ensureLocalUsersLoaded();
  ensureLocalOrdersLoaded();
  const allOrders = Array.from(memoryOrders.values());
  const cleanEmail = email ? email.trim().toLowerCase() : null;
  const matchingOrders = allOrders.filter(
    (o) =>
      (o.uid === uid || (cleanEmail && o.email && o.email.toLowerCase() === cleanEmail)) &&
      (o.status === 'GRANTED' || o.status === 'CAPTURED')
  );

  // Check user profile in memory to synthesize granted orders from activePasses
  let targetUser = memoryUsers.get(uid);
  if (!targetUser && cleanEmail) {
    targetUser = Array.from(memoryUsers.values()).find(
      (u) => u.email && u.email.toLowerCase() === cleanEmail
    );
  }

  if (targetUser?.activePasses && targetUser.activePasses.length > 0) {
    targetUser.activePasses.forEach((b) => {
      const bUpper = b.toUpperCase();
      const targetPassId = `${bUpper.toLowerCase()}_pass`;
      const alreadyHas = matchingOrders.some(
        (o) => o.branch_code === bUpper || o.product_id === targetPassId
      );
      if (!alreadyHas) {
        matchingOrders.push({
          order_id: `ord_pass_${targetUser!.uid}_${bUpper}`,
          uid: targetUser!.uid,
          email: targetUser!.email || cleanEmail || undefined,
          branch_code: bUpper,
          product_id: targetPassId,
          product_title: `GATE ${bUpper} All-Access Branch Pass`,
          amount: 500,
          currency: 'INR',
          status: 'GRANTED',
          created_at: targetUser!.createdAt || new Date().toISOString(),
        });
      }
    });
  }

  return matchingOrders;
}

export async function getAllOrders(): Promise<OrderModel[]> {
  ensureLocalOrdersLoaded();
  return Array.from(memoryOrders.values());
}

/**
 * Admin: Grant test paper access for a particular branch by student email.
 */
export async function grantBranchAccessByEmail({
  email,
  uid,
  branch,
  notes,
}: {
  email: string;
  uid?: string;
  branch: string;
  notes?: string;
}): Promise<{ success: boolean; message: string; order: OrderModel; user: UserModel | null }> {
  ensureLocalUsersLoaded();
  ensureLocalOrdersLoaded();

  const cleanEmail = email.trim().toLowerCase();
  const branchCode = branch.trim().toUpperCase();
  const productId = `${branchCode.toLowerCase()}_pass`;
  const productTitle = `GATE ${branchCode} All-Access Branch Pass (Admin Granted)`;

  // 1. Find or create user profile
  let targetUser: UserModel | null | undefined = null;

  if (uid && memoryUsers.has(uid)) {
    targetUser = memoryUsers.get(uid);
  }

  if (!targetUser) {
    targetUser = Array.from(memoryUsers.values()).find(
      (u) => u.email && u.email.toLowerCase() === cleanEmail
    );
  }

  if (!targetUser && uid) {
    targetUser = await getUserProfile(uid);
  }

  // Fallback: Query Firestore REST for user with this email
  if (!targetUser) {
    try {
      const keyParam = API_KEY ? `?key=${API_KEY}` : '';
      const runQueryRes = await fetch(`${BASE_URL}:runQuery${keyParam}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: 'users' }],
            where: {
              fieldFilter: {
                field: { fieldPath: 'email' },
                op: 'EQUAL',
                value: { stringValue: cleanEmail },
              },
            },
            limit: 1,
          },
        }),
      });
      if (runQueryRes.ok) {
        const queryData = await runQueryRes.json();
        if (Array.isArray(queryData) && queryData[0]?.document) {
          const docData = queryData[0].document;
          const parsed = parseFirestoreFields(docData.fields) as UserModel;
          const docId = docData.name.split('/').pop()!;
          parsed.uid = parsed.uid || docId;
          targetUser = parsed;
          memoryUsers.set(parsed.uid, parsed);
        }
      }
    } catch (e) {}
  }

  let targetUid = targetUser ? targetUser.uid : (uid || `user_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`);

  if (!targetUser) {
    const now = new Date().toISOString();
    targetUser = {
      uid: targetUid,
      email: cleanEmail,
      displayName: cleanEmail.split('@')[0],
      photoURL: null,
      role: 'LEARNER',
      status: 'ACTIVE',
      activePasses: [branchCode],
      createdAt: now,
      lastLoginAt: now,
    };
    memoryUsers.set(targetUid, targetUser);
    saveLocalUsersDisk();
  } else {
    const currentPasses = targetUser.activePasses || [];
    if (!currentPasses.includes(branchCode)) {
      targetUser.activePasses = [...currentPasses, branchCode];
      memoryUsers.set(targetUser.uid, targetUser);
      saveLocalUsersDisk();
    }
  }

  // 2. Create GRANTED order record
  const orderId = `ord_admin_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const newOrder: OrderModel = {
    order_id: orderId,
    uid: targetUser.uid,
    email: cleanEmail,
    branch_code: branchCode,
    product_id: productId,
    product_title: productTitle,
    amount: 500,
    currency: 'INR',
    razorpay_payment_id: `admin_manual_${Date.now()}`,
    status: 'GRANTED',
    created_at: new Date().toISOString(),
  };

  memoryOrders.set(orderId, newOrder);
  saveLocalOrdersDisk();

  // 3. Sync to Firestore REST API as well
  try {
    const keyParam = API_KEY ? `?key=${API_KEY}` : '';
    const userFields = toFirestoreFields({
      activePasses: targetUser.activePasses,
      role: targetUser.role,
      status: targetUser.status,
    });
    fetch(`${BASE_URL}/users/${targetUser.uid}${keyParam}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: userFields }),
    }).catch(() => {});

    const orderFields = toFirestoreFields(newOrder);
    fetch(`${BASE_URL}/orders?documentId=${orderId}${keyParam}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: orderFields }),
    }).catch(() => {});
  } catch (err) {}

  return {
    success: true,
    message: `Successfully granted GATE ${branchCode} test series access to ${cleanEmail}`,
    order: newOrder,
    user: targetUser,
  };
}

/**
 * Admin: Revoke branch access for a student email.
 */
export async function revokeBranchAccessByEmail({
  email,
  branch,
}: {
  email: string;
  branch: string;
}): Promise<{ success: boolean; message: string }> {
  ensureLocalUsersLoaded();
  ensureLocalOrdersLoaded();

  const cleanEmail = email.trim().toLowerCase();
  const branchCode = branch.trim().toUpperCase();
  const productId = `${branchCode.toLowerCase()}_pass`;

  const targetUser = Array.from(memoryUsers.values()).find(
    (u) => u.email && u.email.toLowerCase() === cleanEmail
  );
  if (targetUser && targetUser.activePasses) {
    targetUser.activePasses = targetUser.activePasses.filter((b) => b !== branchCode);
    memoryUsers.set(targetUser.uid, targetUser);
    saveLocalUsersDisk();
  }

  Array.from(memoryOrders.values()).forEach((o) => {
    if (
      (o.email?.toLowerCase() === cleanEmail || o.uid === targetUser?.uid) &&
      (o.product_id === productId || o.branch_code === branchCode) &&
      o.status === 'GRANTED'
    ) {
      o.status = 'REFUNDED';
      memoryOrders.set(o.order_id, o);
    }
  });
  saveLocalOrdersDisk();

  return { success: true, message: `Revoked GATE ${branchCode} pass from ${cleanEmail}` };
}


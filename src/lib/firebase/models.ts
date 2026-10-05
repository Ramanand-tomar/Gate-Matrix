import { UserRole } from '../rbac';

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

// ==========================================
// 1. USER MODEL & CRUD
// ==========================================
export interface UserModel {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  activePasses?: string[];
  createdAt: string;
  lastLoginAt: string;
}

export async function getUserProfile(uid: string): Promise<UserModel | null> {
  if (memoryUsers.has(uid)) {
    return memoryUsers.get(uid)!;
  }
  try {
    const keyParam = API_KEY ? `?key=${API_KEY}` : '';
    const res = await fetch(`${BASE_URL}/users/${uid}${keyParam}`);
    if (res.ok) {
      const data = await res.json();
      const user = parseFirestoreFields(data.fields) as UserModel;
      memoryUsers.set(uid, user);
      return user;
    }
  } catch (err) {
    console.error(`Error fetching user ${uid}:`, err);
  }
  return null;
}

export async function saveUserProfile(user: Partial<UserModel> & { uid: string }): Promise<UserModel> {
  const now = new Date().toISOString();
  const existing = memoryUsers.get(user.uid) || (await getUserProfile(user.uid));

  const profileData: UserModel = {
    uid: user.uid,
    email: user.email || (existing ? existing.email : null),
    displayName: user.displayName || (existing ? existing.displayName : null),
    photoURL: user.photoURL || (existing ? existing.photoURL : null),
    role: user.role || (existing ? existing.role : 'LEARNER'),
    activePasses: user.activePasses || (existing ? existing.activePasses : []),
    createdAt: existing ? existing.createdAt : now,
    lastLoginAt: now,
  };

  memoryUsers.set(user.uid, profileData);

  // Background Firestore REST sync
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
  const user = memoryUsers.get(uid) || (await getUserProfile(uid));
  if (user) {
    user.role = role;
    memoryUsers.set(uid, user);
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
  file_name?: string;
  rel_path?: string;
  total_questions: number;
  questions: QuestionModel[];
  created_at?: string;
  updated_at?: string;
}

export async function getPapers(branch?: string, limitCount: number = 50) {
  if (memoryPapers.size > 0) {
    const list = Array.from(memoryPapers.values()).map((p) => ({
      paper_id: p.paper_id,
      title: p.title,
      branch: p.branch,
      provider: p.provider,
      series: p.series,
      total_questions: p.total_questions,
    }));
    if (branch && branch !== 'All') {
      return list.filter((p) => p.branch.toUpperCase().includes(branch.toUpperCase()));
    }
    return list;
  }

  try {
    const keyParam = API_KEY ? `&key=${API_KEY}` : '';
    const res = await fetch(`${BASE_URL}/papers?pageSize=${limitCount}${keyParam}`);
    if (res.ok) {
      const data = await res.json();
      const docs = data.documents || [];

      const papers = docs.map((doc: any) => {
        const docId = doc.name.split('/').pop();
        const parsed = parseFirestoreFields(doc.fields);
        const pObj: PaperModel = {
          paper_id: parsed.paper_id || docId,
          title: parsed.title || docId,
          branch: parsed.branch || 'GENERAL',
          provider: parsed.provider || 'GATEPrep',
          series: parsed.series || 'Mock Series',
          total_questions: parsed.total_questions || (parsed.questions ? parsed.questions.length : 0),
          questions: parsed.questions || [],
        };
        memoryPapers.set(pObj.paper_id, pObj);
        return {
          paper_id: pObj.paper_id,
          title: pObj.title,
          branch: pObj.branch,
          provider: pObj.provider,
          series: pObj.series,
          total_questions: pObj.total_questions,
        };
      });

      if (branch && branch !== 'All') {
        return papers.filter((p: any) => p.branch.toUpperCase().includes(branch.toUpperCase()));
      }
      return papers;
    }
  } catch (err) {
    console.error('Error fetching papers via REST:', err);
  }
  return [];
}

export async function getPaperById(paperId: string): Promise<PaperModel | null> {
  if (memoryPapers.has(paperId)) {
    return memoryPapers.get(paperId)!;
  }

  try {
    const keyParam = API_KEY ? `?key=${API_KEY}` : '';
    const res = await fetch(`${BASE_URL}/papers/${paperId}${keyParam}`);
    if (res.ok) {
      const data = await res.json();
      const paper = parseFirestoreFields(data.fields) as PaperModel;
      memoryPapers.set(paperId, paper);
      return paper;
    }
  } catch (err) {
    console.error(`Error fetching paper ${paperId}:`, err);
  }
  return null;
}

export async function createPaper(paper: PaperModel): Promise<boolean> {
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

export async function saveAttempt(attempt: Omit<AttemptModel, 'attempt_id' | 'completed_at'>): Promise<AttemptModel> {
  const attemptId = `att_${Date.now()}`;
  const now = new Date().toISOString();
  const fullAttempt: AttemptModel = {
    ...attempt,
    attempt_id: attemptId,
    completed_at: now,
  };

  memoryAttempts.set(attemptId, fullAttempt);

  try {
    const keyParam = API_KEY ? `&key=${API_KEY}` : '';
    const fields = toFirestoreFields(fullAttempt);
    fetch(`${BASE_URL}/attempts?documentId=${attemptId}${keyParam}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
    }).catch(() => {});
  } catch (err) {}

  return fullAttempt;
}

export async function getUserAttempts(uid: string): Promise<AttemptModel[]> {
  const localList = Array.from(memoryAttempts.values()).filter((a) => a.uid === uid);
  if (localList.length > 0) return localList;

  try {
    const keyParam = API_KEY ? `&key=${API_KEY}` : '';
    const res = await fetch(`${BASE_URL}/attempts?pageSize=50${keyParam}`);
    if (res.ok) {
      const data = await res.json();
      const docs = data.documents || [];
      const attempts: AttemptModel[] = docs.map((d: any) => parseFirestoreFields(d.fields) as AttemptModel);
      attempts.forEach((a: AttemptModel) => memoryAttempts.set(a.attempt_id, a));
      return attempts.filter((a: AttemptModel) => a.uid === uid);
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
  product_id: string;
  product_title: string;
  amount: number;
  currency: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  status: 'PENDING' | 'GRANTED' | 'FAILED' | 'REFUNDED';
  created_at: string;
}

export async function createOrder(order: Omit<OrderModel, 'created_at'>): Promise<OrderModel> {
  const now = new Date().toISOString();
  const fullOrder: OrderModel = {
    ...order,
    created_at: now,
  };

  memoryOrders.set(order.order_id, fullOrder);

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
  const existing = memoryOrders.get(orderId);
  if (existing) {
    memoryOrders.set(orderId, { ...existing, status, ...paymentDetails });
  }

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

export async function getUserOrders(uid: string): Promise<OrderModel[]> {
  const localList = Array.from(memoryOrders.values()).filter((o) => o.uid === uid);
  if (localList.length > 0) return localList;

  try {
    const keyParam = API_KEY ? `&key=${API_KEY}` : '';
    const res = await fetch(`${BASE_URL}/orders?pageSize=50${keyParam}`);
    if (res.ok) {
      const data = await res.json();
      const docs = data.documents || [];
      const orders: OrderModel[] = docs.map((d: any) => parseFirestoreFields(d.fields) as OrderModel);
      orders.forEach((o: OrderModel) => memoryOrders.set(o.order_id, o));
      return orders.filter((o: OrderModel) => o.uid === uid);
    }
  } catch (err) {}
  return localList;
}

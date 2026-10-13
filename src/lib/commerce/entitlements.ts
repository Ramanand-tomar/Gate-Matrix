import crypto from 'crypto';

export interface Grant {
  grantId: string;
  userId: string;
  productType: 'BRANCH_PASS' | 'SUBJECT_BUNDLE';
  branchCode: string;
  productId: string;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  orderId: string;
}

export interface CheckoutOrder {
  orderId: string;
  userId: string;
  productId: string;
  productType: 'BRANCH_PASS' | 'SUBJECT_BUNDLE';
  branchCode: string;
  amountPaise: number;
  currency: 'INR';
  status: 'PENDING' | 'CAPTURED' | 'GRANTED' | 'FAILED' | 'REFUNDED';
  createdAt: string;
}

export const OFFICIAL_PRODUCT_CATALOG: Record<
  string,
  { title: string; priceINR: number; type: 'BRANCH_PASS'; branch: string }
> = {
  cs_pass: { title: 'CS Branch Pass', priceINR: 500, type: 'BRANCH_PASS', branch: 'CS' },
  da_pass: { title: 'DA Branch Pass', priceINR: 500, type: 'BRANCH_PASS', branch: 'DA' },
  ee_pass: { title: 'EE Branch Pass', priceINR: 500, type: 'BRANCH_PASS', branch: 'EE' },
  ec_pass: { title: 'EC Branch Pass', priceINR: 500, type: 'BRANCH_PASS', branch: 'EC' },
  me_pass: { title: 'ME Branch Pass', priceINR: 500, type: 'BRANCH_PASS', branch: 'ME' },
  ce_pass: { title: 'CE Branch Pass', priceINR: 500, type: 'BRANCH_PASS', branch: 'CE' },
};

export function getOfficialPriceINR(productId: string): number {
  if (OFFICIAL_PRODUCT_CATALOG[productId]) {
    return OFFICIAL_PRODUCT_CATALOG[productId].priceINR;
  }
  return 500;
}

/**
 * Computes Razorpay HMAC-SHA256 signature to verify payment authenticity.
 */
export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string
): boolean {
  if (!orderId || !paymentId || !signature || !secret) return false;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return expectedSignature === signature;
}

/**
 * Evaluates whether a user has active entitlement access to a given test item.
 */
export function checkUserEntitlement(
  grants: Grant[],
  testBranchCode: string,
  testProductId: string
): { hasAccess: boolean; grantReason?: string } {
  const now = new Date();

  for (const grant of grants) {
    if (!grant.isActive) continue;
    const validUntil = new Date(grant.validUntil);
    if (validUntil < now) continue;

    if (grant.productType === 'BRANCH_PASS' && grant.branchCode === testBranchCode) {
      return { hasAccess: true, grantReason: `Active ${grant.branchCode} Branch Pass` };
    }

    if (grant.productType === 'SUBJECT_BUNDLE' && grant.productId === testProductId) {
      return { hasAccess: true, grantReason: `Purchased Bundle: ${grant.productId}` };
    }
  }

  return { hasAccess: false };
}

export const FREE_PYQ_IDS = new Set([
  'gate_cs_2024_pyq', 'gate_cs_2023_pyq', 'gate_cs_2022_pyq',
  'gate_da_2024_pyq', 'gate_da_2023_pyq', 'gate_da_2022_pyq',
  'gate_ee_2024_pyq', 'gate_ee_2023_pyq', 'gate_ee_2022_pyq',
  'gate_ec_2024_pyq', 'gate_ec_2023_pyq', 'gate_ec_2022_pyq',
  'gate_me_2024_pyq', 'gate_me_2023_pyq', 'gate_me_2022_pyq',
  'gate_ce_2024_pyq', 'gate_ce_2023_pyq', 'gate_ce_2022_pyq',
]);

/**
 * Helper: Checks if a given paper is a free starter/sample paper.
 * STRICT ENFORCEMENT:
 * - Only the designated 3 PYQ papers per branch are free for free users.
 * - Coaching institute / classes test papers (MADE EASY, GO Classes, DVRUO, ACE Academy, GATE Wallah, Unacademy, etc.)
 *   are NEVER free. They strictly require a Branch Pass.
 * - Full-Length mocks, topic-wise tests, and non-PYQ tests are NEVER free.
 */
export function isPaperFree(
  paper: { title?: string; paper_id?: string; is_free?: boolean; institute?: string; provider?: string },
  _index: number = 0
): boolean {
  if (!paper) return false;
  if (paper.is_free) return true;
  if (paper.paper_id && FREE_PYQ_IDS.has(paper.paper_id)) return true;

  const title = (paper.title || '').toLowerCase();
  const provider = (paper.provider || '').toLowerCase();
  const institute = (paper.institute || '').toLowerCase();

  // Coaching institute / class tests are NEVER free under any circumstances
  const isCoaching =
    institute.includes('made easy') ||
    institute.includes('ace academy') ||
    institute.includes('go classes') ||
    institute.includes('dvruo') ||
    institute.includes('gate wallah') ||
    institute.includes('unacademy') ||
    provider.includes('dvruo') ||
    provider.includes('made easy') ||
    provider.includes('ace') ||
    provider.includes('classes');

  if (isCoaching) {
    return false;
  }

  // Only official PYQ papers with explicit PYQ identification can be free (max 3 per branch)
  if (
    (title.includes('pyq') || title.includes('previous year') || title.includes('actual exam paper')) &&
    (title.includes('2024') || title.includes('2023') || title.includes('2022'))
  ) {
    return true;
  }

  return false;
}

export function normalizeBranchCode(branchRaw: string): string {
  const upper = (branchRaw || '').toUpperCase().trim();
  if (upper === 'CS' || upper.includes('COMPUTER') || upper.includes('CS_')) return 'CS';
  if (upper === 'DA' || upper.includes('DATA SCIENCE') || upper.includes('AI') || upper.includes('DA_')) return 'DA';
  if (upper === 'EE' || upper.includes('ELECTRICAL') || upper.includes('EE_')) return 'EE';
  if (upper === 'EC' || upper.includes('ELECTRONICS') || upper.includes('EC_')) return 'EC';
  if (upper === 'ME' || upper.includes('MECHANICAL') || upper.includes('ME_')) return 'ME';
  if (upper === 'CE' || upper.includes('CIVIL') || upper.includes('CE_')) return 'CE';
  return upper;
}

/**
 * Helper: Evaluates whether candidate has an active one-time Branch Pass for a given branch.
 * Checks both orders records and user profile activePasses / role.
 */
export function hasUserBranchAccess(
  orders: any[],
  branchCode: string,
  userProfile?: { activePasses?: string[]; role?: string } | null
): boolean {
  if (!branchCode) return false;
  const upperBranch = normalizeBranchCode(branchCode);

  // If user is ADMIN or INSTRUCTOR, grant platform-wide access
  if (userProfile?.role === 'ADMIN' || userProfile?.role === 'INSTRUCTOR') {
    return true;
  }

  // Check direct activePasses in user profile
  if (userProfile?.activePasses && Array.isArray(userProfile.activePasses)) {
    const hasPass = userProfile.activePasses.some((p) => {
      const upperP = (p || '').toUpperCase();
      return upperP === upperBranch || upperP === 'ALL' || upperP.includes(upperBranch);
    });
    if (hasPass) return true;
  }

  // Check orders
  if (!orders || !Array.isArray(orders)) return false;
  const targetPassId = `${branchCode.toLowerCase()}_pass`;

  return orders.some((ord) => {
    const isGranted = ord.status === 'GRANTED' || ord.status === 'CAPTURED';
    if (!isGranted) return false;

    const ordProdId = (ord.product_id || ord.productId || '').toLowerCase();
    const ordTitle = (ord.product_title || ord.productTitle || '').toUpperCase();
    const ordBranch = (ord.branch_code || ord.branchCode || '').toUpperCase();

    const matchesProd =
      ordProdId === targetPassId ||
      ordProdId === 'all_pass' ||
      ordBranch === upperBranch ||
      ordBranch === 'ALL' ||
      ordTitle.includes(`${upperBranch} BRANCH`) ||
      ordTitle.includes(`${upperBranch} ALL-ACCESS`) ||
      ordTitle.includes(`${upperBranch} PASS`) ||
      ordTitle.includes('ALL-ACCESS');

    return matchesProd;
  });
}

/**
 * Returns array of branch codes for which user owns active passes.
 */
export function getUserPurchasedBranches(
  orders: any[],
  userProfile?: { activePasses?: string[]; role?: string } | null
): string[] {
  const allBranches = ['CS', 'DA', 'EE', 'EC', 'ME', 'CE'];
  return allBranches.filter((b) => hasUserBranchAccess(orders, b, userProfile));
}

/**
 * Helper: Evaluates whether a user can access a specific paper.
 * Free papers are accessible as samples.
 * Paid papers require an active Branch Pass for the paper's branch.
 */
export function canUserAccessPaper(
  orders: any[],
  paper: { branch?: string; paper_id?: string; title?: string; is_free?: boolean; institute?: string; provider?: string },
  _index: number = 0,
  userProfile?: { activePasses?: string[]; role?: string } | null
): { hasAccess: boolean; reason: 'FREE_SAMPLE' | 'BRANCH_PASS_ACTIVE' | 'BRANCH_PASS_REQUIRED'; requiredBranch: string } {
  const paperBranch = normalizeBranchCode(paper?.branch || 'CS');

  if (isPaperFree(paper)) {
    return { hasAccess: true, reason: 'FREE_SAMPLE', requiredBranch: paperBranch };
  }

  if (hasUserBranchAccess(orders, paperBranch, userProfile)) {
    return { hasAccess: true, reason: 'BRANCH_PASS_ACTIVE', requiredBranch: paperBranch };
  }

  return { hasAccess: false, reason: 'BRANCH_PASS_REQUIRED', requiredBranch: paperBranch };
}


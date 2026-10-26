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
 * Helper: Checks if a given paper is a free paper.
 * ALL papers (coaching tests, PYQs, mock tests, topic tests) are 100% FREE for all students.
 */
export function isPaperFree(
  _paper?: { title?: string; paper_id?: string; is_free?: boolean; institute?: string; provider?: string },
  _index: number = 0
): boolean {
  return true;
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
 * Helper: Evaluates whether candidate has access for a given branch.
 * All branches are 100% FREE and unlocked for all students.
 */
export function hasUserBranchAccess(
  _orders?: any[],
  _branchCode?: string,
  _userProfile?: { activePasses?: string[]; role?: string } | null
): boolean {
  return true;
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
  _orders?: any[],
  paper?: { branch?: string; paper_id?: string; title?: string; is_free?: boolean; institute?: string; provider?: string },
  _index: number = 0,
  _userProfile?: { activePasses?: string[]; role?: string } | null
): { hasAccess: boolean; reason: 'FREE_SAMPLE' | 'BRANCH_PASS_ACTIVE' | 'BRANCH_PASS_REQUIRED'; requiredBranch: string } {
  const paperBranch = normalizeBranchCode(paper?.branch || 'CS');
  return { hasAccess: true, reason: 'FREE_SAMPLE', requiredBranch: paperBranch };
}


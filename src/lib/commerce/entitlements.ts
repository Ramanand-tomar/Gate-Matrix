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
  cs_pass: { title: 'CS Branch Pass', priceINR: 1499, type: 'BRANCH_PASS', branch: 'CS' },
  da_pass: { title: 'DA Branch Pass', priceINR: 1499, type: 'BRANCH_PASS', branch: 'DA' },
  ee_pass: { title: 'EE Branch Pass', priceINR: 1499, type: 'BRANCH_PASS', branch: 'EE' },
  ec_pass: { title: 'EC Branch Pass', priceINR: 1499, type: 'BRANCH_PASS', branch: 'EC' },
  me_pass: { title: 'ME Branch Pass', priceINR: 1499, type: 'BRANCH_PASS', branch: 'ME' },
  ce_pass: { title: 'CE Branch Pass', priceINR: 1499, type: 'BRANCH_PASS', branch: 'CE' },
};

export function getOfficialPriceINR(productId: string): number {
  if (OFFICIAL_PRODUCT_CATALOG[productId]) {
    return OFFICIAL_PRODUCT_CATALOG[productId].priceINR;
  }
  return 1499;
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

/**
 * Helper: Checks if a given paper is a free starter/sample paper.
 */
export function isPaperFree(paper: { title?: string; paper_id?: string; is_free?: boolean }, index: number = 0): boolean {
  if (paper.is_free) return true;
  // Strictly only the first 3 papers (index 0, 1, 2) in the starting grid are free starter tests
  return index < 3;
}

/**
 * Helper: Evaluates whether candidate has an active one-time Branch Pass for a given branch.
 */
export function hasUserBranchAccess(orders: any[], branchCode: string): boolean {
  if (!orders || !Array.isArray(orders) || !branchCode) return false;
  const upperBranch = branchCode.toUpperCase();
  const targetPassId = `${branchCode.toLowerCase()}_pass`;

  return orders.some((ord) => {
    const isGranted = ord.status === 'GRANTED' || ord.status === 'CAPTURED';
    if (!isGranted) return false;

    const ordProdId = (ord.product_id || '').toLowerCase();
    const ordTitle = (ord.product_title || '').toUpperCase();
    const ordBranch = (ord.branch_code || '').toUpperCase();

    const matchesProd =
      ordProdId === targetPassId ||
      ordBranch === upperBranch ||
      ordTitle.includes(`${upperBranch} BRANCH`) ||
      ordTitle.includes(`${upperBranch} ALL-ACCESS`) ||
      ordTitle.includes(`${upperBranch} PASS`);

    return matchesProd;
  });
}

/**
 * Returns array of branch codes for which user owns active passes.
 */
export function getUserPurchasedBranches(orders: any[]): string[] {
  const allBranches = ['CS', 'DA', 'EE', 'EC', 'ME', 'CE'];
  return allBranches.filter((b) => hasUserBranchAccess(orders, b));
}

/**
 * Helper: Evaluates whether a user can access a specific paper.
 * Free papers are accessible as samples.
 * Paid papers require an active Branch Pass for the paper's branch.
 */
export function canUserAccessPaper(
  orders: any[],
  paper: { branch?: string; paper_id?: string; title?: string; is_free?: boolean },
  index: number = 0
): { hasAccess: boolean; reason: 'FREE_SAMPLE' | 'BRANCH_PASS_ACTIVE' | 'BRANCH_PASS_REQUIRED'; requiredBranch: string } {
  const paperBranch = (paper?.branch || 'CS').toUpperCase();

  if (isPaperFree(paper, index)) {
    return { hasAccess: true, reason: 'FREE_SAMPLE', requiredBranch: paperBranch };
  }

  if (hasUserBranchAccess(orders, paperBranch)) {
    return { hasAccess: true, reason: 'BRANCH_PASS_ACTIVE', requiredBranch: paperBranch };
  }

  return { hasAccess: false, reason: 'BRANCH_PASS_REQUIRED', requiredBranch: paperBranch };
}


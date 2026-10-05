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
  status: 'PENDING' | 'CAPTURED' | 'FAILED' | 'REFUNDED';
  createdAt: string;
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

    // 1. Branch Pass grants access to all series in the branch
    if (grant.productType === 'BRANCH_PASS' && grant.branchCode === testBranchCode) {
      return { hasAccess: true, grantReason: `Active ${grant.branchCode} Branch Pass` };
    }

    // 2. Subject Bundle grants access to listed product
    if (grant.productType === 'SUBJECT_BUNDLE' && grant.productId === testProductId) {
      return { hasAccess: true, grantReason: `Purchased Bundle: ${grant.productId}` };
    }
  }

  return { hasAccess: false };
}

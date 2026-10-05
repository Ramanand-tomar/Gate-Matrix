import { describe, it, expect } from 'vitest';
import { verifyRazorpaySignature, checkUserEntitlement, Grant } from '@/lib/commerce/entitlements';
import crypto from 'crypto';

describe('Phase 08 — Commerce, Signature & Entitlements Tests', () => {
  const secret = 'test_webhook_secret_123';

  it('P08-V02: Validates HMAC-SHA256 payment signature and rejects fakes', () => {
    const orderId = 'order_M12345';
    const paymentId = 'pay_P67890';
    const validSignature = crypto
      .createHmac('sha256', secret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    expect(verifyRazorpaySignature(orderId, paymentId, validSignature, secret)).toBe(true);
    expect(verifyRazorpaySignature(orderId, paymentId, 'fake_signature_abc', secret)).toBe(false);
  });

  it('P08-V04: Active CS Branch Pass grants access to CS tests; denies EE tests', () => {
    const activeCsGrant: Grant = {
      grantId: 'g1',
      userId: 'user_101',
      productType: 'BRANCH_PASS',
      branchCode: 'CS',
      productId: 'cs_pass',
      validFrom: '2026-01-01T00:00:00Z',
      validUntil: '2027-12-31T23:59:59Z',
      isActive: true,
      orderId: 'ord_1',
    };

    const csResult = checkUserEntitlement([activeCsGrant], 'CS', 'cs_dbms_quiz');
    expect(csResult.hasAccess).toBe(true);
    expect(csResult.grantReason).toContain('Active CS Branch Pass');

    const eeResult = checkUserEntitlement([activeCsGrant], 'EE', 'ee_circuits_quiz');
    expect(eeResult.hasAccess).toBe(false);
  });
});

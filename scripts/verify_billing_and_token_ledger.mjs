// scripts/verify_billing_and_token_ledger.mjs
// Automated verification script for server-authoritative token billing, append-only ledger, and idempotent payments.

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function runTests() {
  console.log(`\n=============================================================`);
  console.log(`=== SYNC730 RECRUITER BILLING & TOKEN LEDGER VERIFICATION ===`);
  console.log(`=============================================================\n`);

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, detail = '') {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} - ${detail}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Role Enforcement on Order Creation (INTERVIEWER Rejected)
    // -------------------------------------------------------------------------
    console.log(`\n--- Test 1: Role Enforcement on Order Creation ---`);
    const interviewerRes = await fetch(`${BASE_URL}/api/recruiter/billing/order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-recruiter-role': 'INTERVIEWER',
      },
      body: JSON.stringify({ pack_id: 'starter' }),
    });

    assert(
      interviewerRes.status === 403,
      'Interviewer role cannot create billing orders (403 Forbidden)',
      `Status was ${interviewerRes.status}`
    );

    // -------------------------------------------------------------------------
    // TEST 2: Invalid Pack ID Rejected by Server
    // -------------------------------------------------------------------------
    console.log(`\n--- Test 2: Invalid Pack ID Validation ---`);
    const invalidPackRes = await fetch(`${BASE_URL}/api/recruiter/billing/order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-recruiter-role': 'ADMIN',
      },
      body: JSON.stringify({ pack_id: 'fake_pack_999' }),
    });

    assert(
      invalidPackRes.status === 400,
      'Server rejects invalid pack ID with 400 Bad Request',
      `Status was ${invalidPackRes.status}`
    );

    // -------------------------------------------------------------------------
    // TEST 3: Create PENDING Card Order with Server-Controlled Pricing
    // -------------------------------------------------------------------------
    console.log(`\n--- Test 3: Create Card Order with Server Config Prices ---`);
    const createOrderRes = await fetch(`${BASE_URL}/api/recruiter/billing/order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-recruiter-role': 'ADMIN',
      },
      body: JSON.stringify({ pack_id: 'growth', payment_method: 'card' }),
    });

    const createOrderData = await createOrderRes.json();
    assert(createOrderRes.status === 200, 'Admin can successfully initialize Growth Pack order');
    assert(createOrderData.order.tokens === 15, 'Growth pack contains exactly 15 tokens');
    assert(createOrderData.order.amount === 270000, 'Growth pack amount is exactly ₦270,000 (server config)');
    assert(createOrderData.order.status === 'PENDING', 'Order starts in PENDING status');
    assert(
      createOrderData.order.payment_reference.startsWith('SYNC730-ORD-'),
      'Order payment reference follows SYNC730-ORD- format'
    );
    const cardRef = createOrderData.order.payment_reference;

    // -------------------------------------------------------------------------
    // TEST 4: Poll Order Status Endpoint
    // -------------------------------------------------------------------------
    console.log(`\n--- Test 4: Polling Order Status ---`);
    const pollRes = await fetch(`${BASE_URL}/api/recruiter/billing/order?reference=${cardRef}`, {
      headers: { 'x-recruiter-role': 'ADMIN' },
    });
    const pollData = await pollRes.json();
    assert(pollRes.status === 200, 'Order polling endpoint returns 200');
    assert(pollData.order.status === 'PENDING', 'Polled order status reflects PENDING');
    const balanceBeforeCardVerify = pollData.token_balance;

    // -------------------------------------------------------------------------
    // TEST 5: Verify Payment & Issue Tokens to Append-Only Ledger
    // -------------------------------------------------------------------------
    console.log(`\n--- Test 5: Server Payment Verification & Token Issuance ---`);
    const verifyRes = await fetch(`${BASE_URL}/api/recruiter/billing/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-recruiter-role': 'ADMIN',
      },
      body: JSON.stringify({ reference: cardRef, simulated_pay: true }),
    });

    const verifyData = await verifyRes.json();
    assert(verifyRes.status === 200, 'Server payment verification succeeded with 200');
    assert(verifyData.verified === true, 'Verification returns verified: true');
    assert(verifyData.tokens_issued === 15, 'Tokens issued equals 15 tokens');
    assert(
      verifyData.token_balance === balanceBeforeCardVerify + 15,
      `Balance increased by 15 from ${balanceBeforeCardVerify} to ${balanceBeforeCardVerify + 15}`
    );

    // -------------------------------------------------------------------------
    // TEST 6: Idempotent Payment Verification (No Double Credits!)
    // -------------------------------------------------------------------------
    console.log(`\n--- Test 6: Idempotent Payment Verification ---`);
    const repeatVerifyRes = await fetch(`${BASE_URL}/api/recruiter/billing/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-recruiter-role': 'ADMIN',
      },
      body: JSON.stringify({ reference: cardRef, simulated_pay: true }),
    });

    const repeatVerifyData = await repeatVerifyRes.json();
    assert(repeatVerifyRes.status === 200, 'Repeat verification returns 200');
    assert(repeatVerifyData.already_confirmed === true, 'Flagged as already_confirmed: true');
    assert(repeatVerifyData.tokens_issued === 0, 'Zero tokens re-issued on duplicate call (idempotent)');
    assert(
      repeatVerifyData.token_balance === balanceBeforeCardVerify + 15,
      'Token balance did not change on repeated verification'
    );

    // -------------------------------------------------------------------------
    // TEST 7: Bank Transfer Order & Super Admin Manual Confirmation
    // -------------------------------------------------------------------------
    console.log(`\n--- Test 7: Bank Transfer Order & Confirmation ---`);
    const bankOrderRes = await fetch(`${BASE_URL}/api/recruiter/billing/order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-recruiter-role': 'OWNER',
      },
      body: JSON.stringify({ pack_id: 'starter', payment_method: 'bank_transfer' }),
    });

    const bankOrderData = await bankOrderRes.json();
    assert(bankOrderRes.status === 200, 'Owner can create Bank Transfer order');
    assert(
      bankOrderData.order.status === 'PENDING_CONFIRMATION',
      'Bank transfer order starts in PENDING_CONFIRMATION status'
    );
    assert(
      bankOrderData.bank_details.account_number === '9920194821',
      'Bank details returned with dedicated escrow account'
    );
    const bankRef = bankOrderData.order.payment_reference;

    // Current balance before bank confirmation
    const preBankPoll = await fetch(`${BASE_URL}/api/recruiter/billing/order?reference=${bankRef}`, {
      headers: { 'x-recruiter-role': 'OWNER' },
    }).then((r) => r.json());
    const balanceBeforeBankConfirm = preBankPoll.token_balance;

    // Super Admin confirms bank transfer
    const confirmTransferRes = await fetch(`${BASE_URL}/api/admin/billing/confirm-transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reference: bankRef,
        notes: 'Wire transfer confirmed on Titan Trust Bank statement REF#882193',
      }),
    });

    const confirmTransferData = await confirmTransferRes.json();
    assert(confirmTransferRes.status === 200, 'Super admin confirmed bank transfer successfully');
    assert(confirmTransferData.order.status === 'CONFIRMED', 'Order status updated to CONFIRMED');
    assert(
      confirmTransferData.token_balance === balanceBeforeBankConfirm + 5,
      'Starter pack 5 tokens credited to organization balance'
    );

    // -------------------------------------------------------------------------
    // TEST 8: Billing History & Ledger Integrity
    // -------------------------------------------------------------------------
    console.log(`\n--- Test 8: Billing History & Append-Only Ledger ---`);
    const historyRes = await fetch(`${BASE_URL}/api/recruiter/billing/history`, {
      headers: { 'x-recruiter-role': 'ADMIN' },
    });
    const historyData = await historyRes.json();
    assert(historyRes.status === 200, 'Billing history returns 200');
    assert(Array.isArray(historyData.orders), 'Orders returned as array');
    assert(Array.isArray(historyData.ledger), 'Ledger returned as array');

    const calculatedSum = historyData.ledger.reduce((sum, item) => sum + item.amount, 0);
    assert(
      historyData.token_balance === calculatedSum,
      `Authoritative balance (${historyData.token_balance}) strictly equals sum of ledger rows (${calculatedSum})`
    );

    // -------------------------------------------------------------------------
    // TEST 9: Candidate Unlock with Idempotency Key
    // -------------------------------------------------------------------------
    console.log(`\n--- Test 9: Candidate Unlock & Double-Spend Prevention ---`);
    const balanceBeforeUnlock = historyData.token_balance;
    const idempKey = `test_idemp_${Date.now()}`;
    const unlockRes = await fetch(`${BASE_URL}/api/talent/unlock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-recruiter-role': 'ADMIN',
      },
      body: JSON.stringify({
        candidate_id: 'cand-001-jane-doe',
        idempotency_key: idempKey,
      }),
    });

    const unlockData = await unlockRes.json();
    assert(unlockRes.status === 200, 'Candidate unlocked successfully for 1 token');
    assert(unlockData.candidate.is_unlocked === true, 'Candidate profile is unmasked');
    assert(
      unlockData.token_balance === balanceBeforeUnlock - 1,
      `Token balance decreased by 1 from ${balanceBeforeUnlock} to ${balanceBeforeUnlock - 1}`
    );

    // Repeat with identical idempotency key (simulating fast double click)
    const repeatUnlockRes = await fetch(`${BASE_URL}/api/talent/unlock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-recruiter-role': 'ADMIN',
      },
      body: JSON.stringify({
        candidate_id: 'cand-001-jane-doe',
        idempotency_key: idempKey,
      }),
    });

    const repeatUnlockData = await repeatUnlockRes.json();
    assert(repeatUnlockRes.status === 200, 'Duplicate unlock request returns 200');
    assert(
      repeatUnlockData.token_balance === unlockData.token_balance,
      'Double-click did not deduct a second token (idempotency key protection)'
    );

    // -------------------------------------------------------------------------
    // TEST 10: Underpayment Rejection
    // -------------------------------------------------------------------------
    console.log(`\n--- Test 10: Underpayment & Amount Mismatch Rejection ---`);
    // Create an order for enterprise (800,000 NGN = 80,000,000 kobo)
    const entOrderRes = await fetch(`${BASE_URL}/api/recruiter/billing/order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-recruiter-role': 'ADMIN',
      },
      body: JSON.stringify({ pack_id: 'enterprise', payment_method: 'card' }),
    });
    const entOrderData = await entOrderRes.json();
    assert(entOrderRes.status === 200, 'Enterprise order initialized successfully');
    const entRef = entOrderData.order.payment_reference;

    // Simulate webhook delivering wrong amount (underpayment of 10,000,000 kobo instead of 80,000,000)
    const fakeWebhookRes = await fetch(`${BASE_URL}/api/webhooks/paystack`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'charge.success',
        data: {
          reference: entRef,
          amount: 10000000, // ₦100,000 instead of ₦800,000!
          currency: 'NGN',
          status: 'success',
        },
      }),
    });

    assert(fakeWebhookRes.status === 200, 'Webhook call returns 200');

    // Check order status: should be FLAGGED_REVIEW, NOT confirmed!
    const checkOrderRes = await fetch(`${BASE_URL}/api/recruiter/billing/order?reference=${entRef}`, {
      headers: { 'x-recruiter-role': 'ADMIN' },
    });
    const checkOrderData = await checkOrderRes.json();
    assert(
      checkOrderData.order.status === 'FLAGGED_REVIEW',
      'Underpaid order flagged as FLAGGED_REVIEW with 0 tokens credited',
      `Status was ${checkOrderData.order.status}`
    );
  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  }

  console.log(`\n=============================================================`);
  console.log(`=== TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ===`);
  console.log(`=============================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();

# End-to-End Testing Guide

## Prerequisites Setup

### 1. Get Stripe Test Keys
1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy your test keys and add them to `.env.local`:
   ```
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   ```
3. Restart your dev server after updating env vars

### 2. Apply Database Migration
Run this in Supabase SQL Editor:
```sql
ALTER TABLE agent_public_paywall
ADD CONSTRAINT agent_public_paywall_organization_id_key UNIQUE (organization_id);
```

---

## Full Testing Flow

### Part 1: Create & Publish an Agent (Owner Perspective)

#### Step 1: Sign In as Owner
1. Go to http://localhost:3000
2. Sign in with your account
3. Navigate to `/exhibits`

#### Step 2: Create a Test Agent
1. Click "Build AI Exhibit" → Select "Tier 1 - ElevenLabs"
2. Fill out the form:
   - **Name**: "Museum Guide Bot"
   - **Bio**: "I'm a friendly museum guide who helps visitors explore exhibits"
   - **Personality**: "Friendly, knowledgeable, enthusiastic about art and history"
   - **Voice**: Choose any ElevenLabs voice (e.g., "Rachel")
3. Click "Save & Generate Landing Page"
4. Wait for AI to generate the landing page (with Art Deco image)
5. Click "Save Agent"

#### Step 3: Publish the Agent
1. From the exhibits list, click "Publish" on your new agent
2. You'll be redirected to the agent detail page
3. Click "Publish Agent" button
4. The status should change to "Published" ✅
5. Note the QR code and visitor URL (e.g., `/visitor/museum-guide-bot`)

---

### Part 2: Set Up Paywall (Owner Perspective)

#### Step 4: Create Organization Paywall
1. On `/exhibits` page, look at the right sidebar
2. Click "Create Paywall" button
3. Configure paywall:
   - **Active**: Toggle ON ✅
   - **Amount**: 500 (= $5.00)
   - **Description**: "One-time museum access fee"
   - **Starts At**: Now
   - **Ends At**: Tomorrow (or 1 week from now)
4. Click "Save Paywall"
5. You should see the paywall info displayed on the sidebar ✅

---

### Part 3: Test Visitor Experience (Visitor Perspective)

#### Step 5: Open Incognito/Private Window
**Important**: Open a new incognito/private browser window to simulate a real visitor

#### Step 6: Visit the Agent Landing Page
1. Go to: `http://localhost:3000/visitor/museum-guide-bot`
   (Use your agent's slug from Step 3)
2. You should see:
   - ✅ The Art Deco background image
   - ✅ Agent title
   - ✅ "Talk with Museum Guide Bot" text
   - ✅ "Start Conversation" button
   - ✅ "Scan another QR" button at bottom

#### Step 7: Test Paywall Flow
1. Click "Start Conversation" button
2. **You should be blocked by the paywall screen** showing:
   - ✅ "Access Required" title
   - ✅ Price: "USD $5.00"
   - ✅ "Pay & Continue" button
   - ✅ Organization name

#### Step 8: Test Stripe Checkout (Test Payment)
1. Click "Pay & Continue"
2. **You'll be redirected to Stripe Checkout** ✅
3. Use Stripe test card:
   - **Card Number**: `4242 4242 4242 4242`
   - **Expiry**: Any future date (e.g., 12/34)
   - **CVC**: Any 3 digits (e.g., 123)
   - **Name**: Any name
   - **Email**: Any email
4. Click "Pay"
5. **You should be redirected back to your app** ✅
6. You should see "Payment Successful!" message
7. After 2 seconds, you'll be redirected back to the agent page

#### Step 9: Test Conversation (After Payment)
1. Back on the agent page, click "Start Conversation" again
2. **This time, paywall should NOT appear** ✅
3. You should see the conversation overlay with ElevenLabs voice interface
4. Test talking with the agent

---

### Part 4: Verify Everything Works

#### Step 10: Check Payment in Stripe Dashboard
1. Go to https://dashboard.stripe.com/test/payments
2. You should see your $5.00 test payment ✅

#### Step 11: Check Database Records
1. Go to http://localhost:3000/api/debug/db-check
2. Verify:
   ```json
   {
     "tables": {
       "visitor_payments": {
         "exists": true,
         "sampleCount": 1  // ✅ Should be 1 after payment
       },
       "visitor_sessions": {
         "exists": true,
         "sampleCount": 1  // ✅ Should be 1 after conversation
       }
     }
   }
   ```

#### Step 12: Test Paywall Expiration
1. In Supabase SQL Editor, check your payment:
   ```sql
   SELECT * FROM visitor_payments ORDER BY created_at DESC LIMIT 1;
   ```
2. Verify `expires_at` is 30 days from now
3. To test expiration, you can manually update:
   ```sql
   UPDATE visitor_payments
   SET expires_at = NOW() - INTERVAL '1 day'
   WHERE visitor_id = 'YOUR_VISITOR_ID';
   ```
4. Refresh visitor page - paywall should appear again ✅

---

## Testing Multiple Agents

#### Step 13: Create Another Agent
1. Go back to `/exhibits` as owner
2. Create a second agent (e.g., "Art History Expert")
3. Publish it
4. **In the incognito window**, visit the new agent's URL
5. **Paywall should NOT appear** (same visitor already paid) ✅

This tests that the paywall is **organization-wide**, not per-agent!

---

## Testing Scenarios Summary

| Test | Expected Result | Status |
|------|----------------|--------|
| Create agent | Agent saved with generated landing page | ✅ |
| Publish agent | Status changes to "published" | ✅ |
| Generate landing page | Art Deco image appears | ✅ |
| Create paywall | Paywall saved and displayed | ✅ |
| Visit agent (unpaid) | Paywall blocks access | ✅ |
| Make test payment | Stripe checkout → Success page | ✅ |
| Visit agent (paid) | Conversation starts immediately | ✅ |
| Visit another agent (same org) | No paywall (already paid) | ✅ |
| Payment expires | Paywall appears again | ✅ |

---

## Troubleshooting

### Issue: "Payment required" even after paying
**Fix**: Clear localStorage in incognito window and try with a different `visitor_id`

### Issue: Stripe checkout fails
**Fix**: Make sure you're using TEST keys (`pk_test_` and `sk_test_`)

### Issue: Landing page is blank
**Fix**: Check console for errors. Regenerate landing page if needed.

### Issue: Voice doesn't work
**Fix**: Make sure `ELEVENLABS_API_KEY` is set in `.env.local`

---

## Next Steps: Production Deployment

When ready for production:
1. Uncomment LIVE Stripe keys in `.env.local`
2. Update `NEXT_PUBLIC_BASE_URL` to your production domain
3. Test once more with real card (small amount)
4. Monitor payments in Stripe Dashboard (live mode)

---

## Quick Test Commands

```bash
# Restart dev server (after env changes)
npm run dev

# Check database tables
curl http://localhost:3000/api/debug/db-check

# Clear visitor localStorage (in browser console)
localStorage.clear()
```

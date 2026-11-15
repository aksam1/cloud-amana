# Sending real emails through Instantly

Do this only after the dry run looks right (README, Phase 5).

> **Not yet tested with a real Instantly account.** The connection was written without access to
> Instantly's documentation. Follow step 6 and send one test to yourself before turning on automation.

## Before you start

1. **3 to 5 separate sending domains**, not your main one, each with an inbox connected to Instantly.
2. **Warm each inbox up for 2 to 3 weeks** in Instantly before sending anything.
3. **The app is online** at a public address, with `PUBLIC_BASE_URL` and `ADMIN_PASSWORD` set in `.env`.
   The preview and unsubscribe links in your emails start with that address.

## Steps

1. **Create a campaign** in Instantly and connect your warmed-up inboxes to it.

2. **Add step 1 (the first email).** Copy the subject and body from the app's Settings page. The
   `{{...}}` placeholders should work in Instantly as they are, because the app sends each one along with
   the lead as a custom variable. Step 6 checks that they fill in.

3. **Add step 2 (the follow-up)**, set to send **4 days** after step 1. Copy the follow-up subject and body.
   Add no further steps: one follow-up, then stop.

4. **In the campaign's options**, turn on "stop sending when the lead replies", and set the daily
   sending limit to 30 to 50 per inbox.

5. **Put these in `.env`**, then restart the app:

   ```
   OUTREACH_PROVIDER=instantly
   INSTANTLY_API_KEY=your key from Instantly (Settings, then Integrations, then API)
   INSTANTLY_CAMPAIGN_ID=the id of the campaign (it is in the campaign's web address)
   ```

6. **Send one test to yourself.**
   1. Add a lead by hand with your own email address.
   2. On its page click **Mark email as verified**, then **Build preview**, then **Send offer email**.
   3. Check that the lead appears in your Instantly campaign and the email arrives.
   4. Check that the preview link and the unsubscribe link in the email both open.
   5. Reply to it, then click **Run now** next to "Read replies" and check the reply shows on the lead.

   If any of these fail, the error appears under **Recent runs** on the Automation page. Share that
   message with Claude Code and ask it to fix the Instantly connection in
   `backend/app/services/outreach.py` and `replies.py`.

7. **Turn on automation.** On the Automation page, tick **Run daily** for "Send emails" and "Read replies".

## How the pieces fit

- The app decides **who** gets emailed and **when**: verified email, preview built, daily limit, never
  an unsubscribed address. It then adds that lead to your Instantly campaign.
- Instantly does the actual **sending**, including the follow-up 4 days later.
- When someone uses the unsubscribe link, the app marks them Unsubscribed for good and asks Instantly
  to block the address.
- The app's record of the follow-up is by the calendar (4 days after the first email). The follow-up
  email itself is sent by Instantly's step 2.

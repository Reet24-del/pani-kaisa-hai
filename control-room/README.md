# Control Room (Sanity App SDK)

The verifier's queue, running inside the Sanity Dashboard. Live by default — a
new case appears without a refresh, because the App SDK subscribes rather than
polls.

```bash
cd control-room
npm install
SANITY_STUDIO_PROJECT_ID=<your project id> npx sanity app dev
npx sanity app deploy   # publishes it to the Dashboard
```

## What it does

- Lists cases at `needsVerification`, worst score first, with every report and
  reading behind them.
- Shows the AI summary in a box that says it was written by the AI check.
- **Confirm**, **Dismiss** and **Ask for a test**, each requiring a written
  reason of at least 10 characters.
- Confirming writes the case decision and the alert in **one transaction**, with
  the signed-in verifier named on both.

## The rule

A person's Sanity account has to exist as a `contact` with `canVerify: true`,
matched on e-mail. Anyone else gets the queue read-only. The AI check can move a
case up to `needsVerification` and no further — see
`../sanity/workflows/waterCase.ts`, where that boundary is a role gate on the
decide activity rather than a comment.

The same queue exists at `/control` in the Next.js app for people (and judges)
without a Sanity login. Both surfaces write the same fields.

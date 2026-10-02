#!/usr/bin/env bash
# Creates a fresh Sanity Editor token and hands it straight to Vercel and
# .env.local. The key is never printed or put on the clipboard.
set -euo pipefail
cd "$(dirname "$0")/.."

PROJECT_ID=ya4g5th1
SCOPE=reet2402singh-2812s-projects
LABEL="vercel-write-$(date +%Y%m%d-%H%M)"

echo "1/5  Checking logins (a browser may open)..."
npx --yes sanity projects list >/dev/null 2>&1 || npx --yes sanity login
npx --yes vercel whoami >/dev/null 2>&1 || npx --yes vercel login

echo "2/5  Linking this folder to the Vercel project..."
npx --yes vercel link --yes --project pani-kaisa-hai --scope "$SCOPE" >/dev/null

echo "3/5  Creating Sanity token $LABEL..."
KEY=$(npx --yes sanity tokens add "$LABEL" --role=editor --project-id "$PROJECT_ID" --json --yes \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const j=JSON.parse(s);process.stdout.write(j.key||j.token||"")})')
if [[ -z "$KEY" || "$KEY" != sk* ]]; then echo "Could not read the new token from the Sanity CLI." >&2; exit 1; fi

echo "4/5  Saving it to Vercel and .env.local..."
npx --yes vercel env rm SANITY_API_WRITE_TOKEN production --yes --scope "$SCOPE" >/dev/null 2>&1 || true
printf '%s' "$KEY" | npx --yes vercel env add SANITY_API_WRITE_TOKEN production --scope "$SCOPE" >/dev/null
if grep -q '^SANITY_API_WRITE_TOKEN=' .env.local 2>/dev/null; then
  KEY="$KEY" node -e 'const f=".env.local",fs=require("fs");fs.writeFileSync(f,fs.readFileSync(f,"utf8").replace(/^SANITY_API_WRITE_TOKEN=.*$/m,"SANITY_API_WRITE_TOKEN="+process.env.KEY))'
else
  printf '\nSANITY_API_WRITE_TOKEN=%s\n' "$KEY" >> .env.local
fi
unset KEY

echo "5/5  Redeploying production..."
npx --yes vercel redeploy "$(npx --yes vercel ls pani-kaisa-hai --prod --scope "$SCOPE" 2>/dev/null | grep -o "https://[^ ]*vercel.app" | head -1)" --scope "$SCOPE" >/dev/null
echo "Done. Token $LABEL is live. You can delete the old vercel-write tokens in Sanity → API → Tokens."

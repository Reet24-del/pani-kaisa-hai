# Demo video shot list (60 to 90 seconds)

Record at phone width (or a narrow browser window). Before recording, make sure the
write token is set in Vercel and run the demo story once so there is a case waiting:

```bash
BASE=https://pani-kaisa-hai.vercel.app AREA=sector-14 node --env-file=.env.local scripts/demo-story.mjs
```

| # | Time | Screen | What to show | Voiceover (optional) |
|---|------|--------|--------------|----------------------|
| 1 | 0:00 | `/` hero | The stall, the girl pouring, "is this pani clean?" | "Everyone asks this at a golgappa stall. Nobody asks it about their tap." |
| 2 | 0:08 | `/` map | Ten golgappas, Sector 14 now Soggy | "Every neighbourhood is a golgappa." |
| 3 | 0:15 | `/report` | Pick Ward 22, tick Smell, Tap, 1 person ill, submit | "Reporting takes under a minute. No sign-up." |
| 4 | 0:30 | `/` Shake the golgappa | Press + until it goes Soggy, point at the locked "Health worker confirms" | "Signals can make it soggy on their own. They can never make it burst." |
| 5 | 0:42 | `/control` | Sign in with `pani-demo`, open the Sector 14 case, show the evidence, confirm with a reason | "Only a named person can confirm." |
| 6 | 0:58 | `/area/sector-14` | Phoot gaya, "Do not drink the tap water", confirmed by, reason | "Now the whole area is warned, with the reason and who decided." |
| 7 | 1:08 | `/studio` | The case and alert documents, the reading drawn against its IS 10500 limit | "Limits are content, so a wrong number is a content fix." |
| 8 | 1:18 | End card | Live URL + repo | |

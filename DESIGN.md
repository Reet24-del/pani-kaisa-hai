# DESIGN.md — Pani Kaisa Hai?

UI design system and screen specs. Companion to the PRD.
Status: v0.1 · 20 Sep 2026

---

## 1. Design principles

1. **Serious core, playful face.** The golgappa is the way in; the moment a warning is on screen, the tone is calm and factual. Never a joke on an alert screen.
2. **Built for a cheap Android phone in daylight.** High contrast, large text, big tap targets, few images, works on a slow connection.
3. **Say what to do, not what happened.** "Boil water for 1 minute before drinking" beats "Water quality anomaly detected".
4. **Every state explains itself.** A golgappa is never just a colour: it always has a reason line next to it.
5. **Never colour alone.** Each state has a distinct *shape* and a text label, so it works for colour-blind users and in bright sun.
6. **Hindi is a first-class language, not a translation afterthought.** Every string has room for Devanagari, which needs more line height.

---

## 2. Brand basics

| Element | Decision |
|---|---|
| Product name | **Pani Kaisa Hai?** (Hindi: पानी कैसा है?) |
| One-liner | "Is the water in your area safe today?" |
| Logo | The crisp golgappa glyph (§5) + wordmark, left-aligned |
| Tone | Neighbourly, plain, never alarmist, never cute during an alert |

---

## 3. Colour

Two grounds (light/dark) plus four **state colours** that are semantic and never used for decoration.

### Tokens

```css
:root {
  /* Ground + ink — a faint mint tint, not pure grey */
  --ground:      #F2F6F2;
  --surface:     #FFFFFF;
  --surface-alt: #E9F0EA;
  --ink:         #14231B;
  --muted:       #56665D;
  --rule:        #D5E0D7;
  --rule-strong: #B4C6B9;

  /* Brand */
  --accent:      #8A5714;  /* toasted puri — links, focus, primary text button */
  --accent-soft: #F3E5CC;
  --pani:        #2D7852;  /* the water */
  --pani-soft:   #DFEFE5;

  /* Golgappa glyph */
  --puri:        #E2B15B;
  --puri-soggy:  #C39650;
  --puri-edge:   #9A6A24;
  --puri-hole:   #5A3910;

  /* State — semantic only */
  --ok:    #2A7F4B;  --ok-soft:    #E1F1E6;  /* Crisp */
  --watch: #9C6C00;  --watch-soft: #FAEFD3;  /* Soggy */
  --bad:   #B8362A;  --bad-soft:   #FAE2DE;  /* Phoot gaya */
  --fresh: #23709B;  --fresh-soft: #DDEDF6;  /* Fresh batch */
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --ground:#0E1612; --surface:#15201A; --surface-alt:#1B2721;
    --ink:#E3ECE5; --muted:#9AADA1; --rule:#243229; --rule-strong:#36493D;
    --accent:#E3AA55; --accent-soft:#2A2114;
    --pani:#71C49B;  --pani-soft:#14281D;
    --puri:#D7A44D; --puri-soggy:#A9823F; --puri-edge:#F0C57C; --puri-hole:#3A2407;
    --ok:#5DC381;  --ok-soft:#15281C;
    --watch:#E8B640; --watch-soft:#2B2310;
    --bad:#F07467; --bad-soft:#321814;
    --fresh:#62B3E1; --fresh-soft:#122532;
  }
}
:root[data-theme="dark"] { /* same overrides as above */ }
```

**Rules**
- State colours are reserved for state. Never use `--bad` for a delete button or `--ok` for a success toast on an unrelated action.
- Body always paints `background: var(--ground)`.
- Minimum contrast: **4.5:1** for text, **3:1** for icons and borders. Check `--watch` on `--watch-soft` — darken the text, not the background, if it fails.

---

## 4. Typography

Every face supports Latin **and** Devanagari, so Hindi never falls back to a system font.

| Role | Face | Usage |
|---|---|---|
| Display | **Baloo 2** (600/700) | Section titles, state names, the wordmark. |
| Signboard | **Rozha One** | The hero question only, and the huge painted पानी behind it — the hand-painted stall sign. |
| Chalk | **Kalam** (400/700) | The chalkboard menu only. |
| Body / UI | **Hind** (400/600) | Everything else. Designed for Indian-language UIs. |
| Data | **IBM Plex Mono** (400/500) | Readings, scores, the LED ticker. Always `tabular-nums`. |

Rozha and Kalam are *props*, not system fonts: each belongs to one object on the landing page (the sign, the board) and nowhere else.

```
Scale (rem)   0.75  0.875  1  1.125  1.375  1.75  2.25
Use           meta  small  body  lead  h3    h2    h1
Line height   1.45 for Latin body · 1.65 when the string contains Devanagari
Measure       60–70 characters max for reading text
```

Uppercase labels get `letter-spacing: .07em`. Never uppercase Devanagari.

### The stall (landing page only)

The landing page is dressed as a golgappa thela; the working screens (report, area, control room) are not.

- **Awning** — 28px saffron/cream stripes, a scalloped hem, a string of bunting. CSS only.
- **Signboard** — the hero question in Rozha One, with पानी painted huge and faint on the wall behind it.
- **LED ticker** — every area's live state scrolling past, amber on near-black, state words glowing in their own colour. Pauses on hover and under reduced motion.
- **Chalkboard menu** — the four states on slate in a wooden frame, with a dotted leader to the action, the way a stall lists prices.
- **Shake the golgappa** — the real `scoreReports` running on made-up signals. It turns soggy on its own; it never turns red without the "health worker confirms" button.

## 5. The golgappa glyph system

One SVG component, four states, drawn on a 40×40 viewBox. **Shape carries the meaning; colour reinforces it.**

| State | Shape | Extra marks | Tint |
|---|---|---|---|
| Crisp | Full circle, r=14 | Hole on top, shine arc | `--puri` |
| Soggy | Squashed dome (flat, wider) | One green drip below | `--puri-soggy` |
| Phoot gaya | Circle + jagged crack across it | 3 splash droplets | `--puri` + dark crack |
| Fresh batch | Circle + hole | 2 small sparkles | `--puri` + `--fresh` sparkles |

**Sizes:** 20px (inline in text), 28px (list rows), 40px (cards), 56px (map pin), 96px (area page hero).

**Rules**
- Always paired with its label text. The glyph alone is never the only indicator.
- `aria-hidden="true"` on the SVG; the label carries the meaning for screen readers.
- Fills come from CSS classes, not `fill="var(...)"` attributes (presentation attributes don't reliably read variables).
- Animation: only on state change — a 240ms scale from 0.9 to 1 with a soft ease. Nothing loops. All of it is disabled under `prefers-reduced-motion: reduce`.

---

## 6. Layout, spacing, shape

```
Spacing scale (px):  4  8  12  16  24  32  48  64
Radius:              6 (chips, inputs) · 12 (cards, sheets) · 999 (pills)
Border:              1px solid var(--rule); 1.5px for inputs
Elevation:           Only two levels —
                     sheet/modal: 0 8px 32px rgba(0,0,0,.16)
                     map pin:     0 2px 6px  rgba(0,0,0,.2)
                     Cards use a border, not a shadow.
Side gutter:         16px on phones, up to 32px on desktop, never less than 16px
Breakpoints:         phone <600 · tablet 600–1023 · desktop ≥1024
Tap target:          44×44px minimum, 12px minimum gap between targets
```

Not everything is a card. Use a card only for a self-contained object (an area, a case, a report). Lists of facts are rows with rules between them.

---

## 7. Components

### Button
| Variant | Use | Style |
|---|---|---|
| Primary | Submit report, Confirm | Filled `--ink` (light) / `--accent`, 48px tall, radius 6 |
| Danger-confirm | Confirm contamination | Filled `--bad`, requires a typed reason before it enables |
| Secondary | Dismiss, Cancel | 1.5px border `--rule-strong`, transparent fill |
| Quiet | Back, Skip | Text only, `--muted`, underline on hover |

Labels are verbs and name the exact outcome: *Send report*, *Confirm contamination*, *Mark resolved*. The toast afterwards uses the past tense of the same verb.

### State chip
Pill · glyph (20px) + state name + optional reason. Background is the state's `-soft` token, text is the state token.

### Field
Label above (never a placeholder as a label), 48px control, 1.5px border, radius 6. Error text sits below in `--bad` and says how to fix it. Optional fields are marked "optional", not required ones marked with `*`.

### Choice grid (the report form's main control)
2-column grid of large toggle cards, each with an icon and a one-word label ("Smell", "Colour", "Taste", "Particles"). 64px tall, whole card is the tap target, selected state = 2px `--ink` border + `--accent-soft` fill. Multi-select.

### Reading row
`Parameter · value (mono, tabular) · gauge bar · verdict chip`. The gauge bar shows the acceptable band in `--ok-soft`, the permissible band in `--watch-soft`, and the reading as a 3px vertical marker in `--ink`.

### Evidence row (Control Room)
`time (mono) · signs · illness count · distance from area centre · device badge`. Duplicate-suspected rows are dimmed to 60% with a "possible duplicate" chip.

### Alert banner
Full-width, `--bad-soft` background, ink text, glyph on the left, action link on the right. Sticky at the top of an affected area page. Never dismissable while the alert is active.

### Map pin
56px golgappa glyph with a 2px `--surface` outline and the pin shadow. Cluster pins show a count in mono. Tapping opens the area sheet.

---

## 8. Screens

### 8.1 Public — Map home
```
┌────────────────────────────────┐
│ ⌂ Pani Kaisa Hai?      [हिं/EN]│  ← 56px bar, wordmark + language toggle
├────────────────────────────────┤
│                                │
│        [map with golgappa      │  ← fills the screen, OSM tiles
│         pins, user location]   │
│                                │
├────────────────────────────────┤
│ ▲ Sample data — demo build     │  ← thin notice strip during the challenge
├────────────────────────────────┤
│  Your area: Sector 14   SOGGY  │  ← bottom sheet, peeks at 120px
│  5 reports in 48 h             │
│  Boil water for 1 minute.      │
│  [ Report a problem ]          │  ← primary, thumb-reachable
└────────────────────────────────┘
```
Location permission is asked **after** the map loads, with a plain reason ("to show your area first"). Denying it shows a search field instead — never a dead end.

### 8.2 Public — Report flow
Four short steps, one question per screen, a progress dots row at the top, and a persistent Back. Target: under 60 seconds, 6 taps minimum.

1. **Where?** Detected area confirmed by name, with "Not here? Pick on map".
2. **What did you notice?** Choice grid (smell / colour / taste / particles) + source type.
3. **Anyone sick?** None / how many people. One tap for "No".
4. **Anything else?** *(skippable)* photo, test readings, private contact.

Then: **Send report** → success screen showing the area's current golgappa, what happens next ("a health worker sees this if more reports come in"), and the precautions. No account, no email required.

Slow network: the button shows a spinner and the form survives a reload (values kept in `sessionStorage`, wrapped in try/catch).

### 8.3 Public — Area page
```
[96px glyph]  Sector 14 · SOGGY since 2 days
              5 reports in 48 h · 1 reading above limit

WHAT TO DO          ← advice for this state, 2 bullets max
WHY                 ← the reason, in one sentence + "How this is decided" link
REPORTS (14 days)   ← anonymised rows: date · signs · illness count
WATER SOURCE        ← shown only once a case is confirmed
[ Report a problem ]
```

### 8.4 Control Room (App SDK) — Queue
Two panes on desktop, stacked on tablet.
```
┌─ NEEDS VERIFICATION (3) ──┬─ CASE · Sector 14 ───────────┐
│ ● Sector 14   score 7  2m │  map · 5 reports · readings  │
│   Sector 9    score 6 18m │  AI summary (labelled AI)    │
│   Ward 22     score 6  1h │  suspected source: Pipeline 7│
│                           │  ┌ Reason (required) ──────┐ │
│ WATCH (5)          ▸      │  └──────────────────────────┘ │
│ ACTIVE ALERTS (1)  ▸      │  [Confirm] [Dismiss] [Test]  │
└───────────────────────────┴──────────────────────────────┘
```
- New cases slide in at the top with a 1s highlight, no reordering jump while a case is open.
- A claimed case shows "Held by Asha D. · 4m" and its buttons are disabled for everyone else.
- The AI summary always sits inside a labelled box: "Written by the AI check — verify before acting."
- Confirm is a danger-confirm button: disabled until a reason of 10+ characters is typed.

### 8.5 Studio customisations
- **Reading gauge input** — the reading row from §7, live as you type.
- **State badge** on `area` documents, in the document header.
- **Structure**: desks for *Needs verification*, *Active alerts*, *Unmapped reports*, *Areas by state*.

---

## 9. Voice and copy

| Situation | Write | Don't write |
|---|---|---|
| Soggy state | "Complaints are rising. Boil water for 1 minute before drinking." | "Potential water quality degradation detected." |
| Confirmed | "Contamination confirmed on 21 Sep. Do not drink tap water. Use boiled or packaged water." | "ALERT!!! Water is dangerous!" |
| Empty queue | "Nothing to verify right now." | "No data available." |
| Form error | "Pick at least one thing you noticed." | "Invalid input." |
| Rate limited | "You've already sent 3 reports for this area today. A health worker is looking at them." | "429: too many requests." |

Every public page carries, in small text: **"Early warning from residents, not a lab test."**

---

## 10. Accessibility checklist

- [ ] Text contrast ≥ 4.5:1, icons and borders ≥ 3:1, in both themes.
- [ ] Every state readable without colour (shape + label).
- [ ] Tap targets ≥ 44px with ≥ 12px gaps.
- [ ] Visible focus ring: 2px `--accent`, 3px offset, on every interactive element.
- [ ] Form labels tied to inputs with `for`/`id`; errors linked via `aria-describedby`.
- [ ] Map has a list-view alternative ("Areas near you") — a map alone is not accessible.
- [ ] Live queue updates announced with `aria-live="polite"`, not on every keystroke.
- [ ] All motion disabled under `prefers-reduced-motion`.
- [ ] Page works at 200% browser zoom with no horizontal scroll.

---

## 11. Performance budget (low-end Android, 3G)

| Budget | Target |
|---|---|
| First screen JS | < 120 KB gzipped |
| Map library | Loaded lazily, only on the map route |
| Fonts | 2 families, `display=swap`, Latin + Devanagari subsets only |
| Images | Photos served at ≤ 800px wide via Sanity's image CDN, `loading="lazy"` |
| Report submit | Works on a 2 Mbps connection in under 3 seconds |

---

## 12. Do / Don't

**Do**
- Show the reason next to every state.
- Keep the primary action in the bottom third of a phone screen.
- Label anything the AI wrote.

**Don't**
- Don't animate golgappas for fun; motion means a state changed.
- Don't put a joke on an alert screen.
- Don't show a suspected water source publicly before a verifier confirms it.
- Don't use red for anything that isn't confirmed contamination.

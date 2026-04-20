

## Compact Game Code Layout + Question Language Description

### What changes

**1. Waiting Room — compact code/QR area**

Restructure the code section to match the uploaded mockup:

```text
┌─────────────────────────────┬──────────┐
│  [ TRXUF7  📋 ]             │  ▓▓▓▓▓   │
│   Tap to copy               │  ▓ QR ▓  │
│                             │  ▓▓▓▓▓   │
│  [ 🔗 Share join link ]     │ Scan to  │
│                             │  join    │
└─────────────────────────────┴──────────┘
```

- Remove the standalone "GAME CODE" label above the row.
- Two-column layout: left column stacks the purple code button + "Tap to copy" hint, then the outlined "Share join link" button directly below. Right column keeps QR + "Scan to join".
- Tighten vertical spacing (`gap-3` instead of `gap-5`) so the whole block is denser.
- Keep existing colors, fonts, and button styles — purely structural.

**2. Question language descriptive text**

Currently the language shows only as `🇬🇧 English` next to the players header. Make it more descriptive with a dedicated row above the players list:

```text
🇬🇧  Questions will be in English
```

- Use a small pill/badge styled row with the flag + a sentence like "Questions will be in English" / "Sorular İngilizce olacak".
- Add new i18n keys:
  - `questionsWillBeIn`: `"Questions will be in {lang}"` / `"Sorular {lang} dilinde olacak"`
  - Reuse existing `langEnglish` / `langTurkish` for the language name interpolation.
- Remove the small inline language indicator from the players header row (now redundant).

### Files touched

- `src/components/game/WaitingRoom.tsx` — restructure the code/QR/share block; add language description row above players list.
- `src/i18n/en.ts` and `src/i18n/tr.ts` — add `questionsWillBeIn` key.

### Out of scope

- No changes to game logic, realtime, or QR generation behavior.
- No font, color, or theme changes.


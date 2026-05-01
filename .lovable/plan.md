## Incremental Score & Reorder Animation (Interim Leaderboard)

Change the round-end leaderboard so each player's score reads:
**previous total → previous total +earned → new total** (animated count-up from previous, not from 0), then the `+earned` chip disappears and rows smoothly reorder if rankings changed.

This applies to the per-round `InterimLeaderboard` only. The end-of-game `FinalLeaderboard` (one-time reveal) stays as-is.

### Visual / timing flow per row

```text
t = 0.0s   Render: 1,250                    (rows in OLD order = previous-score order)
t = 0.3s   Render: 1,250  +750              (chip fades/scales in, accent color)
t = 0.6s   Animate count-up 1,250 → 2,000   (~1.0s, ease-out, NEVER from 0)
t = 1.6s   Chip fades out, leaving: 2,000
t = 1.9s   Rows reorder to new ranking      (Framer Motion layout transition)
```

Stagger between rows stays (~80ms) so higher-ranked players animate slightly earlier.

### How "previous score" is captured

Players come from Supabase already containing the new total when we enter the `leaderboard` phase. We need the totals from BEFORE this round to compute `earned = newTotal - previousTotal`.

In `src/context/GameContext.tsx`, in the `leaderboard` phase branch (currently lines 239–243):
1. Read the current `players` from the store (these still hold the previous-round totals because `getGamePlayers` hasn't been called yet for this transition).
2. Build `previousScores: Record<playerId, number>` from them.
3. Then fetch fresh players (new totals) and set them.
4. Store `previousScores` on the game store so `InterimLeaderboard` can read it.

If a player has no previous entry (edge case: joined mid-game), treat previous as `0` so earned = newTotal.

### Component changes (`InterimLeaderboard.tsx`)

- Sort rows in TWO stages:
  - Initial render: sort by **previous score** so the starting order matches what players just saw.
  - After the count-up completes (single timer ~1.6s after mount), switch to sorting by **new score**.
- Wrap each row in `motion.div` with a stable `layout` prop and a `key={player.id}`. Framer Motion's `layout` animation handles the smooth reorder when the sorted array changes.
- Replace `AnimatedScore` so it counts from `previousScore` to `newScore` (not from 0):
  - Uses a new `useCountUp` overload (or inline RAF) that accepts a `from` value.
  - Renders the count-up number plus, for the duration `[300ms .. 1600ms]`, a `+earned` chip next to it. Chip uses `text-accent` (or `text-primary` with a subtle background) and `animate-scale-in` on enter / fade out on exit via `AnimatePresence`.
  - Hide the chip entirely when `earned === 0`.
- Medal/rank badges (🥇🥈🥉, 4, 5…) update together with reorder so the leftmost number always reflects the current rank.

### Hook change (`src/hooks/use-count-up.ts`)

Add an optional `from` parameter (default `0`) and initialize `value` to `from` so the displayed number never flashes 0. Existing callers (FinalLeaderboard) are unaffected because the default stays `0`.

```text
useCountUp(target, duration?, delay?, from?)
```

### Store change (`src/stores/gameStore.ts`)

Add:
- `previousScores: Record<string, number>` (defaults to `{}`)
- `setPreviousScores(map)`
- Reset to `{}` in `reset()` and whenever a new question becomes active so we don't leak stale data.

### Files touched

- `src/context/GameContext.tsx` — snapshot previous scores on entering `leaderboard` phase; clear them on `question_active`.
- `src/stores/gameStore.ts` — add `previousScores` state + setter.
- `src/hooks/use-count-up.ts` — support a `from` starting value.
- `src/components/game/InterimLeaderboard.tsx` — two-stage sort, layout-animated rows, count-up from previous, transient `+earned` chip.

### Out of scope

- No backend / RPC changes.
- No changes to `FinalLeaderboard` or `RoundResult`.
- No changes to scoring formulas, sounds, or i18n strings.

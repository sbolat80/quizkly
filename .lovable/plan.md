## Confetti: stop after 5s, settle at bottom

### Current behavior
In `src/components/game/FinalLeaderboard.tsx`, `ConfettiCanvas` spawns 120 particles that fall and **wrap around** to the top forever, so confetti never stops and never accumulates.

### Desired behavior
1. New confetti stops being emitted/animated as falling rain after **5 seconds**.
2. Pieces that have already fallen come to rest at the bottom of the screen and **stay visible** (piling up like real confetti).

### Implementation

Edit `src/components/game/FinalLeaderboard.tsx` — `ConfettiCanvas` component only.

Changes to the animation loop:

- Track a `startTime` when the effect mounts. After `elapsed > 5000ms`, set a `stopped` flag — no new particles, and any particle still above the floor continues falling but is no longer recycled to the top.
- Remove the wrap-around recycle (`if (p.y > canvas.height + 20) { p.y = -10; ... }`). Replace with a "settle" rule:
  - Each particle has a target resting `y = canvas.height - floorOffset - stackJitter`, where `floorOffset` is small (e.g. 4–10px) and `stackJitter` adds 0–40px so pieces pile naturally instead of forming a flat line.
  - When `p.y >= restY`, clamp `p.y = restY`, set `p.vy = 0`, `p.vx = 0`, `p.vr = 0` (mark as `settled`), and stop rotating.
- Keep the RAF loop running so settled pieces continue to be drawn (they remain visible at the bottom). Once `stopped` is true AND every particle is `settled`, cancel the RAF (static pieces stay on the canvas — last frame persists).
- Slightly reduce vertical velocity range so the 5s window gives most pieces time to reach the floor; remaining airborne pieces will still fall to rest after the timer because we keep the loop running until all settle.
- Keep canvas `fixed inset-0 z-50 pointer-events-none` so the settled pile sits over the UI without blocking clicks. (If it visually interferes with the "New Game"/"Home" buttons, we can lower z-index to behind the action buttons — flag for review after first look.)

### Technical notes
- No new dependencies.
- Particle count stays at 120 (intensity unchanged during the 5s burst; user only complained about duration). If the user later wants it less intense, we can drop to ~70.
- Resize handler: on resize after settling, recompute each settled particle's `restY` so the pile stays glued to the new bottom edge.

### Files touched
- `src/components/game/FinalLeaderboard.tsx`

### Out of scope
- No changes to game flow, sounds, leaderboard layout, or other screens.

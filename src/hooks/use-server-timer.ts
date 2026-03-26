import { useState, useEffect, useRef } from 'react'

/**
 * Calculates remaining time based on server-provided phase_started_at.
 * Updates every 100ms for smooth countdown.
 */
export function useServerTimer(
  phaseStartedAt: string | null,
  durationSeconds: number
): number {
  const [timeLeft, setTimeLeft] = useState(durationSeconds)
  const prevPhaseRef = useRef<string | null>(null)

  useEffect(() => {
    if (!phaseStartedAt) {
      setTimeLeft(durationSeconds)
      return
    }

    // When phase changes, immediately compute remaining time
    prevPhaseRef.current = phaseStartedAt

    const endTime = new Date(phaseStartedAt).getTime() + durationSeconds * 1000

    const tick = () => {
      const remaining = Math.max(0, (endTime - Date.now()) / 1000)
      setTimeLeft(remaining)
    }

    tick()
    const interval = setInterval(tick, 100)

    return () => clearInterval(interval)
  }, [phaseStartedAt, durationSeconds])

  return timeLeft
}

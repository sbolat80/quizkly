import { useState, useEffect, useRef } from 'react'

export function useServerTimer(
  phaseStartedAt: string | null,
  duration: number
): number {
  const [timeLeft, setTimeLeft] = useState(duration)
  const prevPhaseStartedAt = useRef<string | null>(null)
  const isFrozen = useRef(false)

  useEffect(() => {
    if (!phaseStartedAt) {
      setTimeLeft(duration)
      return
    }

    // Phase değişti mi kontrol et
    if (prevPhaseStartedAt.current !== phaseStartedAt) {
      // Yeni phase geldi
      if (prevPhaseStartedAt.current !== null) {
        isFrozen.current = true
        setTimeLeft(0)
        prevPhaseStartedAt.current = phaseStartedAt

        const unfreezeTimer = setTimeout(() => {
          isFrozen.current = false
          prevPhaseStartedAt.current = phaseStartedAt
        }, 500)

        return () => clearTimeout(unfreezeTimer)
      }

      prevPhaseStartedAt.current = phaseStartedAt
    }

    if (isFrozen.current) return

    const tick = () => {
      if (isFrozen.current) return
      const now = Date.now()
      const start = new Date(phaseStartedAt).getTime()
      const elapsed = Math.max(0, (now - start) / 1000)
      const remaining = Math.max(0, duration - elapsed)
      setTimeLeft(remaining)
    }

    tick()

    const interval = setInterval(tick, 1000)

    return () => clearInterval(interval)
  }, [phaseStartedAt, duration])

  return timeLeft
}

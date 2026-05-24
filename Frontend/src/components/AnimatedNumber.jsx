import React, { useEffect, useRef, useState } from 'react'

export default function AnimatedNumber({ value, duration = 600, format }){
  const [display, setDisplay] = useState(value ?? 0)
  const rafRef = useRef(null)
  const startRef = useRef(null)
  const fromRef = useRef(value ?? 0)

  useEffect(() => {
    if (value == null) {
      setDisplay('—')
      return
    }

    const from = Number(fromRef.current) || 0
    const to = Number(value) || 0
    const diff = to - from
    const start = performance.now()
    startRef.current = start

    const step = (now) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = t < 0.5 ? 2*t*t : -1 + (4 - 2*t)*t // easeInOutQuad-ish
      const current = from + diff * eased
      setDisplay(Math.round(current))
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step)
      } else {
        fromRef.current = to
        rafRef.current = null
      }
    }

    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(step)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [value, duration])

  if (display === '—') return <span>—</span>

  const out = typeof format === 'function' ? format(display) : display
  return <span>{out}</span>
}

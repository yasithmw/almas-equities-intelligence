'use client'

import { useEffect, useRef, useState } from 'react'

const MS_PER_CHAR = 18

export function useTypewriter() {
  const [value, setValue] = useState('')
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => () => { if (timer.current) clearInterval(timer.current) }, [])

  function type(text: string, onDone: () => void) {
    if (timer.current) clearInterval(timer.current)
    let i = 0
    timer.current = setInterval(() => {
      i += 1
      setValue(text.slice(0, i))
      if (i >= text.length) {
        clearInterval(timer.current!)
        timer.current = null
        onDone()
      }
    }, MS_PER_CHAR)
  }

  return { value, setValue, type }
}

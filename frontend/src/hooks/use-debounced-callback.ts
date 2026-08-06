import { useEffect, useMemo, useRef } from 'react'

export function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delayMs: number
): (...args: Args) => void {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    },
    []
  )

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  return useMemo(() => {
    return (...args: Args) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => callbackRef.current(...args), delayMs)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delayMs])
}

/** Current local time formatted for a native `datetime-local` input value. */
export function nowLocalIso(): string {
  return toDatetimeLocalValue(new Date().toISOString())
}

/** Converts a stored ISO datetime string into a local `datetime-local` input value (`YYYY-MM-DDTHH:mm`). */
export function toDatetimeLocalValue(iso: string): string {
  const date = new Date(iso)
  const offsetMs = date.getTimezoneOffset() * 60_000
  const local = new Date(date.getTime() - offsetMs)
  return local.toISOString().slice(0, 16)
}

// Append-with-cap helper shared across sensor adapters.
// Replaces the [...prev, ...new].slice(-N) pattern that allocates 2× the buffer
// every call and produces heavy GC pressure under frame-paced ingest (~60 calls/sec).
export function appendCap<T>(prev: T[], add: T[], cap: number): T[] {
  if (add.length === 0) return prev
  const total = prev.length + add.length
  if (total <= cap) return prev.concat(add)
  if (add.length >= cap) return add.slice(-cap)
  const keep = cap - add.length
  const out = new Array<T>(cap)
  for (let i = 0; i < keep; i++) out[i] = prev[prev.length - keep + i]
  for (let i = 0; i < add.length; i++) out[keep + i] = add[i]
  return out
}

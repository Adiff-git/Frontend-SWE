import { useEffect, useRef } from 'react';

// Keep drafts in module memory across BrowserRouter Back/Forward navigation.
// No customer data or drafts are written into URLs or browser storage.
const drafts = new Map();
let generation = 0;
export function readDraft(key) { return drafts.get(key); }
export function resetDrafts() { drafts.clear(); generation += 1; }
export function clearDraft(key) { drafts.delete(key); }
export default function useDraftNavigation(key, value, dirty, discard) {
  const latest = useRef({ value, dirty });
  useEffect(() => { latest.current = { value, dirty }; }, [value, dirty]);
  useEffect(() => { const started = generation; const cancellation = discard; return () => {
    if (started !== generation) return;
    if (latest.current.dirty && !cancellation.current) drafts.set(key, structuredClone(latest.current.value));
    else drafts.delete(key);
  }; }, [key, discard]);
}

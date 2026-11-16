import { useSearchParams } from 'react-router-dom';
export function useListState() {
  const [params, setParams] = useSearchParams();
  const update = (key, value) => setParams(previous => { const next = new URLSearchParams(previous); if (value) next.set(key, String(value)); else next.delete(key); if (key !== 'page') next.delete('page'); return next; }, { replace: true });
  const size = [10, 25, 50].includes(Number(params.get('size'))) ? Number(params.get('size')) : 10;
  const updateMany = values => { const next = new URLSearchParams(params); Object.entries(values).forEach(([key, value]) => next.set(key, String(value))); next.delete('page'); setParams(next, { replace: true }); };
  return { params, update, updateMany, size, requestedPage: Math.max(1, Number.parseInt(params.get('page'), 10) || 1), clear: () => setParams({}, { replace: true }) };
}

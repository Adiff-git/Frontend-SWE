// src/hooks/useDebounce.js
import { useEffect, useState } from "react";

export default function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer); // restart the wait if value changes again
  }, [value, delay]);

  return debounced;
}
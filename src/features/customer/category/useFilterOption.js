import { useEffect, useState } from "react";
import { getFilterOptions } from "./categoryApi";

export default function useFilterOptions(categoryId) {
  const [options, setOptions] = useState(null);
  useEffect(() => {
  if (!categoryId) return;
  let ignore = false;
  getFilterOptions(categoryId)
    .then((d) => { if (!ignore) setOptions(d); })
    .catch((err) => {
      console.error(err);
      if (!ignore) setOptions({ brands: [], uses: [], ram: [], cpus: [], screens: [] });
    });
  return () => { ignore = true; };
}, [categoryId]);
  return options;
}
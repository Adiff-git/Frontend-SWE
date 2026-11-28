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
      console.error(err); // remove before the PR
      if (!ignore) setOptions({ brands: [], ram: [], cpu: [] });
    });
  return () => { ignore = true; };
}, [categoryId]);
  return options;
}
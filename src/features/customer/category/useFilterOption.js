import { useEffect, useState } from "react";
import { getFilterOptions } from "./categoryApi";

export default function useFilterOptions(category) {
  const [options, setOptions] = useState(null);
  useEffect(() => {
    let ignore = false;
    getFilterOptions(category).then((data) => { if (!ignore) setOptions(data); });
    return () => { ignore = true; };
  }, [category]);
  return options; // null until loaded
}
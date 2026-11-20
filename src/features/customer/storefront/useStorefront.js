import { useEffect, useState } from "react";
import { getStorefront } from "./storefrontApi";

export default function useStorefront() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getStorefront().then(setData).catch(setError).finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}
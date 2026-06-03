import { useEffect, useState } from "react";

export function useAsync<T>(loader: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const reload = () => {
    setLoading(true);
    loader().then((value) => { setData(value); setError(null); }).catch((e) => setError(e instanceof Error ? e.message : String(e))).finally(() => setLoading(false));
  };
  useEffect(reload, deps);
  return { data, error, loading, reload };
}

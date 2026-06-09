import { useCallback, useEffect, useRef, useState } from "react";

interface UseAsyncOptions {
  pollIntervalMs?: number;
}

interface ReloadOptions {
  silent?: boolean;
}

export function useAsync<T>(loader: () => Promise<T>, deps: unknown[] = [], options: UseAsyncOptions = {}) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const loaderRef = useRef(loader);
  const requestIdRef = useRef(0);

  useEffect(() => {
    loaderRef.current = loader;
  });

  const reload = useCallback((reloadOptions: ReloadOptions = {}) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    if (!reloadOptions.silent) setLoading(true);

    loaderRef.current()
      .then((value) => {
        if (requestId !== requestIdRef.current) return;
        setData(value);
        setError(null);
      })
      .catch((e) => {
        if (requestId !== requestIdRef.current) return;
        setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (requestId === requestIdRef.current) setLoading(false);
      });
  }, deps);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    if (!options.pollIntervalMs) return;
    const timer = window.setInterval(() => reload({ silent: true }), options.pollIntervalMs);
    return () => window.clearInterval(timer);
  }, [reload, options.pollIntervalMs]);

  return { data, error, loading, reload };
}

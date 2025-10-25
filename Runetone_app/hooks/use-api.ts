import { useCallback, useEffect, useRef, useState } from 'react';
import { API_BASE } from '@/constants/api';

type SimpleOptions = RequestInit;

function buildUrl(endpoint: string) {
  if (!endpoint) return API_BASE;
  return endpoint.startsWith('http') ? endpoint : `${API_BASE.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;
}

export default function useApi<T = any>(endpoint: string) {
  const abortRef = useRef<AbortController | null>(null);
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetcher = useCallback(
    async (method = 'GET', body?: any, opts?: SimpleOptions) => {
      setLoading(true);
      setError(null);
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const url = buildUrl(endpoint);
        const init: RequestInit = {
          method,
          headers: { 'Content-Type': 'application/json', ...(opts?.headers ?? {}) },
          ...opts,
          signal: controller.signal,
        };
        if (body !== undefined) init.body = JSON.stringify(body);
        console.log(url)
        const res = await fetch(url, init);
        console.log(res)
        const text = await res.text();
        let parsed: any = null;
        try {
          parsed = text ? JSON.parse(text) : null;
        } catch {
          parsed = text;
        }

        if (!res.ok) {
          const msg = parsed && typeof parsed === 'object' && parsed.message ? parsed.message : res.statusText || 'Error';
          throw new Error(msg);
        }

        setData(parsed as T);
        setLoading(false);
        return parsed as T;
      } catch (e: any) {
        if (e.name === 'AbortError') return null as any;
        setError(e?.message ?? String(e));
        setLoading(false);
        throw e;
      }
    },
    [endpoint]
  );

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const get = useCallback(() => fetcher('GET'), [fetcher]);
  const post = useCallback((body?: any) => fetcher('POST', body), [fetcher]);
  const put = useCallback((body?: any) => fetcher('PUT', body), [fetcher]);
  const del = useCallback(() => fetcher('DELETE'), [fetcher]);

  return { data, loading, error, get, post, put, del, rawFetch: fetcher, abort: () => abortRef.current?.abort() };
}

export { buildUrl };

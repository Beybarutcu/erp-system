import { useState, useEffect, useCallback } from "react";

export interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export interface UseApiReturn<T> extends UseApiState<T> {
  refetch: () => Promise<void>;
}

/**
 * useApi - Generic data fetching hook
 * 
 * @param fetchFn - Async function that returns data
 * @param dependencies - Dependencies array for refetching
 * @returns { data, loading, error, refetch }
 * 
 * @example
 * ```tsx
 * const { data, loading, error, refetch } = useApi(
 *   () => productsApi.getAll(),
 *   []
 * );
 * ```
 */
export function useApi<T>(
  fetchFn: () => Promise<T>,
  dependencies: any[] = []
): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchData = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const data = await fetchFn();
      setState({ data, loading: false, error: null });
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      });
    }
  }, [fetchFn]);

  useEffect(() => {
    fetchData();
  }, dependencies);

  return {
    ...state,
    refetch: fetchData,
  };
}

/**
 * useMutation - Hook for create/update/delete operations
 * 
 * @example
 * ```tsx
 * const { mutate, loading, error } = useMutation(
 *   (data) => productsApi.create(data)
 * );
 * 
 * const handleSubmit = async () => {
 *   await mutate(formData);
 * };
 * ```
 */
export function useMutation<T, R = any>(
  mutateFn: (data: T) => Promise<R>
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (data: T): Promise<R | null> => {
      setLoading(true);
      setError(null);

      try {
        const result = await mutateFn(data);
        setLoading(false);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error");
        setError(error);
        setLoading(false);
        return null;
      }
    },
    [mutateFn]
  );

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
  }, []);

  return {
    mutate,
    loading,
    error,
    reset,
  };
}

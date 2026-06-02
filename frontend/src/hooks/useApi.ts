import { useState, useCallback } from 'react';
import { AxiosError, AxiosRequestConfig } from 'axios';
import api from '../services/api';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface ApiResponse<T> extends ApiState<T> {
  execute: (config?: AxiosRequestConfig) => Promise<T | null>;
  reset: () => void;
}

interface UseApiOptions {
  onSuccess?: (data: unknown) => void;
  onError?: (error: string) => void;
}

/**
 * Custom hook for making API calls with loading and error states
 * @param initialUrl - The API endpoint URL
 * @param options - Optional callbacks for success and error
 * @returns ApiResponse with data, loading, error, execute, and reset
 */
export function useApi<T = unknown>(
  initialUrl?: string,
  options?: UseApiOptions
): ApiResponse<T> {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (config?: AxiosRequestConfig): Promise<T | null> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await api({
          url: initialUrl,
          ...config,
        });

        const data = response.data as T;
        setState({ data, loading: false, error: null });

        if (options?.onSuccess) {
          options.onSuccess(data);
        }

        return data;
      } catch (err) {
        const error = err as AxiosError<{ message?: string }>;
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          'An unexpected error occurred';

        setState({ data: null, loading: false, error: errorMessage });

        if (options?.onError) {
          options.onError(errorMessage);
        }

        return null;
      }
    },
    [initialUrl, options]
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

/**
 * Hook for GET requests
 */
export function useGet<T = unknown>(url: string, options?: UseApiOptions) {
  const apiHook = useApi<T>(url, options);

  const get = useCallback(
    async (params?: Record<string, unknown>) => {
      return apiHook.execute({ method: 'GET', params });
    },
    [apiHook]
  );

  return { ...apiHook, get };
}

/**
 * Hook for POST requests
 */
export function usePost<T = unknown, D = unknown>(
  url: string,
  options?: UseApiOptions
) {
  const apiHook = useApi<T>(url, options);

  const post = useCallback(
    async (data?: D) => {
      return apiHook.execute({ method: 'POST', data });
    },
    [apiHook]
  );

  return { ...apiHook, post };
}

/**
 * Hook for PUT requests
 */
export function usePut<T = unknown, D = unknown>(
  url: string,
  options?: UseApiOptions
) {
  const apiHook = useApi<T>(url, options);

  const put = useCallback(
    async (data?: D) => {
      return apiHook.execute({ method: 'PUT', data });
    },
    [apiHook]
  );

  return { ...apiHook, put };
}

/**
 * Hook for DELETE requests
 */
export function useDelete<T = unknown>(url: string, options?: UseApiOptions) {
  const apiHook = useApi<T>(url, options);

  const del = useCallback(async () => {
    return apiHook.execute({ method: 'DELETE' });
  }, [apiHook]);

  return { ...apiHook, del };
}

export default useApi;

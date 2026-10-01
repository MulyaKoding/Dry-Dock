export const useApi = () => {
  const base = useRuntimeConfig().public.apiBase as string

  const request = <T>(path: string, options: any = {}) =>
    $fetch<T>(`${base}${path}`, options)

  return {
    get: <T>(path: string) => request<T>(path),
    post: <T>(path: string, body: any) => request<T>(path, { method: 'POST', body }),
    put: <T>(path: string, body: any) => request<T>(path, { method: 'PUT', body }),
    del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  }
}
/** Browser-side helpers for calling the REST API with consistent errors. */

export class ApiClientError extends Error {
  status: number;
  details?: unknown;
  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request<T>(
  url: string,
  options: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const { json, headers, ...rest } = options;
  const res = await fetch(url, {
    ...rest,
    headers: {
      ...(json !== undefined ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const data = text ? JSON.parse(text) : undefined;

  if (!res.ok) {
    const message =
      (data && typeof data === "object" && "error" in data
        ? String((data as { error: unknown }).error)
        : null) ?? `Request failed (${res.status})`;
    throw new ApiClientError(message, res.status, (data as { details?: unknown })?.details);
  }

  return data as T;
}

export const api = {
  get: <T>(url: string) => request<T>(url),
  post: <T>(url: string, body?: unknown) =>
    request<T>(url, { method: "POST", json: body ?? {} }),
  patch: <T>(url: string, body?: unknown) =>
    request<T>(url, { method: "PATCH", json: body ?? {} }),
  put: <T>(url: string, body?: unknown) =>
    request<T>(url, { method: "PUT", json: body ?? {} }),
  delete: <T>(url: string) => request<T>(url, { method: "DELETE" }),
};

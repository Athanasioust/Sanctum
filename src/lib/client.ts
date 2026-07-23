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
    let message =
      (data && typeof data === "object" && "error" in data
        ? String((data as { error: unknown }).error)
        : null) ?? `Request failed (${res.status})`;
    // Surface field-level validation errors ("name: Name is required") instead
    // of the generic top-level message, so forms can show what's actually wrong.
    const details = (data as { details?: unknown })?.details;
    if (Array.isArray(details) && details.length > 0) {
      const fieldMsgs = details
        .map((d) => {
          if (d && typeof d === "object" && "message" in d) {
            const path =
              "path" in d && d.path ? `${String((d as { path: unknown }).path)}: ` : "";
            return `${path}${String((d as { message: unknown }).message)}`;
          }
          return String(d);
        })
        .filter(Boolean)
        .join("; ");
      if (fieldMsgs) message = fieldMsgs;
    }
    throw new ApiClientError(message, res.status, details);
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

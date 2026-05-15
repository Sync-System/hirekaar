/** Human-readable message from FastAPI `detail` (string or validation array). */
export function formatAuthErrorDetail(data: Record<string, unknown>): string {
  const d = data.detail;
  if (typeof d === "string") return d;
  if (Array.isArray(d)) {
    return d
      .map((item) => {
        if (item && typeof item === "object" && "msg" in item) {
          return String((item as { msg?: unknown }).msg ?? JSON.stringify(item));
        }
        return JSON.stringify(item);
      })
      .join(" · ");
  }
  if (d != null && typeof d === "object") return JSON.stringify(d);
  return "Something went wrong.";
}

/** Toast message from FastAPI `detail` (string or validation array). */
export function authFailureToastMessage(data: Record<string, unknown>): string {
  return formatAuthErrorDetail(data);
}

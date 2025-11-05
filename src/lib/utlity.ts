// Utility functions for truncating text in the application
export const truncateText = (text?: string, max = 45) => {
  if (!text) return "";
  return text.length > max ? text.slice(0, max) + "..." : text;
};


// Utility function to format ISO date strings into a more readable format
export const formatDisplayDate = (iso?: string) => {
  if (!iso) return "";
  try {
    const dt = new Date(iso);
    return dt.toLocaleString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
};
export function formatDateToYMD(d: Date | null): string | null {
  if (!d) return null;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

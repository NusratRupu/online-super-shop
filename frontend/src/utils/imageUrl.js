export function getImageUrl(imageUrl) {
  if (!imageUrl) return "";

  const value = String(imageUrl).trim();

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  const apiBase =
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:5000";

  if (value.startsWith("/uploads/")) {
    return `${apiBase}${value}`;
  }

  if (value.startsWith("uploads/")) {
    return `${apiBase}/${value}`;
  }

  return value;
}

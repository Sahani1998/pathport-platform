// Shared video embed URL resolver — used by API routes and public pages.
// Returns a safe iframe src for YouTube/Vimeo; null for unrecognised URLs.
export function toEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      return v ? `https://www.youtube.com/embed/${v}` : null;
    }
    if (u.hostname === "youtu.be") {
      return `https://www.youtube.com/embed${u.pathname}`;
    }
    if (u.hostname.includes("vimeo.com")) {
      return `https://player.vimeo.com/video/${u.pathname.replace("/", "")}`;
    }
    return null;
  } catch { return null; }
}

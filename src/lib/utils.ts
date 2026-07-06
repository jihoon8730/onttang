export function extractHref(html: string): string | null {
  const match = html.match(/href="([^"]*)"/);
  return match ? match[1] : null;
}

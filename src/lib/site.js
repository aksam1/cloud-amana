// Where the site lives, and the small things that depend on it: sharing, and links out to read a verse.
// When the site moves to its own address, change SITE_URL here (or set VITE_SITE_URL at build time).
export const SITE_URL = import.meta.env?.VITE_SITE_URL || 'https://claude.ai/artifact/HRp6qy5JJwz6rBJGtARwLq';
// Shown on the About page once the owner fills them in (left empty, the page simply leaves those lines out).
export const MAKER = ''; // e.g. 'Made by …' or 'A volunteer project'
export const CONTACT = ''; // an address for "Report a mistake": 'mailto:…' or a form's link
// The scene a new visitor is shown first, before any questions (a unit test keeps it the story's first scene).
export const FIRST_STORY = 'heavens';
export const SITE_LINE = 'Learn Islam through the stories of the prophets. Free, private, no account.';

/**
 * A verse waiting for its verified text is never replaced by typed text: the reader gets its reference and
 * a link to read it at quran.com (asking for Sahih International, the translation this site uses).
 */
export function quranLink(ref) {
  const m = /^(\d+):(\d+)(?:-(\d+))?$/.exec(String(ref));
  if (!m) return 'https://quran.com';
  return `https://quran.com/${m[1]}/${m[2]}${m[3] ? `-${m[3]}` : ''}?translations=20`;
}

/**
 * Share the site (never anything about the reader). Tries the phone's share sheet, then the clipboard,
 * and reports which worked so the page can say so: 'shared' | 'copied' | 'cancelled' | 'manual'.
 */
export async function share(text = SITE_LINE) {
  const data = { title: 'Amanah', text, url: SITE_URL };
  try {
    if (navigator.share) {
      await navigator.share(data);
      return 'shared';
    }
  } catch (e) {
    if (e?.name === 'AbortError') return 'cancelled';
  }
  try {
    await navigator.clipboard.writeText(`${text} ${SITE_URL}`);
    return 'copied';
  } catch {
    return 'manual';
  }
}

export const shareMessage = (how) => (how === 'copied' ? 'Link copied. Paste it to share.' : how === 'manual' ? `Share this link: ${SITE_URL}` : how === 'shared' ? 'Thank you for sharing.' : '');

/** Save text as a file on the reader's own device (their private notes). */
export function download(name, text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

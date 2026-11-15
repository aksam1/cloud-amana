"""One place that makes outgoing web requests, so tests can swap in fake responses."""
import ipaddress
import time
from urllib.parse import urlparse

import httpx

USER_AGENT = "Mozilla/5.0 (compatible; LeadCRM/1.0; small-business website check)"
MAX_PAGE_BYTES = 1_500_000

# Tests set this to an httpx.MockTransport so nothing touches the real internet.
transport: httpx.BaseTransport | None = None


def client(timeout: float = 15.0) -> httpx.Client:
    return httpx.Client(
        transport=transport,
        timeout=timeout,
        follow_redirects=True,
        headers={"User-Agent": USER_AGENT},
    )


def normalize_url(url: str) -> str:
    url = (url or "").strip()
    if not url:
        return ""
    if not url.lower().startswith(("http://", "https://")):
        url = "https://" + url
    return url


def is_safe_public_url(url: str) -> bool:
    """Refuse addresses that point at this computer or a private network."""
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https") or not parsed.hostname:
        return False
    host = parsed.hostname.lower()
    if host == "localhost" or host.endswith(".local") or host.endswith(".internal"):
        return False
    try:
        ip = ipaddress.ip_address(host)
    except ValueError:
        return True
    return not (ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved)


class Page:
    def __init__(self, url: str, status: int, html: str, seconds: float):
        self.url = url
        self.status = status
        self.html = html
        self.seconds = seconds

    @property
    def ok(self) -> bool:
        return 200 <= self.status < 300 and bool(self.html.strip())


def fetch_page(url: str, http: httpx.Client | None = None) -> Page | None:
    """Download one web page. Returns None if the site cannot be reached."""
    url = normalize_url(url)
    if not url or not is_safe_public_url(url):
        return None
    own = http is None
    http = http or client()
    started = time.monotonic()
    try:
        with http.stream("GET", url) as response:
            if not is_safe_public_url(str(response.url)):
                return None
            content_type = response.headers.get("content-type", "")
            if content_type and "html" not in content_type and "text" not in content_type:
                return Page(str(response.url), response.status_code, "", 0.0)
            chunks, size = [], 0
            for chunk in response.iter_bytes():
                chunks.append(chunk)
                size += len(chunk)
                if size > MAX_PAGE_BYTES:
                    break
            raw = b"".join(chunks)
            html = raw.decode(response.encoding or "utf-8", errors="replace")
            return Page(str(response.url), response.status_code, html, time.monotonic() - started)
    except (httpx.HTTPError, UnicodeError, ValueError):
        return None
    finally:
        if own:
            http.close()

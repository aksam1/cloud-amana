"""Phase 3: find an email address for a business.

Order: read the business's own homepage and contact page first (free),
then ask Hunter.io, then check the address with NeverBounce.
"""
import html as html_lib
import re
from urllib.parse import unquote, urljoin, urlparse

from bs4 import BeautifulSoup

from .. import http
from ..config import env

EMAIL_RE = re.compile(r"[A-Za-z0-9][A-Za-z0-9._%+-]*@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}")

# "Websites" that are really a profile on someone else's platform.
PLATFORM_HOSTS = (
    "facebook.com", "instagram.com", "yelp.com", "linktr.ee", "twitter.com", "x.com",
    "tiktok.com", "google.com", "goo.gl", "youtube.com", "linkedin.com", "tripadvisor.com",
    "opentable.com", "doordash.com", "ubereats.com", "grubhub.com", "seamless.com",
    "booksy.com", "vagaro.com", "square.site", "fresha.com", "toasttab.com", "resy.com",
    "styleseat.com", "mindbodyonline.com", "business.site", "squareup.com", "clover.com",
)
FREE_MAIL = (
    "gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "aol.com", "icloud.com",
    "msn.com", "live.com", "me.com", "ymail.com", "protonmail.com", "proton.me",
)
JUNK_DOMAINS = (
    "example.com", "example.org", "domain.com", "yourdomain.com", "email.com", "sentry.io",
    "wixpress.com", "wix.com", "squarespace.com", "godaddy.com", "schema.org", "w3.org",
    "mysite.com", "website.com", "sentry-next.wixpress.com", "test.com",
)
JUNK_LOCALS = ("you", "your", "name", "user", "username", "email", "youremail", "example", "noreply", "no-reply", "donotreply")
ROLE_LOCALS = (
    "info", "contact", "hello", "office", "sales", "support", "admin", "booking", "bookings",
    "reservations", "team", "owner", "mail", "enquiries", "inquiries", "manager", "hi",
)
IMAGE_ENDINGS = (".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".css", ".js")


def site_domain(url: str) -> str:
    """'https://www.joes-pizza.com/menu' -> 'joes-pizza.com'"""
    host = (urlparse(http.normalize_url(url)).hostname or "").lower()
    if host.startswith("www."):
        host = host[4:]
    parts = host.split(".")
    return ".".join(parts[-2:]) if len(parts) > 2 else host


def is_platform_site(url: str) -> bool:
    """True when the 'website' is only a Facebook/Instagram/Yelp-style page."""
    host = (urlparse(http.normalize_url(url)).hostname or "").lower()
    return any(host == p or host.endswith("." + p) for p in PLATFORM_HOSTS)


def extract_emails(html: str) -> list[str]:
    text = unquote(html_lib.unescape(html or ""))
    found = []
    for match in EMAIL_RE.findall(text):
        email = match.strip(".").lower()
        local, _, domain = email.partition("@")
        if email.endswith(IMAGE_ENDINGS) or domain in JUNK_DOMAINS or local in JUNK_LOCALS:
            continue
        if len(email) > 120 or re.fullmatch(r"[0-9a-f]{20,}", local):
            continue
        if email not in found:
            found.append(email)
    return found


def rank_emails(emails: list[str], website: str) -> list[str]:
    """Keep addresses that plausibly belong to the business, best first.

    An address on a different company's domain is usually the web designer
    or a plug-in vendor, so it is dropped.
    """
    domain = site_domain(website)
    scored = []
    for email in emails:
        local, _, email_domain = email.partition("@")
        same = bool(domain) and (email_domain == domain or email_domain.endswith("." + domain))
        if not same and email_domain not in FREE_MAIL:
            continue
        score = (3 if same else 1) + (1 if local in ROLE_LOCALS else 0)
        scored.append((score, email))
    scored.sort(key=lambda pair: -pair[0])
    return [email for _, email in scored]


def _contact_links(page: http.Page) -> list[str]:
    soup = BeautifulSoup(page.html, "html.parser")
    host = urlparse(page.url).hostname
    links = []
    for a in soup.find_all("a", href=True):
        label = (a.get_text(" ") + " " + a["href"]).lower()
        if not any(word in label for word in ("contact", "about", "reach", "find-us", "location")):
            continue
        url = urljoin(page.url, a["href"]).split("#")[0]
        if urlparse(url).hostname == host and url != page.url and url not in links:
            links.append(url)
    links.sort(key=lambda u: 0 if "contact" in u.lower() else 1)
    return links[:2]


def scrape_site_emails(website: str) -> list[str]:
    if not website or is_platform_site(website):
        return []
    with http.client() as client:
        home = http.fetch_page(website, client)
        if home is None or not home.ok:
            return []
        emails = extract_emails(home.html)
        for link in _contact_links(home):
            page = http.fetch_page(link, client)
            if page is not None and page.ok:
                for email in extract_emails(page.html):
                    if email not in emails:
                        emails.append(email)
    return rank_emails(emails, website)


def hunter_emails(website: str) -> list[str]:
    key = env().hunter_api_key
    domain = site_domain(website)
    if not key or not domain or is_platform_site(website):
        return []
    with http.client() as client:
        response = client.get(
            "https://api.hunter.io/v2/domain-search",
            params={"domain": domain, "api_key": key, "limit": 5},
        )
    if response.status_code != 200:
        return []
    found = (response.json().get("data") or {}).get("emails") or []
    found.sort(key=lambda e: (0 if e.get("type") == "generic" else 1, -(e.get("confidence") or 0)))
    return [e["value"].lower() for e in found if e.get("value")]


def verify_email(email: str) -> str:
    """Returns 'valid', 'invalid', 'unknown', or 'unchecked' (no NeverBounce key)."""
    key = env().neverbounce_api_key
    if not key:
        return "unchecked"
    with http.client(timeout=30) as client:
        response = client.get(
            "https://api.neverbounce.com/v4/single/check",
            params={"key": key, "email": email},
        )
    if response.status_code != 200 or response.json().get("status") != "success":
        return "unknown"
    result = response.json().get("result")
    if result == "valid":
        return "valid"
    if result in ("invalid", "disposable"):
        return "invalid"
    return "unknown"  # catch-all or unknown: keep the address but do not call it verified


def find_email(website: str) -> dict:
    """Returns {'email', 'verified', 'source'}; email is '' when nothing usable was found."""
    for source, finder in (("website", scrape_site_emails), ("hunter", hunter_emails)):
        try:
            candidates = finder(website)
        except Exception:
            candidates = []
        fallback = ""
        for email in candidates[:3]:
            result = verify_email(email)
            if result == "valid":
                return {"email": email, "verified": True, "source": source}
            if result != "invalid" and not fallback:
                fallback = email
        if fallback:
            return {"email": fallback, "verified": False, "source": source}
    return {"email": "", "verified": False, "source": ""}

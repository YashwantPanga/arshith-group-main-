import os, re, sys

OLD = r"D:\arshith group static web site\arshith-main\arshithgroup"
OUT = r"D:\arshith group static web site\arshith-new"

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pages as pg



def extract_object(path, name):
    """Return the JS object literal assigned to `const <name> = {...};` copied verbatim."""
    src = open(path, encoding="utf-8").read()
    start = src.index(f"const {name} = ") + len(f"const {name} = ")
    depth = 0
    for i in range(start, len(src)):
        c = src[i]
        if c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                return src[start:i + 1] + ";"
    raise ValueError(name)


role_js = extract_object(os.path.join(OLD, "internship.html"), "ROLE_DETAILS_DATA")
domain_js = extract_object(os.path.join(OLD, "apply-internship.html"), "domainConfigs")

pages = {
    "index.html": pg.home(),
    "aboutgroup.html": pg.aboutgroup(),
    "aboutceo.html": pg.aboutceo(),
    "lifeatarshith.html": pg.life(),
    "LatestNews.html": pg.news(),
    "internship.html": pg.internship(role_js),
    "apply-internship.html": pg.apply(domain_js),
    "certificate-verification.html": pg.certificate(),
    "contact.html": pg.contact(),
}
for name, html in pages.items():
    with open(os.path.join(OUT, name), "w", encoding="utf-8", newline="\n") as f:
        f.write(html)
    print(f"{name:32s} {len(html):>7d} bytes")

# sanity: every local src/href points at a file that exists
missing = set()
for name in pages:
    html = open(os.path.join(OUT, name), encoding="utf-8").read()
    for ref in re.findall(r'(?:src|href)="([^"#:?]+)', html) + re.findall(r"url\('([^']+)'\)", html):
        if ref.startswith("/") or ref.startswith("mailto") or ref.startswith("tel"):
            continue
        p = os.path.join(OUT, ref.replace("%20", " "))
        if not os.path.exists(p):
            missing.add((name, ref))
print("missing refs:", sorted(missing) or "none")

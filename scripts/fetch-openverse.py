"""
Fetch FolioBlocks' sample photos from Openverse (https://openverse.org).

Only CC0 and Public Domain Mark images are accepted, so they can ship in
GPL themes. Each photo is checked against the Openverse API, cropped to its
slot's shape, saved as WebP in public/images/, and credited in
src/generator/imageCredits.json (title, creator, source, license), which
generated themes list under == Images == in readme.txt.

The avatar stays our own drawn silhouette: a stranger's portrait would look
like the student's photo.

Usage: python3 scripts/fetch-openverse.py
"""
import json
import os
import sys
import tempfile
import time
import urllib.error
import urllib.request

from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
OUT = os.path.join(ROOT, 'public', 'images')
CREDITS = os.path.join(ROOT, 'src', 'generator', 'imageCredits.json')
API = 'https://api.openverse.org/v1/images/{}/'
ALLOWED = {'cc0', 'pdm'}
UA = {'User-Agent': 'FolioBlocks image fetcher (https://github.com/huzaifaalmesbah/folioblocks)'}

# file name → (Openverse id, width, height)
SLOTS = {
    'project-1.webp': ('4754c62f-38ec-42c9-870d-2f1b22d2930c', 1200, 800),
    'project-2.webp': ('f4a0cabe-4e2d-4018-8700-9bd267beaa73', 1200, 800),
    'project-3.webp': ('71963d42-1ca9-4229-81c1-f7ef13e9a6b6', 1200, 800),
    'post-1.webp': ('b90b48bd-5f3a-4adb-a018-45afa6c4db8b', 1200, 800),
    'post-2.webp': ('6d55483a-ac31-4291-bf17-5e4d52b6e34c', 1200, 800),
    'post-3.webp': ('6231a349-7ccd-4c98-bbca-13adc7562f0c', 1200, 800),
}


def get(url, limit=40 * 1024 * 1024, tries=4):
    """Download with a size cap, retrying server errors (the API sometimes times out)."""
    for attempt in range(tries):
        try:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=60) as res:
                data = res.read(limit + 1)
            break
        except urllib.error.HTTPError as e:
            if e.code < 500 or attempt == tries - 1:
                raise
            time.sleep(3 * (attempt + 1))
    if len(data) > limit:
        raise ValueError(f'{url} is larger than {limit} bytes')
    return data


def cover_crop(img, w, h):
    """Scale to fill w×h, then crop the middle."""
    scale = max(w / img.width, h / img.height)
    img = img.resize((round(img.width * scale), round(img.height * scale)), Image.LANCZOS)
    left, top = (img.width - w) // 2, (img.height - h) // 2
    return img.crop((left, top, left + w, top + h))


def main():
    os.makedirs(OUT, exist_ok=True)
    credits = {}
    with tempfile.TemporaryDirectory() as tmp:  # Downloads stay out of the project.
        for name, (image_id, w, h) in SLOTS.items():
            meta = json.loads(get(API.format(image_id), 1024 * 1024))
            if meta.get('license') not in ALLOWED:
                sys.exit(f'{name}: {image_id} is {meta.get("license")}, not CC0 or PDM')
            raw_path = os.path.join(tmp, image_id)
            with open(raw_path, 'wb') as f:
                f.write(get(meta['url']))
            with Image.open(raw_path) as src:
                src.verify()  # Reject anything that isn't a well-formed image.
            with Image.open(raw_path) as src:
                img = cover_crop(src.convert('RGB'), w, h)
            img.save(os.path.join(OUT, name), 'WEBP', quality=72, method=6)
            credits[name] = {
                'title': (meta.get('title') or '').strip(),
                'creator': (meta.get('creator') or 'Unknown').strip(),
                'source': meta.get('foreign_landing_url') or meta.get('url'),
                'openverse': f'https://openverse.org/image/{image_id}',
                'license': 'CC0 1.0 Universal' if meta['license'] == 'cc0' else 'Public Domain Mark 1.0',
                'licenseUrl': meta.get('license_url'),
            }
            print(f'{name}: {os.path.getsize(os.path.join(OUT, name)) // 1024} KB, {credits[name]["creator"]}')
    with open(CREDITS, 'w') as f:
        json.dump(credits, f, indent=2, ensure_ascii=False)
        f.write('\n')


if __name__ == '__main__':
    main()

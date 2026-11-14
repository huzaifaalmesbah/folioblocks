"""
Draw FolioBlocks' placeholder images: soft abstract compositions used until a
student adds their own photos, and as sample post thumbnails in previews.

They are generated, not photographed, so they are our own work and released
under CC0 (credited in each theme's readme.txt).

Usage: python3 scripts/make-placeholders.py   (writes public/images/*.webp)
"""
import math
import os
import random

from PIL import Image, ImageDraw, ImageFilter

OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'images')

# Calm palettes that sit well on light and dark themes: (background top, background bottom, shapes...)
PALETTES = {
    'dawn': ['#f6e7dc', '#e9c9b6', '#d9826b', '#f2b880', '#7a4b3a'],
    'sea': ['#dfeaf0', '#b9d1de', '#3f6e8c', '#86b3c9', '#1f3b4d'],
    'moss': ['#e6eadf', '#c7d3bc', '#55735a', '#a3b88f', '#2b3d2e'],
    'dusk': ['#e7e1ef', '#c9bedc', '#6d5a96', '#b39ddb', '#2f2545'],
    'sand': ['#f3eee4', '#ddd2bd', '#b08d57', '#e3c48f', '#4a3b25'],
    'slate': ['#e6e8eb', '#c4cad1', '#4b5563', '#9aa5b1', '#1f2937'],
}


def hex_rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def gradient(w, h, top, bottom):
    a, b = hex_rgb(top), hex_rgb(bottom)
    img = Image.new('RGB', (w, h))
    px = img.load()
    for y in range(h):
        t = y / (h - 1)
        row = tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))
        for x in range(w):
            px[x, y] = row
    return img


def grain(img, amount=6, seed=0):
    rnd = random.Random(seed)
    noise = Image.effect_noise(img.size, 40).convert('L')
    noise = noise.point(lambda v: 128 + (v - 128) * amount // 40)
    rgb = Image.merge('RGB', (noise, noise, noise))
    return Image.blend(img, Image.composite(img, rgb, noise), 0.06 + rnd.random() * 0.02)


def blobs(img, colors, count, seed, blur):
    rnd = random.Random(seed)
    w, h = img.size
    layer = Image.new('RGBA', img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for i in range(count):
        c = hex_rgb(colors[i % len(colors)])
        r = rnd.uniform(0.18, 0.42) * min(w, h)
        x, y = rnd.uniform(0.1, 0.9) * w, rnd.uniform(0.15, 0.95) * h
        d.ellipse([x - r, y - r, x + r, y + r], fill=c + (rnd.randint(150, 230),))
    layer = layer.filter(ImageFilter.GaussianBlur(blur))
    img.paste(layer, (0, 0), layer)
    return img


def shapes(img, colors, seed):
    """Crisp shapes on the soft background: two arches side by side, a sun on the other side, a horizon."""
    rnd = random.Random(seed)
    w, h = img.size
    layer = Image.new('RGBA', img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    left = rnd.random() < 0.5
    # Arches on one side, wide and low so they read as architecture, not a figure.
    x0 = w * (0.08 if left else 0.5)
    for i, (width, top, color, alpha) in enumerate([(0.2, 0.5, colors[2], 235), (0.15, 0.62, colors[4], 200)]):
        aw = width * w
        ax = x0 + i * aw * 0.8
        d.rounded_rectangle([ax, h * top, ax + aw, h * 1.1], radius=int(aw / 2), fill=hex_rgb(color) + (alpha,))
    # The sun on the opposite side, high up.
    sr = rnd.uniform(0.06, 0.09) * w
    sx = w * (rnd.uniform(0.68, 0.84) if left else rnd.uniform(0.16, 0.32))
    sy = h * rnd.uniform(0.2, 0.32)
    d.ellipse([sx - sr, sy - sr, sx + sr, sy + sr], fill=hex_rgb(colors[3]) + (245,))
    # Horizon.
    ly = h * 0.82
    d.rectangle([0, ly, w, h], fill=hex_rgb(colors[1]) + (120,))
    d.line([(0, ly), (w, ly)], fill=hex_rgb(colors[4]) + (90,), width=max(2, w // 500))
    img.paste(layer, (0, 0), layer)
    return img


def scene(w, h, palette, seed):
    p = PALETTES[palette]
    img = gradient(w, h, p[0], p[1])
    img = blobs(img, p[2:4], 4, seed, blur=w // 12)
    img = shapes(img, p, seed + 1)
    return grain(img, seed=seed)


def avatar(size, palette, seed):
    """A friendly, generic person silhouette: clearly a placeholder for a photo."""
    p = PALETTES[palette]
    img = gradient(size, size, p[0], p[1])
    img = blobs(img, p[2:4], 3, seed, blur=size // 10)
    layer = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    ink = hex_rgb(p[4]) + (215,)
    head = size * 0.17
    cx, cy = size / 2, size * 0.42
    d.ellipse([cx - head, cy - head, cx + head, cy + head], fill=ink)
    body_w, body_top = size * 0.36, size * 0.66
    d.rounded_rectangle([cx - body_w, body_top, cx + body_w, size * 1.25], radius=int(body_w), fill=ink)
    img.paste(layer, (0, 0), layer)
    return grain(img, seed=seed)


def save(img, name, quality=78):
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, name)
    img.save(path, 'WEBP', quality=quality, method=6)
    print(f'{name}: {os.path.getsize(path) // 1024} KB')


if __name__ == '__main__':
    save(avatar(800, 'sand', 7), 'avatar.webp')
    save(scene(1600, 900, 'dusk', 11), 'cover.webp')
    for i, pal in enumerate(['dawn', 'sea', 'moss'], start=1):
        save(scene(1200, 800, pal, 20 + i), f'project-{i}.webp')
    for i, pal in enumerate(['slate', 'dawn', 'sea'], start=1):
        save(scene(1200, 800, pal, 40 + i), f'post-{i}.webp')

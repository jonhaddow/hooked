#!/usr/bin/env python3
"""Pulls a pattern PDF apart for writing its pattern.json (the import-pattern skill).

Usage: scripts/pdf-extract.py <pattern.pdf> <slug>

Writes to /tmp/hooked-pdf/<slug>/: text.txt (pdftotext -layout), pages.png (every
page, small, to see where photos sit) and sheet.png (every photo, labelled
<page>-<n>, n counting across the whole PDF). Photos go into
patterns/<slug>/images/<page>-<n>.jpg, shrunk to 480px: those names are what
pattern.json refers to. Run from the repo root.
"""
import glob
import os
import shutil
import subprocess
import sys

from PIL import Image, ImageDraw

if len(sys.argv) != 3:
    sys.exit(__doc__)
pdf, slug = sys.argv[1], sys.argv[2]
work = f"/tmp/hooked-pdf/{slug}"
out = f"patterns/{slug}/images"
# Fresh each run, so photos from an earlier extraction can't linger.
shutil.rmtree(work, ignore_errors=True)
shutil.rmtree(out, ignore_errors=True)
os.makedirs(f"{work}/raw")
os.makedirs(out)
shutil.copy(pdf, f"patterns/{slug}/{slug}.pdf")

subprocess.run(["pdftotext", "-layout", pdf, f"{work}/text.txt"], check=True)
# As PNG: photos aren't always stored as JPEG. Masks come out too; -list tells
# which numbers are actual images.
subprocess.run(["pdfimages", "-png", "-p", pdf, f"{work}/raw/i"], check=True)
listing = subprocess.run(["pdfimages", "-list", pdf], check=True, capture_output=True, text=True)
images = {int(c[1]) for c in (l.split() for l in listing.stdout.splitlines()[2:]) if c[2] == "image"}
subprocess.run(["pdftoppm", "-r", "50", "-png", pdf, f"{work}/p"], check=True)

# Every page side by side, five to a row.
pages = [Image.open(f) for f in sorted(glob.glob(f"{work}/p-*.png"))]
w, h = pages[0].size
rows = (len(pages) + 4) // 5
sheet = Image.new("RGB", (w * 5, h * rows), "white")
for i, im in enumerate(pages):
    sheet.paste(im, ((i % 5) * w, (i // 5) * h))
sheet.save(f"{work}/pages.png")

# Photos only: no masks, nor tiny decorations under 80px.
photos = []
for f in sorted(glob.glob(f"{work}/raw/*.png")):
    name = os.path.basename(f)[2:-4]  # i-004-006.png -> 004-006
    if int(name.split("-")[1]) not in images:
        continue
    im = Image.open(f).convert("RGB")
    if min(im.size) < 80:
        continue
    im.thumbnail((480, 480))
    im.save(f"{out}/{name}.jpg", quality=82)
    photos.append((name, im))

if not photos:
    sys.exit(f"No photos found. Read {work}/text.txt and {work}/pages.png")

# A labelled contact sheet, twelve to a row.
size, cols = 110, 12
rows = (len(photos) + cols - 1) // cols
sheet = Image.new("RGB", (cols * size, rows * (size + 14)), "white")
draw = ImageDraw.Draw(sheet)
for k, (name, im) in enumerate(photos):
    thumb = im.copy()
    thumb.thumbnail((size - 4, size - 4))
    x, y = (k % cols) * size, (k // cols) * (size + 14)
    sheet.paste(thumb, (x, y))
    draw.text((x, y + size - 2), name, fill="black")
sheet.save(f"{work}/sheet.png")

total = sum(os.path.getsize(f) for f in glob.glob(f"{out}/*.jpg"))
print(f"{len(pages)} pages, {len(photos)} photos ({total // 1024} KB) in {out}")
print(f"Read {work}/text.txt, {work}/pages.png and {work}/sheet.png")

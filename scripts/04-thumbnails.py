#!/usr/bin/env python3
"""
Genera thumbnails y versión medium de las 43.469 Giocondas.

Tres variantes por imagen:
  original/ (no se toca — se sube tal cual)
  medium/   (1024px largo mayor, webp quality 82)
  thumb/    (256px largo mayor, webp quality 78)

Los webp se guardan en carpetas staging locales:
  D:\_staging_r2\medium\
  D:\_staging_r2\thumb\

Luego el script 05 los sube a R2.

Multi-threaded (8 workers) para usar bien CPU.
"""
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from PIL import Image

DATASET = Path(
    r"D:\Nicolas_NoMa_Drive\la obra de arte en la epoca de su generatividad tecnica"
    r"\03_Infinite_are_better_than_one\01_Dataset_Gioconda"
)
STAGING = Path(r"D:\_staging_r2")
THUMB_DIR = STAGING / "thumb"
MEDIUM_DIR = STAGING / "medium"

for d in (THUMB_DIR, MEDIUM_DIR):
    d.mkdir(parents=True, exist_ok=True)

LIMIT = None
for arg in sys.argv[1:]:
    if arg.startswith("--limit="):
        LIMIT = int(arg.split("=")[1])


def stem(filename: str) -> str:
    return filename.rsplit(".", 1)[0]


def process(img_path: Path):
    try:
        base = stem(img_path.name)
        thumb_path = THUMB_DIR / f"{base}.webp"
        medium_path = MEDIUM_DIR / f"{base}.webp"

        # Skip si ya existen (permite reanudar)
        if thumb_path.exists() and medium_path.exists():
            return "skipped"

        with Image.open(img_path) as img:
            if img.mode not in ("RGB", "RGBA"):
                img = img.convert("RGB")

            # Medium: 1024px largo mayor
            if not medium_path.exists():
                m = img.copy()
                m.thumbnail((1024, 1024), Image.Resampling.LANCZOS)
                m.save(medium_path, "webp", quality=82, method=6)

            # Thumb: 256px largo mayor
            if not thumb_path.exists():
                t = img.copy()
                t.thumbnail((256, 256), Image.Resampling.LANCZOS)
                t.save(thumb_path, "webp", quality=78, method=6)
        return "ok"
    except Exception as e:
        return f"error: {img_path.name} — {e}"


def main():
    files = sorted(
        f for f in DATASET.iterdir() if f.suffix.lower() in {".jpg", ".jpeg", ".png"}
    )
    if LIMIT:
        files = files[:LIMIT]

    print(f"Procesando {len(files)} imágenes con 8 threads...")
    stats = {"ok": 0, "skipped": 0, "error": 0}

    with ThreadPoolExecutor(max_workers=8) as ex:
        futures = {ex.submit(process, f): f for f in files}
        for i, fut in enumerate(as_completed(futures), 1):
            r = fut.result()
            if r == "ok":
                stats["ok"] += 1
            elif r == "skipped":
                stats["skipped"] += 1
            else:
                stats["error"] += 1
                if stats["error"] < 10:
                    print(f"  {r}")
            if i % 1000 == 0:
                print(f"  {i}/{len(files)}  ok={stats['ok']}  skipped={stats['skipped']}  err={stats['error']}")

    print(f"\n=== DONE ===")
    print(f"OK:      {stats['ok']}")
    print(f"Skipped: {stats['skipped']}")
    print(f"Errors:  {stats['error']}")
    print(f"\nOutput:")
    print(f"  {THUMB_DIR}  ({len(list(THUMB_DIR.iterdir()))} archivos)")
    print(f"  {MEDIUM_DIR} ({len(list(MEDIUM_DIR.iterdir()))} archivos)")


if __name__ == "__main__":
    main()

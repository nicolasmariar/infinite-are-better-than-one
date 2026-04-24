#!/usr/bin/env python3
"""
Sube las 43.469 Giocondas a Cloudflare R2 en tres variantes:
  /original/{filename}           ← .jpg / .png sin modificar
  /medium/{basename}.webp        ← 1024px webp q82
  /thumb/{basename}.webp         ← 256px webp q78

Multi-thread con 32 workers. Skip si el objeto ya existe (cabe re-ejecutar).

Requiere .env.local con R2_* variables.
"""
import os
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import boto3
from botocore.config import Config

ROOT = Path(__file__).parent.parent
ENV_FILE = ROOT / ".env.local"

DATASET = Path(
    r"D:\Nicolas_NoMa_Drive\la obra de arte en la epoca de su generatividad tecnica"
    r"\03_Infinite_are_better_than_one\01_Dataset_Gioconda"
)
STAGING = Path(r"D:\_staging_r2")
THUMB_DIR = STAGING / "thumb"
MEDIUM_DIR = STAGING / "medium"

WORKERS = 32
LIMIT = None
for arg in sys.argv[1:]:
    if arg.startswith("--limit="):
        LIMIT = int(arg.split("=")[1])

# --- Cargar env ---
env = {}
if ENV_FILE.exists():
    for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        k, _, v = line.partition("=")
        env[k.strip()] = v.strip()

R2_ACCOUNT_ID = env.get("R2_ACCOUNT_ID")
R2_ACCESS_KEY_ID = env.get("R2_ACCESS_KEY_ID")
R2_SECRET_ACCESS_KEY = env.get("R2_SECRET_ACCESS_KEY")
R2_ENDPOINT = env.get("R2_ENDPOINT") or f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
R2_BUCKET = env.get("R2_BUCKET_NAME", "giocondas")

if not all([R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY]):
    print("ERROR: faltan R2_* en .env.local")
    sys.exit(1)

# --- Cliente S3 apuntando a R2 ---
s3 = boto3.client(
    "s3",
    endpoint_url=R2_ENDPOINT,
    aws_access_key_id=R2_ACCESS_KEY_ID,
    aws_secret_access_key=R2_SECRET_ACCESS_KEY,
    region_name="auto",
    config=Config(
        retries={"max_attempts": 3, "mode": "standard"},
        max_pool_connections=WORKERS * 2,
        s3={"addressing_style": "path"},
    ),
)


def object_exists(key: str) -> bool:
    try:
        s3.head_object(Bucket=R2_BUCKET, Key=key)
        return True
    except Exception:
        return False


def upload_one(local_path: Path, key: str, content_type: str) -> str:
    """Retorna 'ok', 'skipped' o 'error: msg'."""
    try:
        if object_exists(key):
            return "skipped"
        s3.upload_file(
            str(local_path),
            R2_BUCKET,
            key,
            ExtraArgs={
                "ContentType": content_type,
                "CacheControl": "public, max-age=31536000, immutable",
            },
        )
        return "ok"
    except Exception as e:
        return f"error: {e}"


def mime_for(filename: str) -> str:
    ext = filename.rsplit(".", 1)[-1].lower()
    return {
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "png": "image/png",
        "webp": "image/webp",
    }.get(ext, "application/octet-stream")


def build_jobs():
    originals = sorted(
        f for f in DATASET.iterdir() if f.suffix.lower() in {".jpg", ".jpeg", ".png"}
    )
    if LIMIT:
        originals = originals[:LIMIT]

    jobs = []
    for orig in originals:
        stem = orig.stem  # sin extension
        # 1) original
        jobs.append((orig, f"original/{orig.name}", mime_for(orig.name)))
        # 2) medium webp
        medium = MEDIUM_DIR / f"{stem}.webp"
        if medium.exists():
            jobs.append((medium, f"medium/{stem}.webp", "image/webp"))
        # 3) thumb webp
        thumb = THUMB_DIR / f"{stem}.webp"
        if thumb.exists():
            jobs.append((thumb, f"thumb/{stem}.webp", "image/webp"))
    return jobs


def main():
    jobs = build_jobs()
    total = len(jobs)
    print(f"Jobs totales: {total} ({total//3} originales × 3 variantes aprox)")
    print(f"Bucket: {R2_BUCKET}  Endpoint: {R2_ENDPOINT}")
    print(f"Workers: {WORKERS}")
    print()

    stats = {"ok": 0, "skipped": 0, "error": 0}
    errors_sample = []
    start = time.time()

    with ThreadPoolExecutor(max_workers=WORKERS) as ex:
        futures = {ex.submit(upload_one, p, k, ct): (p, k) for p, k, ct in jobs}
        done_count = 0
        for fut in as_completed(futures):
            r = fut.result()
            done_count += 1
            if r == "ok":
                stats["ok"] += 1
            elif r == "skipped":
                stats["skipped"] += 1
            else:
                stats["error"] += 1
                if len(errors_sample) < 10:
                    errors_sample.append(r)
            if done_count % 500 == 0 or done_count == total:
                elapsed = time.time() - start
                rate = done_count / max(1, elapsed)
                eta_sec = (total - done_count) / max(1, rate)
                print(
                    f"  {done_count}/{total}  ok={stats['ok']} skip={stats['skipped']} err={stats['error']}  "
                    f"{rate:.1f}/s  ETA {eta_sec/60:.1f} min"
                )

    total_elapsed = time.time() - start
    print(f"\n=== DONE en {total_elapsed/60:.1f} min ===")
    print(f"OK:      {stats['ok']}")
    print(f"Skipped: {stats['skipped']}")
    print(f"Errors:  {stats['error']}")
    if errors_sample:
        print("\nPrimeros errores:")
        for e in errors_sample:
            print(f"  {e}")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Seed Supabase con las 43.469 Giocondas desde metadata-enriched.jsonl.

Usa Supabase REST API (postgrest) con service_role key para bypass RLS.
Inserta en batches de 500 para performance.

Requiere:
  - metadata-enriched.jsonl generado por 02-normalize-and-coords.py
  - .env.local con SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY
"""
import json
import os
import sys
from pathlib import Path

import requests

ROOT = Path(__file__).parent.parent
ENV_FILE = ROOT / ".env.local"
IN_FILE = Path(__file__).parent / "metadata-enriched.jsonl"

BATCH_SIZE = 500


def load_env():
    env = {}
    if ENV_FILE.exists():
        for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            k, _, v = line.partition("=")
            env[k.strip()] = v.strip()
    return env


env = load_env()
SUPABASE_URL = env.get("NEXT_PUBLIC_SUPABASE_URL")
SERVICE_ROLE = env.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SERVICE_ROLE:
    print("ERROR: Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local")
    sys.exit(1)

HEADERS = {
    "apikey": SERVICE_ROLE,
    "Authorization": f"Bearer {SERVICE_ROLE}",
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates,return=minimal",
}

INSERT_URL = f"{SUPABASE_URL}/rest/v1/giocondas?on_conflict=filename"


def prepare_row(d: dict) -> dict | None:
    """Convierte jsonl line en row para Supabase. Retorna None si falla validación."""
    if not d.get("filename"):
        return None
    return {
        "filename": d["filename"],
        "slug": d["slug"],
        "format": (d.get("format") or "jpg").lower(),
        "width": d.get("width") or 0,
        "height": d.get("height") or 0,
        "file_size_bytes": d.get("file_size_bytes"),
        "prompt": d.get("prompt"),
        "negative_prompt": d.get("negative_prompt"),
        "model_checkpoint": d.get("model_checkpoint"),
        "seed": d.get("seed"),
        "steps": d.get("steps"),
        "cfg_scale": d.get("cfg_scale"),
        "sampler": d.get("sampler"),
        "loras": d.get("loras"),
        "primary_style": d.get("primary_style"),
        "is_mixed": d.get("is_mixed", False),
        "coord_x": d.get("coord_x"),
        "coord_y": d.get("coord_y"),
        "coord_z": d.get("coord_z"),
        "source": "batch_original",
    }


def main():
    rows = []
    skipped = 0
    with IN_FILE.open(encoding="utf-8") as f:
        for line in f:
            d = json.loads(line)
            r = prepare_row(d)
            if r is None:
                skipped += 1
                continue
            rows.append(r)

    print(f"Rows a insertar: {len(rows)} (skipped {skipped})")

    inserted = 0
    for i in range(0, len(rows), BATCH_SIZE):
        batch = rows[i : i + BATCH_SIZE]
        try:
            resp = requests.post(INSERT_URL, headers=HEADERS, json=batch, timeout=60)
            if resp.status_code not in (200, 201, 204):
                print(f"  batch {i // BATCH_SIZE}: HTTP {resp.status_code} — {resp.text[:300]}")
                continue
            inserted += len(batch)
            if (i // BATCH_SIZE) % 10 == 0:
                print(f"  inserted {inserted}/{len(rows)}")
        except Exception as e:
            print(f"  batch {i // BATCH_SIZE}: error {e}")

    # Actualizar total_giocondas en site_config
    config_url = f"{SUPABASE_URL}/rest/v1/site_config?id=eq.1"
    try:
        r = requests.patch(
            config_url,
            headers=HEADERS,
            json={"total_giocondas": inserted, "last_updated": "now()"},
            timeout=30,
        )
        print(f"site_config update: HTTP {r.status_code}")
    except Exception as e:
        print(f"site_config update error: {e}")

    print(f"\n=== Seed completo: {inserted}/{len(rows)} ===")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Lee metadata.jsonl, normaliza los nombres de LoRA a los 12 estilos canónicos,
filtra los ip-adapter (no son estilos), calcula coords xyz Fibonacci ponderado,
y escribe metadata-enriched.jsonl listo para seed a Supabase.

Mapeo de LoRAs en el dataset → nombre canónico (schema Supabase):
  Quinquela_AI_v2            → Quinquela_AI_v2   (principal)
  quinquela_v1_LoRA          → Quinquela_AI_v2
  Fini_AI_LoRA_v1.2          → Fini_AI
  LeParc_AI_LoRA_XL_v2.1-000020 → LeParc_AI
  LeParc_AI_LoRA_XL_v2.1     → LeParc_AI
  DeLaCarcova_LoRA_v1        → DeLaCarcova_AI
  Eternauta_IA_LoRA_sd15_v1.1 → ElEternauta_AI
  Forner_AI_v1               → Forner_AI
  Berni_AI_SD15_LoRA_v1.5    → Berni_AI
  Berni_AI_SD15_LoRA_v1      → Berni_AI

Ignorar:
  ip-adapter-faceid-plusv2_*  (control-net de cara, no estilo)
  last                         (placeholder/bug)
"""
import json
import math
from pathlib import Path

IN_FILE = Path(__file__).parent / "metadata.jsonl"
OUT_FILE = Path(__file__).parent / "metadata-enriched.jsonl"

# Mapeo LoRA real → nombre canónico del schema
LORA_CANONICAL_MAP = {
    "Quinquela_AI_v2": "Quinquela_AI_v2",
    "quinquela_v1_LoRA": "Quinquela_AI_v2",
    "Fini_AI_LoRA_v1.2": "Fini_AI",
    "LeParc_AI_LoRA_XL_v2.1-000020": "LeParc_AI",
    "LeParc_AI_LoRA_XL_v2.1": "LeParc_AI",
    "DeLaCarcova_LoRA_v1": "DeLaCarcova_AI",
    "Eternauta_IA_LoRA_sd15_v1.1": "ElEternauta_AI",
    "Forner_AI_v1": "Forner_AI",
    "Berni_AI_SD15_LoRA_v1.5": "Berni_AI",
    "Berni_AI_SD15_LoRA_v1": "Berni_AI",
}

# LoRAs a IGNORAR (no son estilos artísticos)
LORA_IGNORE = {
    "ip-adapter-faceid-plusv2_sd15_lora",
    "ip-adapter-faceid-plusv2_sdxl_lora",
    "last",
}

# Orden canónico de los 12 estilos (índice = posición en la esfera Fibonacci)
STYLE_ORDER = [
    "Quinquela_AI_v2",
    "XulSolar_AI_SD15",
    "Berni_AI",
    "Forner_AI",
    "Fini_AI",
    "DeLaCarcova_AI",
    "LeParc_AI",
    "Minujin_AI_Flux",
    "Casares_AI",
    "ElEternauta_AI",
    "DisenoIndigena_AI",
    "NoMa_AI",
]

RADIUS = 100


def fibonacci_sphere(n: int, radius: float = RADIUS):
    points = []
    golden_angle = math.pi * (3 - math.sqrt(5))
    for i in range(n):
        y = 1 - (i / (n - 1)) * 2 if n > 1 else 0
        r = math.sqrt(1 - y * y)
        theta = golden_angle * i
        points.append((math.cos(theta) * r * radius, y * radius, math.sin(theta) * r * radius))
    return points


STYLE_ANCHORS = dict(zip(STYLE_ORDER, fibonacci_sphere(len(STYLE_ORDER))))


def normalize_loras(raw_loras):
    """Filtra ip-adapter/last, mapea nombres a canónico, agrega pesos duplicados."""
    out = {}
    for l in raw_loras or []:
        name = l["name"]
        weight = float(l.get("weight", 0))
        if name in LORA_IGNORE:
            continue
        canonical = LORA_CANONICAL_MAP.get(name)
        if canonical is None:
            # LoRA desconocido — preservarlo con nombre original (podría ser nuevo)
            canonical = name
        out[canonical] = out.get(canonical, 0) + weight
    return [{"name": n, "weight": w} for n, w in out.items()]


def compute_coords(loras):
    """Centro de masas de anclas ponderado por pesos, con jitter sutil."""
    if not loras:
        return None
    sx = sy = sz = 0.0
    tw = 0.0
    for l in loras:
        anchor = STYLE_ANCHORS.get(l["name"])
        if anchor is None:
            continue
        w = max(0, l["weight"])
        sx += anchor[0] * w
        sy += anchor[1] * w
        sz += anchor[2] * w
        tw += w
    if tw == 0:
        return None
    return (sx / tw, sy / tw, sz / tw)


def jitter_coords(coords, seed, amount=2.0):
    """Jitter determinístico pseudoaleatorio para desambiguar posiciones idénticas."""
    if coords is None:
        return None
    x, y, z = coords
    r1 = (math.sin(seed * 12.9898) * 43758.5453) % 1
    r2 = (math.sin(seed * 78.233) * 43758.5453) % 1
    r3 = (math.sin(seed * 39.4321) * 43758.5453) % 1
    return (
        x + (r1 - 0.5) * amount * 2,
        y + (r2 - 0.5) * amount * 2,
        z + (r3 - 0.5) * amount * 2,
    )


def filename_to_slug(filename: str) -> str:
    """`Giocondas (1234).png` → `gioconda-1234`."""
    import re
    m = re.search(r"\((\d+)\)", filename)
    if m:
        return f"gioconda-{m.group(1)}"
    # fallback
    return filename.rsplit(".", 1)[0].lower().replace(" ", "-").replace("(", "").replace(")", "")


def filename_to_id(filename: str) -> int | None:
    import re
    m = re.search(r"\((\d+)\)", filename)
    return int(m.group(1)) if m else None


total = 0
with_meta = 0
without_meta = 0
with_coords = 0
style_counter = {}
mixed = 0

with IN_FILE.open(encoding="utf-8") as fin, OUT_FILE.open("w", encoding="utf-8") as fout:
    for line in fin:
        d = json.loads(line)
        total += 1
        gid = filename_to_id(d["filename"])
        slug = filename_to_slug(d["filename"])

        raw_loras = d.get("loras") or []
        norm_loras = normalize_loras(raw_loras)

        # Primary style = LoRA canónico con mayor peso (de los conocidos)
        known_loras = [l for l in norm_loras if l["name"] in STYLE_ORDER]
        primary_style = None
        if known_loras:
            main = max(known_loras, key=lambda l: l["weight"])
            primary_style = main["name"]
            active = [l for l in known_loras if l["weight"] > 0.1]
            is_mixed = len(active) > 1
        else:
            is_mixed = False

        coords = compute_coords(known_loras)
        if coords:
            coords = jitter_coords(coords, gid or total)

        has_meta = d.get("has_metadata", False)
        if has_meta:
            with_meta += 1
            if primary_style:
                style_counter[primary_style] = style_counter.get(primary_style, 0) + 1
            if is_mixed:
                mixed += 1
        else:
            without_meta += 1

        if coords:
            with_coords += 1

        enriched = {
            "gioconda_id": gid,
            "filename": d["filename"],
            "slug": slug,
            "format": d["format"],
            "width": d.get("width"),
            "height": d.get("height"),
            "file_size_bytes": d.get("file_size_bytes"),
            "prompt": d.get("prompt_clean"),
            "negative_prompt": d.get("negative_prompt"),
            "model_checkpoint": d.get("model_checkpoint"),
            "seed": d.get("seed"),
            "steps": d.get("steps"),
            "cfg_scale": d.get("cfg_scale"),
            "sampler": d.get("sampler"),
            "loras": norm_loras if norm_loras else None,
            "primary_style": primary_style,
            "is_mixed": is_mixed,
            "coord_x": coords[0] if coords else None,
            "coord_y": coords[1] if coords else None,
            "coord_z": coords[2] if coords else None,
            "has_metadata": has_meta,
        }
        fout.write(json.dumps(enriched, ensure_ascii=False) + "\n")

print(f"Total:               {total}")
print(f"Con metadata:        {with_meta}")
print(f"Sin metadata:        {without_meta}")
print(f"Mixed (>1 LoRA):     {mixed}")
print(f"Con coords 3D:       {with_coords}")
print(f"\n=== Distribución por primary_style (después de normalizar) ===")
for name, n in sorted(style_counter.items(), key=lambda x: -x[1]):
    print(f"  {n:>6}  {name}")

#!/usr/bin/env python3
"""
Extrae metadata (prompt, LoRAs con pesos, seed, model, etc.) de las 43.469
Giocondas y genera `metadata.jsonl` — una línea JSON por imagen.

Formato típico de parameters (AUTOMATIC1111 / Forge):
  <main prompt with <lora:name:weight> tags>
  Negative prompt: <negative>
  Steps: 30, Sampler: DPM++ 2M Karras, CFG scale: 7, Seed: 1402954088,
  Size: 512x768, Model hash: abc, Model: realisticVisionV51, ...

Soporta: PNG con chunk tEXt "parameters", JPEG con EXIF UserComment, fallback a null.

Uso:
  python 01-extract-metadata.py [--limit N] [--out metadata.jsonl]
"""
import json
import re
import sys
from pathlib import Path
from PIL import Image, PngImagePlugin

DATASET = Path(
    r"D:\Nicolas_NoMa_Drive\la obra de arte en la epoca de su generatividad tecnica"
    r"\03_Infinite_are_better_than_one\01_Dataset_Gioconda"
)

OUT_FILE = Path(__file__).parent / "metadata.jsonl"

LIMIT = None
for arg in sys.argv[1:]:
    if arg.startswith("--limit="):
        LIMIT = int(arg.split("=")[1])
    elif arg.startswith("--out="):
        OUT_FILE = Path(arg.split("=", 1)[1])

# Regex para parsear el bloque "parameters"
LORA_RE = re.compile(r"<lora:([^:>]+):([-\d.]+)>", re.IGNORECASE)
FIELDS_RE = {
    "negative_prompt":  re.compile(r"Negative prompt:\s*(.+?)(?=\nSteps:|\Z)", re.DOTALL),
    "steps":            re.compile(r"Steps:\s*(\d+)"),
    "sampler":          re.compile(r"Sampler:\s*([^,\n]+)"),
    "cfg_scale":        re.compile(r"CFG scale:\s*([\d.]+)"),
    "seed":             re.compile(r"Seed:\s*(\d+)"),
    "size":             re.compile(r"Size:\s*(\d+)x(\d+)"),
    "model_hash":       re.compile(r"Model hash:\s*([a-f0-9]+)"),
    "model_checkpoint": re.compile(r"Model:\s*([^,\n]+)"),
    "denoising":        re.compile(r"Denoising strength:\s*([\d.]+)"),
}


def parse_parameters(raw: str):
    """Parsea el bloque 'parameters' típico de AUTOMATIC1111/Forge."""
    if not raw:
        return {}

    # Prompt = todo lo que viene antes de "Negative prompt:" o "Steps:"
    neg_match = re.search(r"(Negative prompt:|Steps:)", raw)
    prompt = raw[: neg_match.start()].strip() if neg_match else raw.strip()

    # Extraer LoRAs del prompt completo
    loras = [
        {"name": m.group(1).strip(), "weight": float(m.group(2))}
        for m in LORA_RE.finditer(prompt)
    ]

    # Quitar los tags <lora:...> del prompt visible
    clean_prompt = LORA_RE.sub("", prompt).replace("  ", " ").strip()

    result = {
        "prompt_raw": prompt,
        "prompt_clean": clean_prompt,
        "loras": loras,
    }

    for key, regex in FIELDS_RE.items():
        m = regex.search(raw)
        if m:
            if key == "size":
                result["width_meta"] = int(m.group(1))
                result["height_meta"] = int(m.group(2))
            elif key in ("steps",):
                result[key] = int(m.group(1))
            elif key in ("seed",):
                try:
                    result[key] = int(m.group(1))
                except ValueError:
                    result[key] = None
            elif key in ("cfg_scale", "denoising"):
                result[key] = float(m.group(1))
            else:
                result[key] = m.group(1).strip()

    # primary_style y is_mixed
    if loras:
        main = max(loras, key=lambda l: l["weight"])
        result["primary_style"] = main["name"]
        active = [l for l in loras if l["weight"] > 0.1]
        result["is_mixed"] = len(active) > 1
    else:
        result["primary_style"] = None
        result["is_mixed"] = False

    return result


def extract_from_image(path: Path) -> dict:
    """Devuelve dict con width, height, file_size, format + metadata extraída."""
    info = {
        "filename": path.name,
        "format": path.suffix.lower().lstrip("."),
        "file_size_bytes": path.stat().st_size,
    }
    try:
        with Image.open(path) as img:
            info["width"] = img.width
            info["height"] = img.height
            # PNG: buscar chunk "parameters" o tEXt
            raw_params = None
            if isinstance(img, PngImagePlugin.PngImageFile):
                raw_params = img.info.get("parameters") or img.info.get("Parameters")
            # JPEG: EXIF UserComment o XMP (auto1111 los guarda en UserComment)
            elif path.suffix.lower() in (".jpg", ".jpeg"):
                exif = img.getexif()
                if exif:
                    # UserComment (tag 37510)
                    uc = exif.get(37510)
                    if uc and isinstance(uc, bytes):
                        # Suele venir con prefix UNICODE\0\0
                        try:
                            raw_params = uc.decode("utf-16-be", errors="ignore").lstrip("\x00")
                        except Exception:
                            try:
                                raw_params = uc.decode("utf-8", errors="ignore")
                            except Exception:
                                pass
                    elif uc:
                        raw_params = str(uc)

            if raw_params:
                info.update(parse_parameters(raw_params))
                info["has_metadata"] = True
            else:
                info["has_metadata"] = False
                info["loras"] = []
                info["primary_style"] = None
                info["is_mixed"] = False
    except Exception as e:
        info["error"] = str(e)
        info["has_metadata"] = False
    return info


def main():
    extensions = {".jpg", ".jpeg", ".png", ".webp"}
    files = sorted(f for f in DATASET.iterdir() if f.suffix.lower() in extensions)
    if LIMIT:
        files = files[:LIMIT]

    total = len(files)
    print(f"Procesando {total} archivos -> {OUT_FILE}")

    with_meta = 0
    without_meta = 0
    errors = 0
    primary_styles = {}
    mixed_count = 0

    with OUT_FILE.open("w", encoding="utf-8") as out:
        for i, f in enumerate(files, 1):
            info = extract_from_image(f)
            out.write(json.dumps(info, ensure_ascii=False) + "\n")
            if info.get("has_metadata"):
                with_meta += 1
                ps = info.get("primary_style")
                if ps:
                    primary_styles[ps] = primary_styles.get(ps, 0) + 1
                if info.get("is_mixed"):
                    mixed_count += 1
            elif "error" in info:
                errors += 1
            else:
                without_meta += 1
            if i % 2000 == 0:
                print(f"  {i}/{total}  with_meta={with_meta}  without={without_meta}  errors={errors}")

    print(f"\n=== RESULTADO ===")
    print(f"Total procesados:  {total}")
    print(f"Con metadata:      {with_meta}")
    print(f"Sin metadata:      {without_meta}")
    print(f"Errores:           {errors}")
    print(f"Mixed (>1 LoRA):   {mixed_count}")
    print(f"\n=== Top 15 primary styles ===")
    for style, n in sorted(primary_styles.items(), key=lambda x: -x[1])[:15]:
        print(f"  {n:>6}  {style}")


if __name__ == "__main__":
    main()

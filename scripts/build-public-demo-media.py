#!/usr/bin/env python3
import json
import os
import subprocess
from pathlib import Path

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".heic", ".heif"}
MAX_SIZE = "1600"

OUTPUT_PUBLIC = Path("public/demo")
MEDIA_MAP_PATH = Path("prisma/seed/demo_media.json")

PROJECTS = {
    "Mida Creek Mangrove Planting": {
        "source": Path("../pilot-project/raw-data/Mida Creek").resolve(),
        "slug": "mida-creek",
    },
    "The Conference of Landstewards": {
        "source": Path("../pilot-project/raw-data/Conference of Landstewards").resolve(),
        "slug": "conference-of-landstewards",
    },
    "Nalubaaga Valley Community Mapping": {
        "source": Path("../pilot-project/raw-data/Community Mapping activities September ").resolve(),
        "slug": "nalubaaga-valley-community-mapping",
    },
}


def ensure_dir(path: Path):
    path.mkdir(parents=True, exist_ok=True)


def collect_images(root: Path):
    return sorted(
        [p for p in root.rglob("*") if p.is_file() and p.suffix.lower() in IMAGE_EXTENSIONS]
    )


def sips_convert(source: Path, dest: Path):
    dest.parent.mkdir(parents=True, exist_ok=True)
    result = subprocess.run(
        ["sips", "-Z", MAX_SIZE, "-s", "format", "jpeg", str(source), "--out", str(dest)],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        raise RuntimeError(result.stderr or result.stdout)


def sips_resize(source: Path, dest: Path):
    dest.parent.mkdir(parents=True, exist_ok=True)
    result = subprocess.run(
        ["sips", "-Z", MAX_SIZE, str(source), "--out", str(dest)],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        raise RuntimeError(result.stderr or result.stdout)


def main():
    media_map = {}
    for title, cfg in PROJECTS.items():
        src_root = cfg["source"]
        slug = cfg["slug"]
        dest_root = OUTPUT_PUBLIC / slug
        ensure_dir(dest_root)

        files = collect_images(src_root)
        if not files:
            print(f"No images found for {title} in {src_root}")
            media_map[title] = []
            continue

        entries = []
        for path in files:
            ext = path.suffix.lower()
            stem = path.stem
            if ext in {".heic", ".heif"}:
                dest = dest_root / f"{stem}.jpg"
                sips_convert(path, dest)
            elif ext in {".jpg", ".jpeg", ".png", ".webp", ".gif"}:
                dest = dest_root / path.name
                sips_resize(path, dest)
            else:
                continue

            rel_url = f"/demo/{slug}/{dest.name}"
            entries.append(
                {
                    "filename": dest.name,
                    "fileRef": rel_url,
                    "thumbnailRef": rel_url,
                }
            )

        media_map[title] = entries
        print(f"{title}: {len(entries)} images")

    MEDIA_MAP_PATH.parent.mkdir(parents=True, exist_ok=True)
    MEDIA_MAP_PATH.write_text(json.dumps(media_map, indent=2))
    print(f"Wrote {MEDIA_MAP_PATH}")


if __name__ == "__main__":
    main()


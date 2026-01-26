#!/usr/bin/env python3
import json
import os
import subprocess
import sys
from pathlib import Path

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".heic", ".heif"}
OUTPUT_PATH = Path("prisma/seed/demo_media.json")
API_BASE = os.environ.get(
    "CLAIMS_ENGINE_API_BASE",
    "https://claimsengine-j52f40ont-aws-9695s-projects.vercel.app",
)


def collect_images(root: Path):
    results = []
    for path in root.rglob("*"):
        if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS:
            results.append(path)
    return sorted(results)


def slugify(value: str):
    slug = []
    last_dash = False
    for ch in value.lower():
        if ch.isalnum():
            slug.append(ch)
            last_dash = False
        elif not last_dash:
            slug.append("-")
            last_dash = True
    return "".join(slug).strip("-")


def run_upload(file_path: Path):
    cmd = [
        "curl",
        "-s",
        "-X",
        "POST",
        "-F",
        f"file=@{file_path}",
        f"{API_BASE}/api/files/upload",
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(result.stderr or result.stdout)
    payload = json.loads(result.stdout)
    return payload.get("url"), payload.get("thumbUrl")


def main():
    if len(sys.argv) < 2:
        print("Usage: upload-demo-media-cli.py <projectTitle=dir> ...")
        sys.exit(1)

    media_map = {}
    if OUTPUT_PATH.exists():
        try:
            media_map = json.loads(OUTPUT_PATH.read_text())
        except Exception:
            media_map = {}
    for arg in sys.argv[1:]:
        if "=" not in arg:
            print(f"Invalid arg: {arg} (expected title=dir)")
            sys.exit(1)
        title, raw_dir = arg.split("=", 1)
        root = Path(raw_dir).expanduser().resolve()
        files = collect_images(root)
        if not files:
            print(f"No images found for {title} in {root}")
            media_map[title] = []
            continue

        print(f"Uploading {len(files)} images for {title}...")
        entries = []
        for file_path in files:
            url, thumb_url = run_upload(file_path)
            entries.append(
                {
                    "filename": file_path.name,
                    "fileRef": url,
                    "thumbnailRef": thumb_url,
                }
            )
        existing = media_map.get(title, [])
        media_map[title] = existing + entries
        print(f"Finished {title} ({len(entries)})")

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(media_map, indent=2))
    print(f"Wrote {OUTPUT_PATH}")


if __name__ == "__main__":
    main()


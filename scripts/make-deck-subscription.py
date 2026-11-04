#!/usr/bin/env python3
"""Generate a PicLex subscription feed from a validated local deck; never upload."""
import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import uuid
from urllib.parse import urlsplit
import zipfile


def address(value):
    if len(value) > 4096 or any(ord(c) < 32 or ord(c) == 127 for c in value):
        raise ValueError("URL contains control characters or is too long")
    parts = urlsplit(value)
    if parts.scheme != "https" or not parts.hostname or parts.username is not None or parts.password is not None or parts.fragment:
        raise ValueError("Use an absolute HTTPS URL without credentials or fragment")
    if parts.port is not None and not 1 <= parts.port <= 65535:
        raise ValueError("Invalid HTTPS port")
    return parts.hostname.lower(), parts.port or 443


def inspect_package(path):
    size = path.stat().st_size
    if not 0 < size <= 134 * 1024 * 1024:
        raise ValueError("Package must be between 1 byte and 134 MiB")
    with zipfile.ZipFile(path) as archive:
        entries = archive.infolist()
        names = [entry.filename for entry in entries]
        if len(entries) > 2001 or len(names) != len(set(names)) or sum(x.file_size for x in entries) > 512 * 1024 * 1024:
            raise ValueError("Duplicate entries or excessive archive size")
        for entry in entries:
            name = entry.filename
            if name.startswith("/") or "\\" in name or ".." in PurePosixPath(name).parts or entry.is_dir() or (entry.external_attr >> 16) & 0o170000 == 0o120000:
                raise ValueError("Unsupported ZIP path or entry")
        def read_json(name, limit):
            if archive.getinfo(name).file_size > limit:
                raise ValueError("JSON entry exceeds its limit")
            data = archive.read(name)
            return json.loads(data), data
        manifest, _ = read_json("manifest.json", 8 * 1024 * 1024)
        if manifest.get("formatIdentifier") != "com.zhaoolee.piclex.photo-archive" or manifest.get("formatVersion") != 1:
            raise ValueError("Unsupported PicLex archive format")
        items = manifest["photos"]
        if not 1 <= len(items) <= 1000 or manifest["photoCount"] != len(items) or manifest.get("trashCount") != 0:
            raise ValueError("Subscription needs 1–1000 active cards")
        seen = set()
        used = {"manifest.json"}
        word_count = 0
        for item in items:
            card_id = str(uuid.UUID(item["id"]))
            if card_id in seen:
                raise ValueError("Duplicate photo UUID")
            seen.add(card_id)
            metadata, raw = read_json(item["jsonPath"], 2 * 1024 * 1024)
            if hashlib.sha256(raw).hexdigest() != item["jsonSHA256"] or str(uuid.UUID(metadata["id"])) != card_id:
                raise ValueError("Photo metadata identity/checksum mismatch")
            if metadata.get("formatVersion") != 1 or metadata.get("deletedAt") is not None:
                raise ValueError("Unsupported/deleted photo metadata")
            image = archive.read(metadata["imagePath"])
            if len(image) != metadata["imageByteCount"] or hashlib.sha256(image).hexdigest() != metadata["imageSHA256"]:
                raise ValueError("Image size/checksum mismatch")
            if not isinstance(metadata["labels"], list) or len(metadata["labels"]) > 1000:
                raise ValueError("Invalid label list")
            word_count += len(metadata["labels"])
            used.update((item["jsonPath"], metadata["imagePath"]))
        if used != set(names):
            raise ValueError("Unexpected entries in deck archive")
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return len(items), word_count, size, digest.hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("package", type=Path)
    parser.add_argument("--package-url", required=True)
    parser.add_argument("--deck-id", required=True)
    parser.add_argument("--title", required=True)
    parser.add_argument("--author", required=True)
    parser.add_argument("--version", required=True, type=int)
    parser.add_argument("--description", default="")
    parser.add_argument("--cover-url")
    parser.add_argument("--legacy", action="store_true", help="Emit the old single-deck feed for pre-unification clients")
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    try:
        origin = address(args.package_url)
        if args.cover_url and address(args.cover_url) != origin:
            raise ValueError("Cover and package must use the same HTTPS origin")
        if not 1 <= args.version <= 999999999:
            raise ValueError("Version must be 1…999999999")
        for name, value, limit in [("Title", args.title, 80), ("Author", args.author, 120)]:
            if not value.strip() or len(value) > limit:
                raise ValueError(f"{name} must contain 1–{limit} characters")
        if len(args.description) > 2000:
            raise ValueError("Description exceeds 2000 characters")
        if args.output.resolve() == args.package.resolve():
            raise ValueError("Output must not overwrite the input package")
        count, words, size, digest = inspect_package(args.package)
        feed = dict(format="com.piclex.deck-subscription", schemaVersion=1, deckID=str(uuid.UUID(args.deck_id)),
                    title=args.title, author=args.author, description=args.description, version=args.version,
                    photoCount=count, wordCount=words, packageURL=args.package_url, packageBytes=size, packageSHA256=digest)
        if args.cover_url:
            feed["coverURL"] = args.cover_url
        if not args.legacy:
            feed.pop("format")
            feed.pop("schemaVersion")
            feed["access"] = "public"
            feed = dict(format="com.piclex.deck-source", schemaVersion=1, title=args.title, decks=[feed])
        args.output.write_text(json.dumps(feed, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"Created {args.output}: {count} cards, {words} labels")
    except (ValueError, KeyError, TypeError, OSError, zipfile.BadZipFile) as error:
        parser.error(str(error))


if __name__ == "__main__":
    main()

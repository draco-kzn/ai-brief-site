#!/usr/bin/env python3
"""
Add a daily or biweekly AI brief and update data/index.json (+ data/index.js fallback).

Examples:
  python scripts/add_brief.py --type daily --date 2026-03-02 --title "New model update" --content "# Daily\n- point A"
  python scripts/add_brief.py --type biweekly --date 2026-03-01_to_15 --title "Half-month wrap" --content-file ./tmp.md
"""

from __future__ import annotations
import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
INDEX_JSON = DATA_DIR / "index.json"
INDEX_JS = DATA_DIR / "index.js"


def parse_args() -> argparse.Namespace:
  p = argparse.ArgumentParser(description="Add AI brief into archive")
  p.add_argument("--type", choices=["daily", "biweekly"], default="daily")
  p.add_argument("--date", required=True, help="daily: YYYY-MM-DD, biweekly: YYYY-MM-01_to_15 or YYYY-MM-16_to_30")
  p.add_argument("--title", required=True)
  p.add_argument("--content", help="markdown content")
  p.add_argument("--content-file", help="path to markdown file")
  return p.parse_args()


def read_content(args: argparse.Namespace) -> str:
  if args.content_file:
    return Path(args.content_file).read_text(encoding="utf-8")
  if args.content:
    return args.content
  raise SystemExit("Provide --content or --content-file")


def load_index() -> dict:
  if not INDEX_JSON.exists():
    return {"daily": [], "biweekly": []}
  return json.loads(INDEX_JSON.read_text(encoding="utf-8"))


def dump_index(index_data: dict) -> None:
  INDEX_JSON.write_text(json.dumps(index_data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
  INDEX_JS.write_text("window.AI_BRIEF_INDEX = " + json.dumps(index_data, ensure_ascii=False, indent=2) + ";\n", encoding="utf-8")


def main() -> None:
  args = parse_args()
  content = read_content(args)

  folder = DATA_DIR / ("daily" if args.type == "daily" else "biweekly")
  folder.mkdir(parents=True, exist_ok=True)

  filename = f"{args.date}.md"
  md_path = folder / filename
  md_path.write_text(content, encoding="utf-8")

  rel_path = f"data/{'daily' if args.type == 'daily' else 'biweekly'}/{filename}"

  index_data = load_index()
  entries = index_data.setdefault(args.type, [])

  updated = False
  for item in entries:
    if item.get("date") == args.date:
      item["title"] = args.title
      item["path"] = rel_path
      updated = True
      break

  if not updated:
    entries.append({"date": args.date, "title": args.title, "path": rel_path})

  entries.sort(key=lambda x: x["date"], reverse=True)
  dump_index(index_data)

  print(f"Saved markdown: {md_path}")
  print(f"Updated index: {INDEX_JSON}")


if __name__ == "__main__":
  main()

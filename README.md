# AI Brief Site (Static)

A zero-dependency static website for archiving **daily AI briefs** and **biweekly summaries**.

## Structure

```text
ai-brief-site/
  index.html
  app.js
  styles.css
  data/
    index.json
    index.js                 # fallback for file:// mode
    daily/YYYY-MM-DD.md
    biweekly/YYYY-MM-01_to_15.md
  scripts/
    add_brief.py
```

## Run

### Option A (as requested): open directly
1. Double-click `index.html`.
2. The UI will try to read `data/index.json` first.
3. If browser blocks local fetch under `file://`, it falls back to `data/index.js` automatically.

### Option B (recommended for full consistency)
Run a tiny local server:

```bash
python -m http.server 8000
# open http://localhost:8000
```

## Data model

`data/index.json`:

```json
{
  "daily": [
    {"date": "2026-03-01", "title": "...", "path": "data/daily/2026-03-01.md"}
  ],
  "biweekly": [
    {"date": "2026-02-16_to_28", "title": "...", "path": "data/biweekly/2026-02-16_to_28.md"}
  ]
}
```

## Add new brief

Use Python script to save markdown and update index metadata:

```bash
# daily
python scripts/add_brief.py \
  --type daily \
  --date 2026-03-02 \
  --title "Daily signal review" \
  --content "# Daily AI Brief — 2026-03-02\n\n- key point 1"

# biweekly
python scripts/add_brief.py \
  --type biweekly \
  --date 2026-03-01_to_15 \
  --title "Biweekly summary" \
  --content-file ./my_summary.md
```

The script updates:
- markdown file in `data/daily/` or `data/biweekly/`
- `data/index.json`
- `data/index.js` fallback

## Cron integration suggestion

Your automation job should:
1. Generate markdown content string.
2. Run `scripts/add_brief.py` with date/title/content.
3. Save inside this folder.

Example (daily at 10:00):

```bash
python C:/Users/zeyuh/.openclaw/workspace/ai-brief-site/scripts/add_brief.py \
  --type daily \
  --date 2026-03-03 \
  --title "AI Daily Brief" \
  --content-file C:/path/to/generated_daily.md
```

For biweekly summaries, trigger on the 15th/last day and use:
- `YYYY-MM-01_to_15`
- `YYYY-MM-16_to_30` (or `_31`)

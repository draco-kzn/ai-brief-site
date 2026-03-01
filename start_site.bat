@echo off
cd /d C:\Users\zeyuh\.openclaw\workspace\ai-brief-site
start "AI Brief Archive" http://127.0.0.1:8765
python -m http.server 8765

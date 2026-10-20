"""観点の当てはめ契約（JSON Lines）の evidence が原典に実在するかを照合する。
使い方: python3 -I check_quotes.py <リポジトリルート> <契約.jsonl>...
照合方法は scenario_test/tools/audit_scenario_delivery.py と同じ（HTMLタグを除き、空白を除いて含まれるか）。
"""
import html
import json
import re
import sys
from pathlib import Path

root = Path(sys.argv[1])
cache = {}


def norm_source(path):
    if path not in cache:
        raw = (root / path).read_text(encoding="utf-8")
        cache[path] = (re.sub(r"\s+", "", html.unescape(raw)),
                       re.sub(r"\s+", "", html.unescape(re.sub(r"<[^>]+>", "", raw))))
    return cache[path]


bad = 0
total = 0
for f in sys.argv[2:]:
    for n, line in enumerate(open(f, encoding="utf-8"), 1):
        line = line.strip()
        if not line:
            continue
        try:
            rec = json.loads(line)
        except json.JSONDecodeError as e:
            print(f"{f}:{n}: JSON不正 {e}")
            bad += 1
            continue
        evs = rec.get("evidence", [])
        if rec.get("kind") in ("item", "route") and not evs:
            print(f"{f}:{n}: {rec.get('contract_id')} evidence が空")
            bad += 1
        for ev in evs:
            total += 1
            p = ev.get("file", "")
            if not (root / p).exists():
                print(f"{f}:{n}: {rec.get('contract_id')} ファイルが無い: {p}")
                bad += 1
                continue
            q = re.sub(r"\s+", "", html.unescape(ev.get("quote", "")))
            raw, text = norm_source(p)
            if not q or (q not in raw and q not in text):
                print(f"{f}:{n}: {rec.get('contract_id')} 引用が原典に無い: {p} :: {ev.get('quote','')[:60]}")
                bad += 1
print(f"引用 {total} 件 / 問題 {bad} 件")
sys.exit(1 if bad else 0)

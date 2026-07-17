#!/usr/bin/env python3
"""LLM突合の判定(task .output)を統合。使い方: merge_xc.py <sessionDir> <taskId...>"""
import json, sys
from pathlib import Path
from collections import Counter
S = sys.argv[1]; tasks = sys.argv[2:]
verdicts = {}
for t in tasks:
    p = Path(f"{S}/tasks/{t}.output")
    if not p.exists(): print(f"  {t}: 出力なし"); continue
    d = json.loads(p.read_text(encoding='utf-8'))
    for fr in (d.get('result') or {}).get('results', []):
        for r in fr.get('results', []):
            verdicts[f"{fr['fid']}#{r['cand_idx']}"] = r
    print(f"  {t}: {(d.get('result') or {}).get('functions')}機能")
print(f"判定 {len(verdicts)}件 / {len({k.split('#')[0] for k in verdicts})}機能")
print(f"  {dict(Counter(v['verdict'] for v in verdicts.values()))}")
json.dump(verdicts, open(f"{S}/scratchpad/verdicts.json", 'w', encoding='utf-8'), ensure_ascii=False)

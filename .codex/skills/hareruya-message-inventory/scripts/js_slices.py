#!/usr/bin/env python3
"""JS由来メッセージ(EE-JS-*)をテンプレ単位のスライスへ切り出す／確定版を取り込む。

並行レビュー時にマスタTSVを直接編集すると競合するため、テンプレ単位の
slices/js/<slug>.tsv を作業単位にする（機能単位スライスと同じ方式）。

使い方:
  python3 js_slices.py --split           # マスタ → slices/js/<slug>.tsv + js_groups.json
  python3 js_slices.py --merge           # slices/js/<slug>.resolved.tsv → マスタへ反映
"""
from __future__ import annotations

import argparse
import json
import re
from collections import defaultdict
from pathlib import Path

import lib_messages as L

TSV = L.DOC_ROOT / "message_inventory" / "message_inventory.tsv"
JS_DIR = L.DOC_ROOT / "message_inventory" / "slices" / "js"
GROUPS = L.DOC_ROOT / "message_inventory" / "js_groups.json"


def src_file(evidence: str) -> str:
    """根拠列 → テンプレ/JSの実ファイルパス。

    根拠列にはレビューが追記した注記が混ざる（'a.js:4 | fable5: b.twig:41' 等）ため、
    先頭の file:line だけを取り出す。
    """
    head = re.split(r"\s*[|｜]\s*|\s*/\s(?=\S+\.(?:twig|js|php))", evidence.strip())[0]
    head = head.split(",")[0].strip()
    m = re.match(r"(.*?\.(?:twig|js|php))(?::\d+)?", head)
    return m.group(1) if m else head.rsplit(":", 1)[0]


def slug_of(tpl: str) -> str:
    s = re.sub(r"^ec-cube-enterprise/", "", tpl)
    s = re.sub(r"^(src/Eccube/Resource/template|html/template)/", "", s)
    return re.sub(r"[^A-Za-z0-9]+", "_", s).strip("_")


def read_master() -> tuple[list[str], list[list[str]]]:
    lines = TSV.read_text(encoding="utf-8").splitlines()
    return lines[0].split("\t"), [l.split("\t") for l in lines[1:]]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--split", action="store_true")
    ap.add_argument("--merge", action="store_true")
    args = ap.parse_args()
    hdr, rows = read_master()
    ic = {h: i for i, h in enumerate(hdr)}

    if args.split:
        JS_DIR.mkdir(parents=True, exist_ok=True)
        g: dict[str, list[list[str]]] = defaultdict(list)
        for r in rows:
            if r[0].startswith("EE-JS-"):
                g[src_file(r[ic["根拠(file:line)"]])].append(r)
        meta = []
        for tpl, rs in sorted(g.items(), key=lambda x: -len(x[1])):
            slug = slug_of(tpl)
            p = JS_DIR / f"{slug}.tsv"
            p.write_text("\t".join(hdr) + "\n" + "\n".join("\t".join(r) for r in rs) + "\n", encoding="utf-8")
            meta.append({"tpl": tpl, "slug": slug, "ids": [r[0] for r in rs], "n": len(rs)})
        GROUPS.write_text(json.dumps(meta, ensure_ascii=False, indent=1), encoding="utf-8")
        print(f"split: {len(meta)} テンプレ群 -> {JS_DIR}  ({sum(m['n'] for m in meta)}件)")
        return

    if args.merge:
        by_id = {r[0]: r for r in rows}
        n = 0
        for p in sorted(JS_DIR.glob("*.resolved.tsv")):
            for line in p.read_text(encoding="utf-8").splitlines()[1:]:
                f = line.split("\t")
                if f and f[0] in by_id:
                    by_id[f[0]] = (f + [""] * len(hdr))[: len(hdr)]
                    n += 1
        TSV.write_text("\t".join(hdr) + "\n" + "\n".join("\t".join(by_id[r[0]]) for r in rows) + "\n", encoding="utf-8")
        print(f"merged {n} rows from js slices -> {TSV.name}")
        return

    ap.error("--split か --merge を指定")


if __name__ == "__main__":
    main()

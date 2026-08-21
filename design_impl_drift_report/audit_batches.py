#!/usr/bin/env python3
"""ワークフローに渡すシートのバッチを組み立てる。

1バッチ = 1ワークフロー実行。判定と反証で1シートあたり2エージェント使うため、
既定は7シート（14エージェント）まで。要求数の多いシートは1バッチあたりの本数を減らす。
未判定（parts/<sheet>.tsv が無い）シートだけを対象にするので、中断しても続きから組める。

  python3 audit_batches.py --doc 0202              # 残りのバッチ一覧
  python3 audit_batches.py --doc 0202 --emit 0     # 先頭バッチの args JSON を出す
"""
from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent

# 1シート=1エージェントなので、シートの大きさはそのエージェントの負荷であってバッチの負荷ではない。
# バッチはワークフロー1回あたりのエージェント数（判定+反証で2倍）だけを決める。
# workflowSizeGuideline=large（50エージェント未満）に合わせて20シート=40エージェント。
# 実行機は12コアで同時実行が10に制限されるため、これ以上増やしても待ち行列が伸びるだけ。
MAX_SHEETS = 20


def batches(doc: str, include_done: bool = False, exclude: set[str] | None = None) -> list[list[dict]]:
    d = ROOT / "design_audit" / doc
    rows = list(csv.DictReader((d / "sheets.tsv").open(encoding="utf-8"), delimiter="\t"))
    done = {p.stem for p in (d / "parts").glob("*.tsv")}
    # 実行中のワークフローが担当しているシートはまだ parts を書いていない。
    # 除外しないと次のバッチに混ざり、同じファイルを2エージェントが同時に書く。
    done |= (exclude or set())
    out: list[list[dict]] = []
    cur: list[dict] = []
    for r in rows:
        if not include_done and r["シート"] in done:
            continue
        item = {"id": r["シート"], "name": r["シート名"], "n": int(r["要求候補"])}
        if len(cur) >= MAX_SHEETS:
            out.append(cur); cur = []
        cur.append(item)
    if cur:
        out.append(cur)
    return out


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--doc", required=True)
    ap.add_argument("--emit", type=int, help="このバッチ番号の args JSON を出す")
    ap.add_argument("--all", action="store_true", help="判定済みのシートも含める")
    ap.add_argument("--exclude", default="", help="実行中で除外したいシート（カンマ区切り）")
    a = ap.parse_args()
    bs = batches(a.doc, include_done=a.all,
                 exclude={x.strip() for x in a.exclude.split(",") if x.strip()})
    if a.emit is not None:
        print(json.dumps({"doc": a.doc, "sheets": bs[a.emit]}, ensure_ascii=False))
        return
    for i, b in enumerate(bs):
        print(f"[{i}] {len(b)}シート {sum(x['n'] for x in b):>5}要求  "
              + ", ".join(f"{x['id']}({x['n']})" for x in b))
    print(f"残り {len(bs)} バッチ / {sum(len(b) for b in bs)} シート")


if __name__ == "__main__":
    main()

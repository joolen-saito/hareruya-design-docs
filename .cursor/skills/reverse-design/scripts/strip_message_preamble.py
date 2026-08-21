#!/usr/bin/env python3
"""表示メッセージ節の見出し直後にある散文の前置きを機械的に外す（ゲートG10）。

出典・採番規則・対になる設計書との分担といった前置きは設計書に書かない
（2026-08-19 ユーザー決定、GRANULARITY.md 3.5）。手書きで消すと消し過ぎ・消し漏れが
出るので、この道具を通す。

外した文章は失われないよう全文を記録へ残す。中には実装のふるまいを述べた文が
混じることがあるので、記録を読んで必要なら業務ロジックへ移す。

  python3 strip_message_preamble.py            # 変更せずに一覧するだけ
  python3 strip_message_preamble.py --apply    # 実際に外し、記録を書く
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
DOCS = ROOT / "functions"
LOG = ROOT / "reverse_design_audit" / "message_preamble_removed.tsv"
HEADING = re.compile(r"^(#{2,4})\s+(.*)$")


def strip_one(text: str) -> tuple[str, list[str]]:
    """戻り値は (書き換え後, 外した段落)。"""
    lines = text.split("\n")
    removed: list[str] = []
    out = list(lines)
    # 後ろの節から処理して行番号のずれを避ける
    for i in range(len(lines) - 1, -1, -1):
        m = HEADING.match(lines[i])
        if not m or "表示メッセージ" not in m.group(2):
            continue
        level = len(m.group(1))
        end = len(lines)
        for j in range(i + 1, len(lines)):
            m2 = HEADING.match(lines[j])
            if m2 and len(m2.group(1)) <= level:
                end = j
                break
        seg = lines[i + 1 : end]
        if not any(s.strip().startswith("|") for s in seg):
            continue  # 表が無い節は対象外（「メッセージを扱わない」の一文は残す）
        # 見出しの直後から、最初の表または小見出しまでを外す
        cut_to = None
        for k, s in enumerate(seg):
            t = s.strip()
            if not t:
                continue
            if t.startswith("|") or t.startswith("#"):
                cut_to = k
                break
            removed.append(t)
        if cut_to is None or cut_to == 0:
            if not removed:
                continue
        if cut_to:
            del out[i + 1 : i + 1 + cut_to]
            out.insert(i + 1, "")
    return "\n".join(out), removed


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true", help="実際に書き換える")
    args = ap.parse_args()

    rows = ["設計書\t外した文章"]
    changed = 0
    for path in sorted(DOCS.rglob("*.md")):
        if "_archive" in str(path):
            continue
        original = path.read_text(encoding="utf-8")
        new, removed = strip_one(original)
        if not removed or new == original:
            continue
        changed += 1
        for r in removed:
            rows.append(f"{path.name}\t{r}")
        print(f"{path.name}: {len(removed)}段落")
        for r in removed:
            print(f"    - {r[:90]}")
        if args.apply:
            path.write_text(new, encoding="utf-8")

    if args.apply and changed:
        LOG.parent.mkdir(parents=True, exist_ok=True)
        LOG.write_text("\n".join(rows) + "\n", encoding="utf-8")
        print(f"\n記録: {LOG}")
    print(f"\n対象 {changed}本" + ("（書き換え済み）" if args.apply else "（未変更。--apply で実行）"))
    return 0


if __name__ == "__main__":
    sys.exit(main())

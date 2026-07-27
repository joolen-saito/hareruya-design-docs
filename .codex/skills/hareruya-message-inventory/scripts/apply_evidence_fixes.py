#!/usr/bin/env python3
"""codex_evidence_fix_driver.py の fixable 判定を正本の『根拠』列へ適用する（冪等）。

## 検証つき適用（この段の肝）
提案された根拠をそのまま信じない。**張り替え後の根拠で `check_evidence_anchor.py` の判定が
OK / KEY_ONLY になる場合だけ**採用する。ならなければ却下（＝根拠として機能していない）。
これにより「もっともらしいが実際には文言が無い file:line」への張り替えを機械的に防ぐ。

- 更新するのは `根拠(file:line)` 列のみ。文言・メタ列は構造的に触らない。
- verdict=keep は対象外。
- 更新行の『解決状態』末尾へ由来マーカーを1回だけ付す。

使い方:
  python3 apply_evidence_fixes.py --results <dir> --dry-run [--rejected out.tsv]
  python3 apply_evidence_fixes.py --results <dir> --apply
"""
from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path

import check_evidence_anchor as A
import lib_messages as L

TSV = L.DOC_ROOT / "message_inventory" / "message_inventory.tsv"
MARKER = " / 根拠是正(codex・アンカー検証済)"


def anchors(content: str, evidence: str, ja2key: dict[str, list[str]]) -> str:
    """check_evidence_anchor と同じ判定を1行分だけ行う。"""
    cands = [c.strip() for c in content.split("／") if c.strip()]
    keys = {k for c in cands for k in ja2key.get(A.norm(c), [])}
    keys |= {c for c in cands if A.re.fullmatch(r"[a-z][\w.]*\.[\w.]+", c)}
    refs = A.FILE_LINE.findall(evidence)
    if not refs:
        return "MISS"
    found_text = found_key = False
    for rel, a, b in refs:
        p = A.resolve(rel)
        if not p:
            continue
        lines = A.read(p)
        lo = max(0, int(a) - 1 - A.WINDOW)
        hi = min(len(lines), (int(b) if b else int(a)) + A.WINDOW)
        blob = A.norm("\n".join(lines[lo:hi]))
        if any(A.norm(c) and A.norm(c) in blob for c in cands):
            found_text = True
        if any(k in blob for k in keys):
            found_key = True
    return "OK" if found_text else ("KEY_ONLY" if found_key else "MISS")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--results", required=True)
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--rejected")
    args = ap.parse_args()
    if not args.apply and not args.dry_run:
        ap.error("--apply か --dry-run を指定してください")

    res: dict[str, dict] = {}
    for p in sorted(Path(args.results).glob("*.json")):
        res.update(json.loads(p.read_text(encoding="utf-8")))
    fixable = {k: v for k, v in res.items()
               if v.get("verdict") == "fixable" and (v.get("evidence") or "").strip()}

    ja = L.load_translations("ja")
    ja2key: dict[str, list[str]] = {}
    for k, v in ja.items():
        ja2key.setdefault(A.norm(v), []).append(k)

    lines = TSV.read_text(encoding="utf-8").splitlines()
    header = lines[0].split("\t")
    ic = {h: i for i, h in enumerate(header)}
    i_ev, i_state = ic["根拠(file:line)"], ic["解決状態"]

    out, applied, rejected, skipped = [lines[0]], 0, [], 0
    for line in lines[1:]:
        if not line.strip():
            continue
        row = line.split("\t")
        v = fixable.get(row[0])
        if not v:
            out.append(line)
            continue
        new = v["evidence"].replace("\t", " ").strip()
        if row[i_ev] == new:
            skipped += 1
            out.append(line)
            continue
        verdict = anchors(row[ic["メッセージ内容"]], new, ja2key)
        if verdict == "MISS":
            rejected.append({"メッセージID": row[0], "理由": "張替後もアンカーしない",
                             "現行": row[i_ev][:70], "提案": new[:70]})
            out.append(line)
            continue
        print(f"  {row[0]} [{verdict}] → {new[:96]}")
        row[i_ev] = new
        if MARKER not in row[i_state]:
            row[i_state] = row[i_state] + MARKER
        applied += 1
        out.append("\t".join(row))

    if args.apply:
        TSV.write_text("\n".join(out) + "\n", encoding="utf-8")
    print(f"\nfixable {len(fixable)}件 / 適用 {applied} / 却下 {len(rejected)} / 冪等skip {skipped}"
          + ("  (dry-run)" if not args.apply else ""))
    if args.rejected and rejected:
        with open(args.rejected, "w", encoding="utf-8", newline="") as fh:
            w = csv.DictWriter(fh, fieldnames=list(rejected[0]), delimiter="\t")
            w.writeheader()
            w.writerows(rejected)
        print(f"→ {args.rejected}")


if __name__ == "__main__":
    main()

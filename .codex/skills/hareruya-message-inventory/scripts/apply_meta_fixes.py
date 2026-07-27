#!/usr/bin/env python3
"""codex_meta_verify_driver.py の confirmed 判定を正本へ適用する（冪等）。

## 安全策
- **verdict=confirmed の行だけ**を対象とする（refuted は一切触らない）。
- `fix` に値がある列だけを更新する。null/空は据え置き。
- **『メッセージ内容』『メッセージ内容(英語)』は対象外**（COLS に含めない＝構造的に変更不能）。
- 更新した行の『解決状態』末尾へ由来マーカーを1回だけ付す。
- 既に是正後の値になっている行は skip（冪等）。

## 却下ガード（confirmed でも適用しない）
codex は confirmed 判定でも設計書の規約を壊す是正値を出すことがある。次は自動却下する:
1. **内部用語の混入** — `CSRFトークン` `getMessage` `Controller` `.php` `セレクタ` `DOM` `例外` 等。
   設計書は利用者視点で書く規約のため、実装用語へ置換するのは改悪。
   例: 「分割登録時にセッションの有効期限が切れているとき」→「CSRFトークンが無効なとき」は却下。
   ただし**その語が当該行の『メッセージ内容』に実際に出る**なら内部用語ではない（画面にそう表示される）。
   例: M03-30-MSG-001 の文言候補には「CSRFトークンが無効です、再送信してください。」が含まれる＝許可。
2. **多候補行の表示条件の狭め** — 『メッセージ内容』が「候補A ／ 候補B」形式の行は、
   表示条件が全候補を覆う必要がある。列挙（「または」「、」）を含まない単一条件への置換は却下。
   例: M04-23-MSG-007 は6候補だが提案は「検証エラーが発生したとき」と一般化するだけで
   個々の条件を失う＝機械適用しない。
3. **明示除外** — 現行が覆っている条件を提案が落とす場合（EXCLUDE に列挙）。

却下分は `--rejected` で出力し、人手または別パスで扱う。

使い方:
  python3 apply_meta_fixes.py --results <dir> --dry-run [--rejected out.tsv]
  python3 apply_meta_fixes.py --results <dir> --apply
"""
from __future__ import annotations

import argparse
import csv
import json
import re
from collections import Counter
from pathlib import Path

import lib_messages as L

TSV = L.DOC_ROOT / "message_inventory" / "message_inventory.tsv"
MARKER = " / meta是正(codex二次検証)"
# 設計書は利用者視点で書く規約。実装用語への置換は改悪なので却下する。
JARGON = re.compile(
    r"CSRF|トークンが無効|isCsrfTokenValid|getMessage|Controller\b|Action\b|Repository"
    r"|\.php|\.twig|\.js\b|セレクタ|querySelector|DOM|例外|jQuery|\$\(")
# 現行が覆う条件を提案が落とすため個別に除外する（理由を必ず添えること）
EXCLUDE = {
    # 文言候補に admin.stock.split_join.login_required を含むが、提案は「ログインしていない」を落とす
    ("M04-13-MSG-054", "トリガー（条件）"),
    # CSV取込5行: 提案はファイルサイズ超過の候補を落とす。
    # fix_csv_import_conditions.py が候補リストと1対1の条件へ合成済み。
    ("M03-30-MSG-001", "トリガー（条件）"),
    ("M03-32-MSG-001", "トリガー（条件）"),
    ("M03-33-MSG-001", "トリガー（条件）"),
    ("M03-38-MSG-001", "トリガー（条件）"),
    ("M03-44-MSG-001", "トリガー（条件）"),
}

# codex出力キー -> 正本の列名（文言列は意図的に含めない）
COLS = {
    "kind": "種別",
    "where": "どこに",
    "disp": "要素(表示)",
    "cond": "トリガー（条件）",
    "next": "後続処理",
}


def esc(s: str) -> str:
    return s.replace("\t", " ").replace("\r", "").replace("\n", "\\n").strip()


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--results", required=True)
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--rejected", help="却下した是正案の出力先TSV")
    args = ap.parse_args()
    if not args.apply and not args.dry_run:
        ap.error("--apply か --dry-run を指定してください")

    res: dict[str, dict] = {}
    for p in sorted(Path(args.results).glob("*.json")):
        res.update(json.loads(p.read_text(encoding="utf-8")))
    conf = {k: v for k, v in res.items() if v.get("verdict") == "confirmed"}

    lines = TSV.read_text(encoding="utf-8").splitlines()
    header = lines[0].split("\t")
    ic = {h: i for i, h in enumerate(header)}
    i_state = ic["解決状態"]

    out, stats, touched = [lines[0]], Counter(), 0
    rejected: list[dict] = []
    for line in lines[1:]:
        if not line.strip():
            continue
        row = line.split("\t")
        v = conf.get(row[0])
        if not v:
            out.append(line)
            continue
        changed = False
        for key, col in COLS.items():
            new = (v.get("fix") or {}).get(key)
            if not isinstance(new, str) or not new.strip():
                continue
            new = esc(new)
            cur = row[ic[col]]
            # 却下0: 明示除外
            if (row[0], col) in EXCLUDE:
                stats[f"{col}:却下(明示除外)"] += 1
                rejected.append({"メッセージID": row[0], "列": col, "理由": "明示除外",
                                 "現行": cur[:70], "提案": new[:70]})
                continue
            # 却下1: 内部用語の混入。ただし当該語が『メッセージ内容』に実在するなら画面表示語なので許可
            m = JARGON.search(new)
            if m and m.group(0) not in row[ic["メッセージ内容"]]:
                stats[f"{col}:却下(内部用語)"] += 1
                rejected.append({"メッセージID": row[0], "列": col, "理由": "内部用語",
                                 "現行": cur[:70], "提案": new[:70]})
                continue
            # 却下2: 多候補行の表示条件を単一条件へ狭める提案
            if (col == "トリガー（条件）" and "／" in row[ic["メッセージ内容"]]
                    and not re.search(r"または|、", new)):
                stats[f"{col}:却下(多候補を狭める)"] += 1
                rejected.append({"メッセージID": row[0], "列": col, "理由": "多候補行の条件を狭める",
                                 "現行": cur[:70], "提案": new[:70]})
                continue
            if cur == new:
                stats[f"{col}:冪等skip"] += 1
                continue
            print(f"  {row[0]} {col}: 「{cur[:44]}」→「{new[:44]}」")
            row[ic[col]] = new
            stats[f"{col}:是正"] += 1
            changed = True
        if changed:
            touched += 1
            if MARKER not in row[i_state]:
                row[i_state] = row[i_state] + MARKER
        out.append("\t".join(row))

    if args.apply:
        TSV.write_text("\n".join(out) + "\n", encoding="utf-8")
    print(f"\nconfirmed {len(conf)}件 / 更新行 {touched}"
          + ("  (dry-run)" if not args.apply else ""))
    for k, n in sorted(stats.items()):
        print(f"  {k}: {n}")
    if args.rejected and rejected:
        with open(args.rejected, "w", encoding="utf-8", newline="") as fh:
            w = csv.DictWriter(fh, fieldnames=list(rejected[0]), delimiter="\t")
            w.writeheader()
            w.writerows(rejected)
        print(f"却下 {len(rejected)}件 → {args.rejected}")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""CSV取込5行の『表示条件』を、文言候補と1対1に対応する形へ組み直す（冪等）。

## 経緯
これらの行は『メッセージ内容』が3〜4候補の併記であり、表示条件は**全候補を覆う**必要がある。
- 是正前（元の値）: ファイルサイズ超過**のみ**を書いていた行が多く、CSRF・追加項目を落としていた
- codex 提案: CSRF・追加項目**のみ**を書き、今度はファイルサイズを落としていた
どちらも不完全なため、候補リストから機械的に条件を合成し直す。

各条件は当該行に記録済みの逐語候補と1対1で対応する（新しい事実は足していない）:
  「アップロードされたファイルが大きすぎます…」 → ファイルサイズが上限を超えたとき
  「CSRFトークンが無効です、再送信してください。」 → CSRFトークンが無効になったとき
  「フィールドグループに追加のフィールドを含んではなりません。」 → 送信内容に未対応の項目が含まれるとき
  「有効な値ではありません。」 → 入力値が不正なとき（M03-30 のみ）

使い方:
  python3 fix_csv_import_conditions.py --dry-run
  python3 fix_csv_import_conditions.py --apply
"""
from __future__ import annotations

import argparse

import lib_messages as L

TSV = L.DOC_ROOT / "message_inventory" / "message_inventory.tsv"

BASE = ("CSV取込を送信したときに、アップロードしたファイルのサイズが上限を超えた、"
        "CSRFトークンが無効になった、または送信内容に未対応の項目が含まれるとき")
FIXES = {
    "M03-30-MSG-001": BASE + "（入力値が不正なときを含む）",
    "M03-32-MSG-001": BASE,
    "M03-33-MSG-001": BASE,
    "M03-38-MSG-001": BASE,
    "M03-44-MSG-001": BASE,
}
MARKER = " / 条件を候補リストへ整合(手動合成)"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    if not args.apply and not args.dry_run:
        ap.error("--apply か --dry-run を指定してください")

    lines = TSV.read_text(encoding="utf-8").splitlines()
    header = lines[0].split("\t")
    ic = {h: i for i, h in enumerate(header)}
    i_cond, i_state = ic["トリガー（条件）"], ic["解決状態"]

    out, changed, skipped = [lines[0]], 0, 0
    for line in lines[1:]:
        if not line.strip():
            continue
        row = line.split("\t")
        new = FIXES.get(row[0])
        if new:
            if row[i_cond] == new:
                skipped += 1
            else:
                print(f"{row[0]}:\n  旧: {row[i_cond][:90]}\n  新: {new[:90]}")
                row[i_cond] = new
                if MARKER not in row[i_state]:
                    row[i_state] = row[i_state] + MARKER
                changed += 1
            out.append("\t".join(row))
        else:
            out.append(line)

    if args.apply:
        TSV.write_text("\n".join(out) + "\n", encoding="utf-8")
    print(f"\n是正{changed} / 冪等skip{skipped}" + ("  (dry-run)" if not args.apply else ""))


if __name__ == "__main__":
    main()

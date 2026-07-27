#!/usr/bin/env python3
"""断片化した文言（切り詰め・引用符脱落）を実ソースの逐語へ是正する（冪等）。

## 発覚経路（2026-07-27）
codex 敵対的レビュー＋`check_literal_strict.py`（境界付き一致）で6行7候補を検出。
いずれも `validate_messages.py` の **部分文字列一致**をすり抜けていた:
より長い正しい文言の一部になっているため `grep -F` では PASS してしまう。

## 是正内容（すべて実ソースの逐語に合わせる）
| ID | 列 | 誤 | 正 | 出典 |
|---|---|---|---|---|
| M13-10-MSG-002 | ja/en | `admin.event.entry.paying_mem` | `admin.event.entry.paying_member_customer_not_registered` | EntryUpdateAction.php:59（ja/en とも locale 未定義＝キー文字列がそのまま表示される） |
| M13-14-MSG-002 | en | 引用符脱落 | `"admin.hareruyamtg.com" is not allowed.` | validators.en.yaml:89 |
| M16-01-MSG-013 | en | 同上 | 同上 | 同上 |
| M16-01-MSG-018 | en | 同上 | 同上 | 同上 |
| F03-01-MSG-003 | ja | 引用符脱落 | `"%original%"では商品が見つかりませんでした。` | messages.ja.yaml:1105 |
| F03-01-MSG-004 | ja | 同上 | `"%fallback%"で検索結果を表示しています。` | messages.ja.yaml:1106 |

M13-10-MSG-002 は根拠も是正する（EntryController.php は catch して表示するだけで、
文言の生成元は EntryUpdateAction.php:51,59）。

適用後は generate_message_list.py / sync_doc_tables.py / HTML再生成 / validate を実行すること。

使い方:
  python3 fix_fragment_literals.py --dry-run
  python3 fix_fragment_literals.py --apply
"""
from __future__ import annotations

import argparse

import lib_messages as L

TSV = L.DOC_ROOT / "message_inventory" / "message_inventory.tsv"

KEY_OLD = "admin.event.entry.paying_mem"
KEY_NEW = "admin.event.entry.paying_member_customer_not_registered"
EN_OLD = "admin.hareruyamtg.com is not allowed."
EN_NEW = '"admin.hareruyamtg.com" is not allowed.'

# (メッセージID, 列) -> [(置換前, 置換後), ...]
FIXES: dict[tuple[str, str], list[tuple[str, str]]] = {
    ("M13-10-MSG-002", "メッセージ内容"): [(KEY_OLD, KEY_NEW)],
    ("M13-10-MSG-002", "メッセージ内容(英語)"): [(KEY_OLD, KEY_NEW)],
    ("M13-10-MSG-002", "根拠(file:line)"): [(
        "ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EntryController.php:290",
        "文言生成元 ec-cube-enterprise/src/Eccube/Service/Admin/Event/EntryUpdateAction.php:51,59"
        "（両キーとも messages.ja/en.yaml 未定義のためキー文字列がそのまま描画される）; "
        "表示 ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EntryController.php:289-290",
    )],
    ("M13-14-MSG-002", "メッセージ内容(英語)"): [(EN_OLD, EN_NEW)],
    ("M16-01-MSG-013", "メッセージ内容(英語)"): [(EN_OLD, EN_NEW)],
    ("M16-01-MSG-018", "メッセージ内容(英語)"): [(EN_OLD, EN_NEW)],
    ("F03-01-MSG-003", "メッセージ内容"): [(
        "%original%では商品が見つかりませんでした。", '"%original%"では商品が見つかりませんでした。')],
    ("F03-01-MSG-004", "メッセージ内容"): [(
        "%fallback%で検索結果を表示しています。", '"%fallback%"で検索結果を表示しています。')],
}


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

    out, changed, skipped = [lines[0]], 0, 0
    for line in lines[1:]:
        if not line.strip():
            continue
        row = line.split("\t")
        touched = False
        for (mid, col), pairs in FIXES.items():
            if row[0] != mid:
                continue
            i = ic[col]
            for old, new in pairs:
                if old in row[i] and new not in row[i]:
                    row[i] = row[i].replace(old, new)
                    touched = True
                elif new in row[i]:
                    skipped += 1
                else:
                    raise SystemExit(f"想定外: {mid} / {col} が既定の文面と一致しません")
        if touched:
            changed += 1
            print(f"{row[0]}: 是正")
        out.append("\t".join(row))

    if args.apply:
        TSV.write_text("\n".join(out) + "\n", encoding="utf-8")
    print(f"是正{changed}行 / 冪等skip{skipped}" + ("  (dry-run)" if not args.apply else ""))


if __name__ == "__main__":
    main()

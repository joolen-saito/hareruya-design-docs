#!/usr/bin/env python3
"""A02-05-MSG-002/003 の誤割当を是正し EE-CLASSCSV へ退避する（冪等）。

## 誤割当の内容（実ソースで確認済み）
a02-05 は「更新商品規格取得（JSON API）」の設計書だが、そこに埋め込まれていた2件は
**管理画面のCSV取込フラッシュメッセージ**だった。

| 旧ID | 実ソース | 実際の画面 |
|---|---|---|
| A02-05-MSG-002 | CsvImportController.php:899（csvClassName／admin_product_class_name_csv_import） | 管理画面 規格CSV取込 |
| A02-05-MSG-003 | CsvImportController.php:1030（csvClassCategory／admin_product_class_category_csv_import） | 管理画面 規格分類CSV取込 |

規格CSV取込・規格分類CSV取込の正本設計書は functions/ に存在しない（両ルートに言及するのは
誤って埋め込まれた a02-05 のみ）。よって「設計書不在は EE-* へ置く」既定方針に従い退避する。

同一 controller 由来の A02-05-MSG-001（カテゴリCSV取込）は既に m03-41 へ正しく再割当済みで、
M03-41-MSG-006 / M03-41-MSG-012 として実在する。その結果 A02-05 の 001 が欠番になっていた。
本スクリプト適用後、A02-05 のメッセージは0件となり欠番自体が消滅する。

## 更新対象
1. message_inventory.tsv（ID・画面・機能候補）
2. id_map.tsv（ID台帳。area キーも付け替える）
3. functions/pf-api/a02-05_api_product_updated_product_class.md（表を撤去し注記へ置換）
4. integration_test の参照2ファイル（参照整合性の維持。※IT本文は誤割当を引き継いだままなので要再生成）

slices/ は当時の作業記録なので触らない。MESSAGE_LIST と HTML は本スクリプト後に再生成すること。

使い方:
  python3 retire_a02_05_misassigned.py --dry-run
  python3 retire_a02_05_misassigned.py --apply
"""
from __future__ import annotations

import argparse
from pathlib import Path

import lib_messages as L

ROOT = L.DOC_ROOT
TSV = ROOT / "message_inventory" / "message_inventory.tsv"
IDMAP = ROOT / "message_inventory" / "id_map.tsv"
DOC = ROOT / "functions/pf-api/a02-05_api_product_updated_product_class.md"
IT_FILES = [
    ROOT / "integration_test/a02_05_api_product_updated_product_class_it_cases.md",
    ROOT / "integration_test/all_it_cases.tsv",
]

RENAME = {
    "A02-05-MSG-002": "EE-CLASSCSV-MSG-001",
    "A02-05-MSG-003": "EE-CLASSCSV-MSG-002",
}
NEW_SCREEN = "管理画面（機能未確定: 規格CSV取込 / 規格分類CSV取込）"
NEW_CAND = (
    "未割当(設計書不在): 出所は CsvImportController の csvClassName（:899 / ルート "
    "admin_product_class_name_csv_import）および csvClassCategory（:1030 / ルート "
    "admin_product_class_category_csv_import）で、いずれも管理画面のCSV取込機能。"
    "両ルートに対応する正本設計書が functions/ に存在しないため EE-* へ退避した。"
    "旧IDは A02-05-MSG-002/003 で、更新商品規格取得API(a02-05)の設計書へ誤って埋め込まれていた。"
)

OLD_TABLE = """| メッセージID | 表示位置 | 画面上の文言 | 画面上の文言(英語) | 表示条件 | 後続処理 |
|--------------|----------|--------------|----------|----------|----------|
| A02-05-MSG-002 | 管理画面上部 | 関連するデータがあるため「%name%」を削除できませんでした | Sorry, we are unable to delete %name%, because it has related data. | 規格CSV登録で、削除指定した規格が使用中で削除できないとき | 規格CSV登録画面に留まる |
| A02-05-MSG-003 | 管理画面上部 | 関連するデータがあるため「%name%」を削除できませんでした | Sorry, we are unable to delete %name%, because it has related data. | 規格CSV登録で、削除指定した規格分類が使用中で削除できないとき | 規格分類CSV登録画面に留まる |
"""
NEW_NOTE = """本APIは画面を持たないため、画面表示メッセージは定義しない。

> 是正記録: 旧版の本節には本機能ID接頭の MSG-002 / MSG-003 として管理画面のCSV取込フラッシュ
> （`CsvImportController::csvClassName`:899 / `csvClassCategory`:1030）が誤って埋め込まれていた。
> いずれも本APIとは無関係のため撤去し、`message_inventory` の未割当バケット `EE-CLASSCSV` へ
> 退避した（規格CSV取込・規格分類CSV取込の正本設計書は未整備）。
"""


def patch(path: Path, subs: list[tuple[str, str]], apply: bool) -> int:
    text = path.read_text(encoding="utf-8")
    orig = text
    for old, new in subs:
        if old in text:
            text = text.replace(old, new)
        elif new not in text:
            raise SystemExit(f"想定外: {path.name} に置換前後どちらの文字列も無い -> {old[:60]!r}")
    n = 0 if text == orig else 1
    if n and apply:
        path.write_text(text, encoding="utf-8")
    return n


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    if not args.apply and not args.dry_run:
        ap.error("--apply か --dry-run を指定してください")
    apply = args.apply

    # 1) 正本
    lines = TSV.read_text(encoding="utf-8").splitlines()
    header = lines[0].split("\t")
    ic = {h: i for i, h in enumerate(header)}
    out, n_master = [lines[0]], 0
    for line in lines[1:]:
        if not line.strip():
            continue
        row = line.split("\t")
        new_id = RENAME.get(row[0])
        if new_id:
            row[0] = new_id
            row[ic["画面"]] = NEW_SCREEN
            row[ic["機能候補(要検証)"]] = NEW_CAND
            n_master += 1
            print(f"正本: → {new_id}")
        out.append("\t".join(row))
    if apply and n_master:
        TSV.write_text("\n".join(out) + "\n", encoding="utf-8")

    # 2) ID台帳（area キーも付け替える）
    n_idmap = patch(IDMAP, [("A02-05|", "EE-CLASSCSV|")] + list(RENAME.items()), apply)

    # 3) 設計書（表を撤去し注記へ）
    n_doc = patch(DOC, [(OLD_TABLE, NEW_NOTE)], apply)

    # 4) 結合テストの参照（参照整合性の維持）
    n_it = sum(patch(p, list(RENAME.items()), apply) for p in IT_FILES)

    print(f"\n正本{n_master}行 / id_map{n_idmap} / 設計書{n_doc} / IT参照{n_it}ファイル"
          + ("  (dry-run)" if not apply else ""))
    if apply:
        print("→ 次に generate_message_list.py と convert_function_spec_html.py(a02-05) を実行し、"
              "validate_messages.py --check-embed で検証すること。")


if __name__ == "__main__":
    main()

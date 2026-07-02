# 未展開候補 昇格パイロット結果

## 実施内容

`integration_test/unexpanded_promotion_rules.md` に従い、未展開候補が多いCSV/帳票系4機能だけを上限180件で再生成した。Playwright/E2Eは対象外。

## 対象

| 機能No | 出力ファイル | 再生成前 | 再生成後 | 追加範囲 |
|--------|--------------|---------:|---------:|----------|
| M03-06 | `m03_06_admin_product_product_custom_csv_export_it_cases.md` | 90 | 180 | 091〜180 |
| M04-21 | `m04_21_admin_stock_stock_csv_import_it_cases.md` | 90 | 180 | 091〜180 |
| M05-10 | `m05_10_admin_order_order_print_delivery_slips_en_it_cases.md` | 90 | 180 | 091〜180 |
| M14-05 | `m14_05_admin_card_card_csv_import_it_cases.md` | 90 | 180 | 091〜180 |

## 追加行の優先度内訳

| 出力ファイル | P1 | P2 | P3 |
|--------------|---:|---:|---:|
| `m03_06_admin_product_product_custom_csv_export_it_cases.md` | 43 | 47 | 0 |
| `m04_21_admin_stock_stock_csv_import_it_cases.md` | 33 | 57 | 0 |
| `m05_10_admin_order_order_print_delivery_slips_en_it_cases.md` | 29 | 61 | 0 |
| `m14_05_admin_card_card_csv_import_it_cases.md` | 33 | 57 | 0 |
| **合計** | **138** | **222** | **0** |

## 検証結果

- 4ファイルとも `format_tsv.py --check` 成功。
- 4ファイルとも既存1〜90行は再生成前後で不変。
- 4ファイルともテストID重複なし。
- 追加90行はP1/P2のみで、P3は含まない。
- 禁止表現検索はヒットなし。
- `integration_test/all_it_cases.tsv` はMarkdown全体から再集約し、31,426データ行、全行10列、テストID重複なし。

## Claude Codeレビュー

- 昇格ルール初回レビューでは、`--only` 付き再生成コマンドの明記と、既存1〜90行不変チェックの追加が必要と指摘された。
- 指摘を `integration_test/unexpanded_promotion_rules.md` に反映後、再レビューで `PASS`。

## 次の判断

本パイロットでは、件数・TSV構造・優先度条件は昇格ルールを満たした。次に全体展開する場合は、CSV/帳票/登録更新系に限定し、単純表示・ナビ系は90件維持を基本とする。

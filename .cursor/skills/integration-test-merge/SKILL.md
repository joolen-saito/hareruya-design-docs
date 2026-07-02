---
name: integration-test-merge
description: >-
  Merges the per-feature integration test cases under .cursor/design/integration_test/ into a single plain TSV. Reads the first ```tsv fence of each *_it_cases.md, keeps one header row, and concatenates all data rows with テストID preserved. Reuses the integration-test-cases skill's format_tsv.py helpers. Use when the user asks to combine/merge the integration_test TSVs into one file, or wants an all-in-one TSV to paste into Excel/Sheets.
disable-model-invocation: true
---

# 結合試験テストケース TSV 結合

`.cursor/design/integration_test/` の機能別テストケース（`*_it_cases.md`、各1つの ```tsv フェンス・10列）を、1つのプレーン TSV に結合する。表計算への一括貼り付けや機能横断レビューに使う。[integration-test-cases](../integration-test-cases/SKILL.md) スキルの出力を入力とする後段ツールであり、TSV 処理は同スキルの `scripts/format_tsv.py` を import して再利用する。本スキルは元の `*_it_cases.md` を書き換えない。

## 入出力

- 入力: `.cursor/design/integration_test/*_it_cases.md`（各ファイルの最初の ```tsv フェンス）。
- 出力: 既定 `.cursor/design/integration_test/all_it_cases.tsv`（プレーン TSV・1ヘッダ行＋全データ行）。
- 出力名 `all_it_cases.tsv` は `*_it_cases.md` パターンに一致しないため、再実行時に自己取り込みされない。

## 仕様

- ヘッダは1行だけ。全ファイルのヘッダが正典の10列（`機能名` … `期待結果／レスポンス`）と一致することを確認する。
- テストIDは各ファイルのまま保持する（再採番しない）。機能ごとに接頭辞が異なりグローバルに一意で、各データ行の先頭列 `機能名` で出所が分かる。
- ソースはファイル名昇順で連結する。各ファイルは `format_tsv.py` の検証（10列・正典ヘッダ・機能名一貫）を通したうえで取り込む。
- テストIDがグローバルに重複する場合は、どのファイル間の重複かを報告して中断する（`--allow-dup-id` で警告継続）。
- 出力はタブ区切り・`QUOTE_MINIMAL`（改行や `"` を含むセルのみダブルクォート、`"` は `""`）。表計算へ A1 貼り付けで列ズレしない。

## 手順

1. 必要なら各ソースを先に整える（[integration-test-cases](../integration-test-cases/SKILL.md) の `format_tsv.py <file> --check`）。
2. まず `--check` で全ソースの健全性とID重複を確認する。
3. 本実行で `all_it_cases.tsv` を生成する。
4. 生成 TSV を表計算へ貼り付ける、または横断レビューに使う。

## スクリプト

リポジトリルート（`ec-cube-enterprise/`）で実行する。

```bash
# 検証のみ（書き出さない）: 各ソースの10列・ヘッダ整合・ID重複を報告
python3 .cursor/skills/integration-test-merge/scripts/merge_it_cases.py --check

# 結合して書き出す（既定 .cursor/design/integration_test/all_it_cases.tsv）
python3 .cursor/skills/integration-test-merge/scripts/merge_it_cases.py
```

オプション:

- `--dir <path>`: 入力ディレクトリを上書きする（既定 `.cursor/design/integration_test`）。
- `--out <path>`: 出力先を上書きする。
- `--check`: 書き出さず検証のみ。
- `--allow-dup-id`: テストID重複を警告にとどめ、停止しない。

## 再利用する関数（format_tsv.py）

`extract_first_tsv_fence`・`parse_tsv_block`・`migrate_rows`・`validate_rows`・`rows_to_tsv_block`・`EXPECTED_HEADER`・`EXPECTED_COLUMNS`・`COL_TEST_ID` を import する。TSV のフェンス抽出・移行・検証・整形ロジックは同スキルを正とし、本スキルでは複製しない。

## 注意

- 元の `*_it_cases.md` は変更しない（読み取りのみ）。
- ソースのヘッダや列数が正典と異なる場合は、当該ファイル名付きで中断する。先に `integration-test-cases` 側で整形・修正する。
- 本文・表・箇条書きで Markdown の太字や HTML strong を使わない。和文では読みやすさ目的の半角空白を入れない（コード・パス・URL内の空白は除く）。

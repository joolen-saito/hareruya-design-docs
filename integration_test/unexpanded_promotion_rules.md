# 未展開候補の昇格ルール

## 目的

`integration_test/unexpanded_it_candidates.tsv` に出力された未展開候補を、既存の `*_it_cases.md` へ無制限に追加しない。実行・レビュー可能な粒度を保ちながら、CSV、帳票、登録更新など業務影響が大きい機能の不足分を優先して昇格する。

## 前提

- 現行の基本上限は `90` 件/ファイル。
- `候補順位` は既存ジェネレータのスコア順であり、P1/P2/P3の優先度順ではない。
- 昇格は既存90件を置き換えず、91位以降の候補を追加する。
- Playwright/E2Eの修正は本ルールの対象外。

## 昇格対象の優先順

1. P1候補を優先する。
2. P2候補は、以下のいずれかに該当する場合に昇格対象とする。
   - CSV取込、CSV出力、ファイル管理、ファイル同期
   - 帳票、PDF、印刷、納品書、ピッキングリスト
   - DB登録、更新、削除、数量・金額・履歴に影響する機能
   - 外部連携、メール送信、バッチ結果に影響する機能
3. P3候補は原則として昇格しない。例外は、P1/P2だけでは設計上の主要導線が欠ける場合、または端末/画面サイズ差分（IT-21）のように結合観点になり得る場合に個別レビューで判断する。
4. ロケール差分はIT-21ではなく、日英別HTML/twigを持つ機能単位で判断する。日本語/英語でtwigが異なる機能の候補は、不要候補へ機械的に落とさず個別レビュー以上に残す。

## 未展開候補の精査区分

未展開候補は一律に「不要」としない。`scripts/triage_unexpanded_it_candidates.py` で以下の3区分に分類し、`integration_test/unexpanded_it_candidates_triage.tsv` と `integration_test/unexpanded_it_candidates_triage_summary.md` に出力する。

| 精査区分 | 対象 | 扱い |
|----------|------|------|
| 昇格対象 | IT-05/06/07/08/10/11/15/16/21/24/27/28/30/33 のP1/P2、IT-21はP3も含む | 結合テストで検出価値が高いため追加候補に残す |
| 個別レビュー | IT-01/12/20/23/26 のP1/P2、IT-02/IT-25のP1、未分類P1 | 機能重要度と既存ケースの重複を見て採否を決める |
| 結合テスト不要候補 | IT-02/14/25のP2/P3、IT-21以外のP3、未分類P2以下 | 単純表示/UI詳細/重複粒度が中心のため原則クローズ候補 |

端末/画面サイズ差分はIT-21として保持する。ロケール差分は、twigが日本語/英語で異なる可能性があるため、日英別HTML/twigを持つ機能単位で個別レビュー以上に残し、落としてよい候補に含めない。

## 採否判断

精査後の候補は `scripts/decide_unexpanded_it_candidates.py` で採否を確定する。

| 採否 | 対象 | 扱い |
|------|------|------|
| 採用 | 昇格対象、P1、日英別HTML/twig差分の可能性がある候補、API/外部取得・受信検証 | 次回以降の昇格候補として残す |
| 不採用 | 非ロケールのP2/P3 UI詳細、単純表示、重複粒度、結合テスト不要候補 | 結合テストには追加せずクローズ |

採用は「直ちに全件をテストケースへ追加する」という意味ではない。既存の上限ルール、レビュー負荷、機能重要度に従って段階的に昇格する。

## 機能タイプ別の追加上限

| 機能タイプ | 目安上限 | 理由 |
|------------|---------:|------|
| 単純表示、ナビ、静的一覧 | 90 | 既存ケースで十分な可能性が高い |
| 通常の検索、詳細、編集画面 | 120 | 入力検証と画面遷移の不足分だけ補う |
| DB登録、更新、削除を持つ管理画面 | 140 | 状態変化とDB反映確認を追加する |
| CSV取込、CSV出力、ファイル管理 | 180 | フォーマット、件数、境界、DB/ファイル整合を追加する |
| 帳票、PDF、印刷 | 180 | 出力内容、レイアウト、ファイル/帳票観点を追加する |
| 外部連携、メール、バッチ複合 | 160 | 異常系、再実行、連携先状態を追加する |

上限は絶対値ではなく、パイロット結果の重複度とレビュー負荷を見て調整する。

## パイロット対象

まず次の4機能だけを再生成する。

| 機能No | 機能名 | 出力ファイル | パイロット上限 | 選定理由 |
|--------|--------|--------------|---------------:|----------|
| M03-06 | 商品情報カスタムCSV出力 | `m03_06_admin_product_product_custom_csv_export_it_cases.md` | 180 | 未展開194件、未展開P1が63件 |
| M04-21 | 在庫変更CSV登録 | `m04_21_admin_stock_stock_csv_import_it_cases.md` | 180 | 未展開220件、在庫更新を伴うCSV取込 |
| M05-10 | 納品書印刷（英語） | `m05_10_admin_order_order_print_delivery_slips_en_it_cases.md` | 180 | 未展開222件、帳票/印刷の最大未展開群 |
| M14-05 | カードCSV登録 | `m14_05_admin_card_card_csv_import_it_cases.md` | 180 | 未展開182件、カードマスタ更新を伴うCSV取込 |

上記4件は、候補順位91〜180の追加候補にP3を含まないため、パイロットでは既存ジェネレータの候補順位91〜180をそのまま昇格する。

既存Markdownと現行ジェネレータ再計算の差分がある4機能は、`m05_06_admin_order_order_bulk_manual_mail_it_cases.md`、`m05_11_admin_order_order_edit_it_cases.md`、`m05_14_admin_order_order_status_change_it_cases.md`、`m05_26_admin_order_order_shipping_result_csv_import_it_cases.md` である。パイロット対象4件はこの差分あり機能に含まれないため、再生成によって既存1〜90行が変わるリスクは低い。

## パイロット再生成コマンド

必ず対象HTMLを一意に絞る `--only` を指定する。`--only` なしの `--overwrite` は全ファイルを上限180で再生成してしまうため禁止する。

```bash
python3 .codex/skills/hareruya-integration-test-cases/scripts/generate_it_cases.py --repo . --overwrite --max-cases-per-file=180 --only m03-06_admin_product_product_custom_csv_export
python3 .codex/skills/hareruya-integration-test-cases/scripts/generate_it_cases.py --repo . --overwrite --max-cases-per-file=180 --only m04-21_admin_stock_stock_csv_import
python3 .codex/skills/hareruya-integration-test-cases/scripts/generate_it_cases.py --repo . --overwrite --max-cases-per-file=180 --only m05-10_admin_order_order_print_delivery_slips_en
python3 .codex/skills/hareruya-integration-test-cases/scripts/generate_it_cases.py --repo . --overwrite --max-cases-per-file=180 --only m14-05_admin_card_card_csv_import
```

## パイロット後の判定基準

- `format_tsv.py --check` が成功する。
- 追加後の件数が上限どおりで、テストID重複がない。
- 禁止表現を含まない。
- 既存の1〜90行が再生成前後で変わっていない。
- 追加された行がP1/P2のみで構成されている。
- 期待結果が過度に定型文だけで埋まっていないかをサンプル確認する。

## 全体展開の判断

パイロット4件でレビュー可能な品質と件数に収まる場合に限り、CSV/帳票/登録更新系へ段階的に展開する。単純表示・ナビ系は90件維持を基本とする。

## drift 4件の扱い

既存Markdownと現行ジェネレータ再計算の差分がある4機能は、通常の全体昇格ではスキップする。反映する場合は `scripts/promote_drift_it_cases.py` を使い、既存1〜90行を保持したうえで以下を満たすこと。

- 既存1〜90行と現行候補の `テストID`、`I/FID`、`テスト観点`、`優先度`、`テスト項目名` が一致する。
- P3は原則追加しない。
- IT-21は端末/画面サイズ差分のためP3でも例外採用できる。
- ロケール差分はIT-21ではなく、日英別HTML/twigを持つ機能単位で個別レビュー以上に残す。
- IT-15、IT-11は昇格対象に含める。
- IT-02/IT-25は原則不要寄りだが、P1は個別レビューとして残す。

# 晴れる屋 EC 刷新 設計書リポジトリ

このリポジトリには、3つの流れのファイル・ハーネス・スキルを置いています。

1. HTML 設計書を作る
2. 結合テストのケースを作る・E2E で流す
3. 総合テスト（シナリオテスト）を作る

使い終わった作業の跡は、2026-11-06 にリポジトリの外へ移しました（下の「リポジトリの外へ移したもの」）。

## 1. HTML 設計書の生成

| 場所 | 中身 |
| --- | --- |
| `excel_to_html/` | 正本の Excel から HTML 設計書を作る変換器（`convert.py`・`verify.py`）。<br>`input/` は正本の Excel、`output/` は生成した HTML。<br>作り直しの手順は `REGENERATION_RUNBOOK.md` |
| `functions/` | 機能設計書（Markdown）の正本と台帳。<br>機能No・区分の正本は `todo-list.md`。<br>HTML への埋め込みは `integrate_function_docs_into_excel_html.py` |
| `function_spec_html_preview/` | 機能設計書の単体の HTML。結合テスト・総合テストの生成も読む |
| `common_spec/` | 共通仕様 |
| `endpoint_reports/` | 実装差分追補（利用者視点の入口）の元 |
| `message_inventory/` | メッセージ一覧と、設計書へ埋め込むメッセージID |
| `genzai_source_attribution/` | 現行踏襲・カスタマイズ機能の参照元ソースの台帳 |
| `excel_preprocess/`・`excel_blocks/` | Excel の前処理ツールとその出力。<br>仕様の正本は `integration_test/T2_EXCEL_PREPROCESS_SPEC.md` |
| `item_definition_audit/` | 画面項目定義の監査。結合テストの項目制約の入力 |
| `reverse_design_audit/` | リバース設計の粒度・レビューの記録 |

## 2. 結合テスト

| 場所 | 中身 |
| --- | --- |
| `integration_test/` | 結合テストのケースの正本と作り直しの流れ。案内は `integration_test/README.md` |
| `integration_test/casegen/cases/` | 機能ごとのケースとシード（正本） |
| `integration_test/casegen/all_test_cases.tsv` | 結合テストの一覧。Excel の項目表の元 |
| `integration_test/casegen/playwright_cases.tsv` | E2E の合否 |
| `e2e/` | 結合テストケースを流す E2E（Playwright）。テスト・シード・画面の部品・道具・判定と記録。<br>使い方は `e2e/README.md` |
| `fp_scale/` | FP によるテスト規模の算定（ケース数の妥当性の根拠） |

## 3. 総合テスト（シナリオテスト）

| 場所 | 中身 |
| --- | --- |
| `scenario_test/markdown/` | 業務フロー（入力） |
| `scenario_test/scenario/`・`test_items/`・`exec/` | シナリオ・試験項目・実施手順 |
| `scenario_test/coverage/`・`audit/`・`tools/` | 補正契約・監査・作り直しのスクリプト |
| `scenario_test/外部資料観点/`・`シナリオテスト観点.md` | 観点の根拠と正本 |
| `scenario_test/user_scenario/` | ユーザー目線の新しいシナリオ（作業中） |

## そのほか残しているもの

- `design_impl_drift_report/`: 設計と実装の乖離監査と、Backlog 起票の台帳（約3.3GB）。結合テストの要求の母集合の入力にもなっている。

## スキル

- 正本は `.cursor/skills/`（設計書寄り）と `.codex/skills/`（`hareruya-*`。テスト・監査・Backlog・E2E 寄り）。
- `.claude/skills/` は、どちらかへのリンク。
- `.claude/settings.json` のフックが `.cursor/skills/reverse-design/` を使うので、reverse-design は消さない。
- 説明文の先頭に「旧世代・使わない」とあるスキル（hareruya-integration-test-cases・hareruya-playwright-standard-tests・e2e-test-cases・integration-test-merge・integration-test-cases）は、いまの流れでは使わない。

## git に入れていないもの

| 場所 | 中身 |
| --- | --- |
| `e2e/evidence/` | E2E のエビデンス（画面の画像・記録） |
| `e2e/.runs/` | 実行のログ・ロック・見張りの記録 |
| `e2e/node_modules/`・`e2e/.state/` | 依存パッケージと実行時の状態 |
| `integration_test/casegen/materials/`・`requirements_all.tsv` | 検証のゲートが出典の突合に読む生成物。消さない |
| `excel_to_html/input/`・`output/` の一部 | 正本の Excel と、生成した HTML |

## リポジトリの外へ移したもの（2026-11-06）

- 移した先は `../hareruya-design-docs-archive/2026-11-06/` で、元と同じ並びのまま置いてある。何を移したかは `MANIFEST.tsv` に書いてある。
- 移したもの:
  - トップの一時ファイル
  - プレゼン資料
  - 旧世代の結合テストの文書・ツール
  - 初期世代の生成物（`casegen/gen_*` など）
  - codex のレビューの出力
  - 呼ばれていない汎用の設計書スキル8本
  - E2E の実行結果
- 追跡していたものは、git の履歴からも戻せる。

# 結合テスト

結合テストのケースの正本と、それを作り直す流れの置き場です。ケースを E2E で流す仕組みは `../e2e/` にあります。

## 正本

| 場所 | 中身 |
| --- | --- |
| `casegen/cases/<機能ID>_test_cases.tsv`・`_seed_data.tsv` | 機能ごとのケースとシード（11列1行の形。E2E がこの形で読む） |
| `casegen/all_test_cases.tsv` | 結合テストの一覧（8列＋手書きの4列）。Excel の項目表 `結合試験項目表.xlsx` の元 |
| `casegen/all_test_cases_id_map.tsv` | 一覧のテストID と cases/ のテストID の対応 |
| `casegen/playwright_cases.tsv` | E2E の合否（条件なしの合格と不合格だけ） |
| `casegen/excluded_*_cases.tsv`・`excluded_*_seeds.tsv` | 除外したケースとシード（未確定・範囲外・重複・単体粒度など） |
| `viewpoint_canonical/viewpoints_canonical.tsv` | 観点の正本 |
| `it-target-functions.tsv` | 結合テストの対象機能の正本 |
| `fid_kubun.tsv` | 機能ID と区分の一覧。メッセージ一覧の生成が読む |

## 作り直しの流れ（順に流す）

1. merge: `casegen/sheetmap/`・`nosheet/`・`ga/`・`gapfill/` と `casegen/datapattern/merge_dp.py`
2. `casegen/seed_screen/apply.py`: シードを画面から作る形へ
3. `casegen/datapattern/conflicts/apply_rulings.py`: 裁定を当てる。中で次を呼ぶ。
   - `product_csv/apply.py`
   - `runnable/apply.py`
   - `dummy_url/apply.py`
   - `shared_env/apply.py`
4. `casegen/exclude_open.py`: 未確定のケースを外す
5. `casegen/exclude_scope.py`: フェーズ2・実装しない機能のケースを外す
6. `casegen/exclude_dup.py`: 重複を外す
7. `casegen/exclude_ut.py`: 単体粒度のケースを外す
8. `casegen/build_all_test_cases.py`: 一覧を作り直す。E2E の判定 `../e2e/review/judgements/` を読み、実施者・実施日・実施結果を埋める
9. `casegen/precond/gate_precond.py --all`: 前提条件の検査

### 消さないもの

各作業フォルダの `README`・`*_map.tsv`・`adopted.tsv`・`decisions.tsv`・`rulings.tsv` は、決定の記録です。

次のものは、流し直しや検証のゲートが読みます。
- `seed_screen/all.tsv`・`out/`、`product_csv/out/`
- `runnable/` の `env/`・`kept/`・`fix2/`・`fix3/`・`work/applied.tsv`
- `precond/` の `baseline/`・`oracle_changes/`・`step_changes/`・`source_changes/`・`added_cases.tsv`・`ident_registry.tsv`
- `casegen/materials/`・`requirements_all.tsv`（git が追跡していない）
- `datapattern/units`・`coverage_audit/units`・`combination/units`

作業フォルダの中の `gen_*`・`review/`・`prompts/` も残しています。ケースの出典やレビューの記録として、名前を挙げられているためです。

## 決定と方針の記録（このフォルダの直下）

| ファイル | 中身 |
| --- | --- |
| `PROCESSING_ORDER.md` | 具体化と E2E 実装のモジュールの順 |
| `SCOPE.md` | 適用範囲の決裁 |
| `TEST_EXECUTION_DECISION.md`・`test-scope-reduction-policy.md` | 実施とケース削減の方針 |
| `HUMAN_DECISION_LIST.md`・`DECISION_SHEET_oversell.md`・`ESCALATION_*.md` | 人の判断の記録 |
| `duplicate-function-delete-report.md`・`it-target-functions.md` | 対象機能の確定の記録 |
| `ut_layer_audit/`・`viewpoint_review/` | 単体粒度の層判定と、観点の確定の根拠 |
| `manual_test_cases/` | 旧結合試験の手作業ケース。総合テストの生成が照合の元として読む |

旧世代の文書・ツール・生成物は、2026-11-06 にリポジトリの外 `../../hareruya-design-docs-archive/2026-11-06/integration_test/` へ移しました。

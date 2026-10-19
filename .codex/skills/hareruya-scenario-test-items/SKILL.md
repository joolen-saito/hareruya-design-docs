---
name: hareruya-scenario-test-items
description: Generate Hareruya scenario system-test item Markdown and TSV from scenario_test/scenario/SCN-*.md, using an 11-column Excel-friendly format similar to integration test case sheets.
---

# Hareruya Scenario Test Items

Use this skill when creating or regenerating system-test item sheets from generated Hareruya business scenario Markdown.

Inputs:

- Scenario Markdown: `scenario_test/scenario/SCN-*.md`
- Scenario list / traceability / coverage: `scenario_test/scenario/01_シナリオ一覧.md`, `02_トレーサビリティ.md`, `03_カバレッジ表.md`

Outputs:

- Per-scenario test item sheets: `scenario_test/test_items/STI-*.md`
- Aggregate TSV: `scenario_test/test_items/all_scenario_test_items.tsv`
- Index: `scenario_test/test_items/00_テスト項目一覧.md`

## Workflow

1. Review the template and checklist:

```bash
sed -n '1,220p' .codex/skills/hareruya-scenario-test-items/references/TEMPLATE.md
sed -n '1,220p' .codex/skills/hareruya-scenario-test-items/references/CHECKLIST.md
```

2. Dry-run generation:

```bash
python3 .codex/skills/hareruya-scenario-test-items/scripts/generate_test_items.py --repo . --dry-run --overwrite
```

3. Generate test item sheets:

```bash
python3 .codex/skills/hareruya-scenario-test-items/scripts/generate_test_items.py --repo . --overwrite --prune-obsolete
```

4. Validate generated sheets:

```bash
python3 .codex/skills/hareruya-scenario-test-items/scripts/validate_test_items.py --repo .
```

## Generation Rules

- 目的と完了基準は `scenario_test/システムテストの目的と完了基準.md` に従う。経路全体は最後の工程だけで判定せず、代表案件で実施する全工程・具体照合・データ連鎖・別業務引き継ぎの必須判定を対応付ける。排他的な分岐・別DPを同じ案件の必須判定へ混ぜない。
- 準備不足の保留は実施区分へ記載し、本来の業務期待結果を「保留として記録できること」へ置換しない。必須判定の保留を経路全体へ継承し、保留一覧を作っただけでテスト設計完了としない。
- 実行準備は `execution_repairs` の業務別手順を使い、乱数fixtureの作成成功を業務初期状態の成立とみなさない。単独工程は必要な先行操作を展開し、継続実施中は同じ実IDを保持する。
- 補正契約の具体的な数量・単価・状態・承認者を汎用期待値へ置き換えない。複数のI/FIDを通る工程も各機能の観測点を維持し、DPの変更値を準備と後工程へ引き継ぐ。
- `scenario_test/tools/audit_execution_repairs.py` で修正前全項目との対応と現在の実施区分を再集計する。資料・先行工程の保留を実施区分にも反映し、保留を合格扱いしない。

- Match the integration-test case format (`*_it_cases.md`) exactly: H1 `# <業務> — <シナリオ名> シナリオ試験テストケース`, an `元シナリオ` link, the observable-result policy sentence, a `## 関連機能No対応概要` table, a `## テストケースTSV` heading with the standard preamble, and a `tsv` code fence.
- Use the fixed 11-column format (integration it_cases columns plus `確認対象`; no テストレベル column):
  `機能名`, `テストID`, `I/FID`, `テスト観点`, `優先度`, `テスト項目名`, `前提条件`, `入力データ/リクエスト内容`, `操作手順/実行方法`, `期待結果／レスポンス`, `確認対象`
- `機能名` = `<業務名> — <シナリオ名>`. `I/FID` = the feature-No that the step exercises, taken from the scenario メインフロー「利用画面・機能」（Mxx-xx 等）; use `-` for branch rows with no function-No.
- Generate one TSV row for one observable assertion.
- Generate a route-level scenario test row as the first row of every sheet. `STI-<SCN-ID-suffix>-001` uses viewpoint `業務経路`, references the source `経路ID` and representative `DP-*`, expands each route step's actor/screen/action/target inside the `操作手順/実行方法` cell, and checks the route's `最終業務状態`.
- Flow type is encoded in the テスト項目名 prefix (`正常系` / `代替系` / `異常系`), not in a column.
- Use normal scenario execution rows for normal (`正常系`) items, branch execution rows for `代替系` / `異常系` items. Do not merge alternative/error branches into normal test items.
- Preserve the scenario's route identity in generated rows. Every TSV row must reference the source `経路ID` in `前提条件`, `入力データ/リクエスト内容`, or `操作手順/実行方法`, and the row's primary flow-type prefix should match the route classification where applicable.
- Keep `テストID` stable and deterministic: `STI-<SCN-ID-suffix>-NNN`.
- `操作手順/実行方法` uses only source terminology: the design-doc screen name and the business-flow action carried in the scenario's 実行手順. Do NOT invent placeholders (`対象画面`) or invented procedure text (`検索または指定する`). If the screen cannot be identified, omit the "を開く" line rather than fabricate one.
- Route-level rows must be executable without opening another file. Do NOT write reference-only instructions such as `元シナリオの正常系実行手順#1-#3を記載順に実行する`; inline the concrete steps instead.
- `期待結果／レスポンス` is inherited from the scenario's flow-linked 期待結果 (linked to the business-flow 作業内容), then normalized as a system-observable result. It must end with one of `〜されること。`, `〜されないこと。`, `〜できること。`, or `〜であること。`, not an actor-action ending such as `〜登録すること。` or `〜更新しないこと。`.
- `入力データ/リクエスト内容` reflects the per-step context (normal) or the condition-specific data (branch/error), so the suite is not limited to a single reused seed.
- Every TSV row references a `DP-*` data pattern from the source scenario. Include the data pattern ID and prerequisite delta in `前提条件`, and include the pattern-specific concrete values in `入力データ/リクエスト内容`.
- Add normal boundary rows with the `正常系 境界` item-name prefix for scenario data patterns whose type is `正常系 境界`.
- Assign `I/FID` at the route-step grain. Normal rows use the source normal-flow feature No; branch/error rows may use the operation's screen/function from `触れる画面と既存ケース` when it is an actual exercised/observed function. Do not assign the whole parent scenario feature list to a row.
- `## 関連機能No対応概要` must list every expected/linked feature No from the source scenario with status `テスト項目化`, `参照のみ`, or `対象外`; features not emitted in `I/FID` need an explicit reason.
- Test item names and execution steps must state who performs the operation and what business action is executed.
- Every row must be independently readable as `準備→操作→合否判定`: `前提条件` includes `準備手順`, `実施区分`, and `対象状態`; `操作手順/実行方法` includes `【準備確認】`, `【操作】`, and `【操作後確認】`; `確認対象` includes `確認場所`, `照合キー`, `合格条件`, `不合格条件`, `証跡保存先`, `必須証跡`, and `判定記録`.
- Use the verified local development startup, fixture endpoints, and credentials from `../ec-cube-enterprise/AGENTS.md` and its test fixture implementation. Treat generated `st-user-*` / `ST-*` values as logical IDs, not login credentials; record their mapping to fixture-returned IDs in `scenario_test/exec/test_result_template.tsv`.
- Incorporate `scenario_test/exec/feasibility/feasibility_by_step.tsv` and `feasibility_by_scenario.tsv`. A missing design or unknown execution mechanism must be labeled with an explicit blocked execution class and concrete release condition; do not silently present it as executable.
- Use a named screen, API method/path, external service, file, form, ledger, or physical object. Do not leave the generated step as generic `外部システム/ツール上`.
- Test item names must state the business result being checked, not just "正常確認".
- Expected results must be observable on screen, data state, CSV/report, mail/notification, external system, or operation history.
- Do not output vague phrases such as `設計どおり`, `設計書に記載のとおり`, `要確認`, `UI標準`, `何らか`, `必要に応じ`, `適宜`, or reference-only execution text like `記載順に実行する`.
- Aggregate/index ordering: order businesses by the minimum business-rank (first-touched 機能No) among their scenarios, keep each business's scenarios contiguous, and sort within a business by scenario ordinal number (`SCN-…-NNN`). So e.g. `STI-PRODUCT-1-001` precedes `STI-PRODUCT-009`.
- Aggregate TSV: collapse cell-internal newlines to ` / ` for every column EXCEPT `操作手順/実行方法`, which keeps its real line breaks (quoted multi-line cell) so手順 stay readable when pasted into a spreadsheet. Per-scenario sheets keep newlines in all multi-value cells.
- Validation requires one route-level row per STI, route ID references on every row, DP ID references on every row when source DP exists, branch/error flow rows when source branch rows exist, and exact row-count agreement between per-STI sheets and the aggregate TSV.

## Resources

- `references/TEMPLATE.md`: output structure and TSV columns.
- `references/CHECKLIST.md`: review checklist.
- `scripts/generate_test_items.py`: project-specific generator.
- `scripts/validate_test_items.py`: validator for generated Markdown/TSV.

## 出典補完の項目化（2026-10-09）

- SCNの全DL行を項目化する。実連鎖・起点・終端を区別し、未知キーを単一シードで成功扱いしない。
- DP-N002以降の出典付き業務データ差分も実行対象にする。代表データだけを読み取って捨てない。
- `business_assertions.py` のHTML根拠・金額/数量/状態/宛先/CSV照合を使用する。原典引用の確認なしに定型的な成功期待を足さない。
- 別業務参照の工程を実行可能な形で展開し、親の実データを共有する。未採番IDは子の登録時に採番して記録する。参照先保留条件も継承する。
- 最後に `scenario_test/tools/audit_scenario_delivery.py` で実行用TSVまで同期を照合する。机上可否と実際のテスト実行は区別する。

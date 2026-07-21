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

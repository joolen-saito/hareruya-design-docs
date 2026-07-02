---
name: hareruya-scenario-test-items
description: Generate Hareruya scenario system-test item Markdown and TSV from scenario_test/scenario/SCN-*.md, using a 10-column Excel-friendly format similar to integration test case sheets.
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

- Keep the output close to the integration-test item format: Markdown introduction plus a `tsv` code fence.
- Use 10 columns fixed:
  `シナリオID`, `テストID`, `フロー種別`, `テスト観点`, `優先度`, `テスト項目名`, `前提条件`, `入力データ/対象`, `操作手順/実行方法`, `期待結果`
- Generate one TSV row for one observable assertion.
- Use normal scenario execution rows for `フロー種別=正常系`.
- Use branch execution rows for `フロー種別=代替系` or `異常系`.
- Do not merge alternative/error branches into normal test items.
- Keep `テストID` stable and deterministic: `STI-<SCN-ID-suffix>-NNN`.
- Test item names and execution steps must state who performs the operation and what business action is executed.
- Test item names must state the business result being checked, not just "正常確認".
- Expected results must be observable on screen, data state, CSV/report, mail/notification, external system, or operation history.
- Do not output vague phrases such as `設計どおり`, `設計書に記載のとおり`, `要確認`, `UI標準`, `何らか`, `必要に応じ`, or `適宜`.
- Aggregate TSV must be one physical line per test item. Collapse cell-internal newlines to ` / `.

## Resources

- `references/TEMPLATE.md`: output structure and TSV columns.
- `references/CHECKLIST.md`: review checklist.
- `scripts/generate_test_items.py`: project-specific generator.
- `scripts/validate_test_items.py`: validator for generated Markdown/TSV.

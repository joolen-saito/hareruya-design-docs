---
name: hareruya-backlog-drift-export
description: Verify Hareruya design-vs-implementation drift findings one by one and export confirmed Backlog-ready Markdown files with concrete design, base implementation, and ec-cube-enterprise source code snippets. Use when converting design_impl_drift_report findings into Backlog issue text that must cite exact source code locations and code fragments.
---

# Hareruya Backlog Drift Export

Use this skill after or alongside `design-impl-drift-audit` when the task is to turn confirmed drift findings into Backlog issue Markdown.

For the opposite direction — taking an already-filed Backlog issue and verifying whether it is a false positive — use `hareruya-backlog-factcheck`.

## Rule

Do not export candidates directly from `design_impl_drift_report/findings/*.json`. Export only items that have been rechecked and recorded as `status: "verified"` under `design_impl_drift_report/backlog_verified_items/`.

Verification is per finding. Do not batch-mark findings as verified from the HTML report count, JSON confidence value, or another agent's summary. For each exported item, re-open the design HTML and search both `ec-cube-enterprise` and the relevant base repository source. If the exact design requirement, current enterprise code, and base implementation code cannot all be cited with snippets, do not create or export the registry item.

Every exported item must cite all three evidence classes:

- `設計`: the exact HTML design requirement.
- `ec-cube-enterprise`: the current implementation or the nearest non-satisfying implementation path.
- `ベース実装`: the source behavior from `pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, or `deck-builder`.

Line numbers alone are insufficient. Include a tight snippet range that contains the relevant code or design text. For implementation claims, cite the concrete method, template block, repository call, entity mapping, command, API handler, CSV/PDF logic, or JavaScript branch.

## Workflow

1. Synchronize the queue:

```bash
python3 design_impl_drift_report/backlog_factcheck_workflow.py sync --write
python3 design_impl_drift_report/backlog_factcheck_workflow.py status
```

2. Pick exactly one candidate from the queue. Prefer `implementationGap: true` / `未実装` unless the user asks otherwise:

```bash
python3 design_impl_drift_report/backlog_factcheck_workflow.py next --implementation-gap-first --limit 10
```

3. Verify the design requirement in `excel_to_html/output/*.html`. Exclude Phase 2 or explicitly non-implemented scope.
4. Search the base repositories and `ec-cube-enterprise` with `rg` using route names, method names, Japanese text, table/column names, constants, translation keys, and nearby feature names.
5. Confirm that no alternate route, subscriber, service, template, locale, JS, command, API, CSV, or PDF implementation satisfies the requirement.
6. If the candidate is false, already implemented, too weak, or lacks base/enterprise evidence, mark the queue item instead of exporting it:

```bash
python3 design_impl_drift_report/backlog_factcheck_workflow.py reject --key '<sourceFinding>#<sourceFindingId>' --reason '<reason>'
python3 design_impl_drift_report/backlog_factcheck_workflow.py needs-review --key '<sourceFinding>#<sourceFindingId>' --reason '<reason>'
```

7. For candidates that appear true, request a critical review packet before export:

```bash
python3 design_impl_drift_report/backlog_factcheck_workflow.py review-pack --key '<sourceFinding>#<sourceFindingId>'
```

When an explicit reviewer is available, ask `codex gpt-5.5 high` to critically review the packet and the exact source snippets. Do not mark the item verified until review concerns are resolved.

8. Create one JSON file in `design_impl_drift_report/backlog_verified_items/<stable-id>.json`.
9. Run the harness:

```bash
python3 design_impl_drift_report/export_verified_backlog_items.py --id <stable-id>
```

Run from `hareruya-design-docs`, or pass `--registry-dir` and `--output-dir` explicitly.

## Registry Shape

Use JSON so the harness has no external dependency. Required fields:

- `id`, `status`, `classification`, `feature`, `issueCategory`, `issue`, `designBook`
- `sourceFinding`: the source finding JSON used as the starting candidate.
- `sourceFindingId`: the exact finding id inside `sourceFinding`.
- `reproSteps`: Backlog reproduction or confirmation steps.
- `expected`: design-required behavior.
- `current`: list of current-behavior paragraphs, each with `text` and `snippets`.
- `evidence`: snippet references for `設計`, `ec-cube-enterprise`, and `ベース実装`.
- `verification.commands`: the concrete commands used to check the design HTML, `ec-cube-enterprise`, and the base implementation.

The harness requires `sourceFindingId` to exist inside `sourceFinding`. It also requires `verification.commands` to include `rg` searches covering `excel_to_html/output`, `ec-cube-enterprise`, and one base repository. `current.snippets` must include code snippets from both `ec-cube-enterprise` and the base implementation.

Snippet objects require:

- `label`
- `path`, relative to `/home/y-saito/Developments`
- `start` and `end`
- `language`
- optional `contains` strings that must appear in the extracted range

Use `sourceFinding` when an existing finding JSON was the starting point.

## Output Contract

The harness emits one Markdown file per item under `design_impl_drift_report/backlog_markdown/` using this Backlog format:

```markdown
/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：
機能：
課題カテゴリ：
課題：
設計書：

# 再現手順【必須】
1.

# 期待される挙動【必須】
-

# 現在の挙動【必須】
-

# 根拠
- 設計：
- ec-cube-enterprise：
- ベース実装：
```

`現在の挙動` must include concrete source snippets for both `ec-cube-enterprise` and the base implementation. If either side cannot be cited, keep the item out of the verified registry.

## Quality Gate

Before final output:

```bash
python3 -m py_compile design_impl_drift_report/export_verified_backlog_items.py
python3 -m py_compile design_impl_drift_report/backlog_factcheck_workflow.py
python3 design_impl_drift_report/backlog_factcheck_workflow.py sync --write
python3 design_impl_drift_report/backlog_factcheck_workflow.py validate
python3 design_impl_drift_report/export_verified_backlog_items.py --dry-run
```

For a single item, use `--id <stable-id>` on both validation and export. If the harness fails, fix the registry evidence instead of weakening validation.

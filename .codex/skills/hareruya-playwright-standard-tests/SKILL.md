---
name: hareruya-playwright-standard-tests
description: Implement and audit Playwright E2E test code for Hareruya functions whose functions/todo-list.md customization category is 標準. Use when Codex must convert integration_test/e2e case Markdown into e2e/spec and e2e/pages code, create or update the harness that checks coverage, or continue standard-function Playwright rollout without weakening test oracles to match a failing implementation.
---

# Hareruya Playwright Standard Tests

## Overview

Use this skill to implement Playwright tests for Hareruya standard functions. The source of truth is the design document plus `integration_test/e2e/*_e2e_cases.md`; the running application is not the oracle.

## Workflow

1. Identify target functions from `functions/todo-list.md` where the customization category is `標準`.
2. Run the coverage harness:

```bash
python3 .codex/skills/hareruya-playwright-standard-tests/scripts/audit_standard_playwright.py --repo .
```

3. Open `e2e/reports/standard-playwright-coverage.md` and prioritize rows with missing E2E cases, spec files, or Page Object files.
4. For each function, read the matching files:
   - `functions/ec-cube-enterprise/<function-id>_*.md`
   - `integration_test/<normalized>_it_cases.md`
   - `integration_test/e2e/<normalized>_e2e_cases.md`
   - neighboring `e2e/spec/**/<normalized>.spec.ts` and `e2e/pages/**/<normalized>.page.ts` files
5. Implement `e2e/pages/...page.ts` and `e2e/spec/...spec.ts` following the existing local pattern:
   - Use `@playwright/test` directly.
   - Use `AdminLoginPage` and `ECCUBE_ADMIN_USER` / `ECCUBE_ADMIN_PASS` for admin authenticated cases.
   - When a matching seed exists in `e2e/seed/manifest.json`, apply it before execution and read its contract from `e2e/config/seed.config.ts` instead of leaving the case as `test.fixme`.
   - Run seed-backed specs with `eval "$(e2e/seed/lib/seed-env.sh)"` (from the repo root) or equivalent exported env vars so `M01_*`, `ORDER_ID`, and other manifest values are available.
   - Guard credential-dependent cases with `test.skip(!HAS_CREDS, "...")`.
   - Keep unauthenticated and non-destructive cases runnable without credentials.
   - Mark cases that require unavailable seeds or unsafe shared-environment mutation with `test.fixme` and a concrete reason.
   - Prefer Page Object locators grounded in design/Twig route names or stable DOM semantics.
6. Re-run the harness and TypeScript/Playwright validation:

```bash
python3 .codex/skills/hareruya-playwright-standard-tests/scripts/audit_standard_playwright.py --repo .
e2e/seed/lib/apply.sh <needed SEED ids>
eval "$(e2e/seed/lib/seed-env.sh)"
cd e2e && npx playwright test --list
```

## Oracle Rules

- Do not rewrite expected results to match the current implementation after a failure.
- Expected values must come from the design document, integration test case, documented messages, route definitions, or a clearly named seed prerequisite.
- If a test fails because the implementation violates the design, keep the test expectation and report the implementation mismatch.
- If the design is ambiguous, add a `test.fixme` with the missing prerequisite instead of encoding an implementation guess.
- Do not silently drop destructive or seed-dependent cases. Represent them in case Markdown and, when automation is intended, in spec with `test.fixme`.
- Once the blocking seed is present and non-destructive, convert the matching `test.fixme` to a live test and keep the expected result unchanged.

## File Mapping

- Function ID `M09-08` normalizes to `m09_08`.
- E2E cases live at `integration_test/e2e/m09_08_*_e2e_cases.md`.
- Admin specs live under `e2e/spec/admin/<module>/m09_08_*.spec.ts`.
- Admin Page Objects live under `e2e/pages/admin/<module>/m09_08_*.page.ts`.
- Login has legacy files at `e2e/spec/admin/login.spec.ts` and `e2e/pages/admin/login.page.ts`; the harness treats them as covered.

## Resources

- `scripts/audit_standard_playwright.py`: coverage harness for standard functions.
- `references/IMPLEMENTATION_RULES.md`: concise implementation checklist and naming rules.

## E2E Case TSV Format

- `integration_test/e2e/*_e2e_cases.md` uses a 14-column TSV in the first ```tsv fence.
- The first 10 columns match the integration-test case grain: `機能名`, `テストID`, `I/FID`, `テスト観点`, `優先度`, `テスト項目名`, `前提条件`, `入力データ/リクエスト内容`, `操作手順/実行方法`, `期待結果／レスポンス`.
- The last 4 columns are execution-management fields: `実施者`, `実施日`, `結果`, `失敗理由`.
- When creating or regenerating E2E case Markdown, include the last 4 columns and leave their data cells empty.

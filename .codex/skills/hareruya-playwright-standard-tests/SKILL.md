---
name: hareruya-playwright-standard-tests
description: Implement and audit Playwright E2E test code for Hareruya functions whose functions/todo-list.md customization category is 標準. Use when Codex must convert integration_test/e2e case Markdown into e2e/spec and e2e/pages code, establish screen reachability so transition-only screens (confirm/complete/wizard) are reached by traversal rather than direct URL, create or update the harness that checks coverage, or continue standard-function Playwright rollout without weakening test oracles to match a failing implementation.
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

3b. Establish screen reachability **before writing any spec for the function** (integration tests must
    traverse transitions, not open single URLs). See `references/TRANSITION_RULES.md`.

```bash
python3 .codex/skills/hareruya-playwright-standard-tests/scripts/extract_screen_transitions.py --repo .
python3 .codex/skills/hareruya-playwright-standard-tests/scripts/audit_transition_paths.py --repo .
```

   - Confirm the function's screen paths into `e2e/config/screen-reachability.tsv` with
     `根拠(file:line)` taken from the design doc sections `## 利用者視点の入口` / `## 画面遷移` /
     `### 遷移時に引き継ぐ状態`. The suggested-class output is a candidate list, never a decision.
   - A function whose paths are still `A-未登録` in the audit is not ready for spec work. Run the
     audit with `--scope <fid>` so unregistered paths inside the target are errors, not warnings.
   - `error 0` alone does not mean clean: read the 到達台帳カバレッジ line, since unregistered paths
     are simply not judged.
4. For each function, read the matching files:
   - `functions/ec-cube-enterprise/<function-id>_*.md`
   - `integration_test/<normalized>_it_cases.md`
   - `integration_test/e2e/<normalized>_e2e_cases.md`
   - neighboring `e2e/spec/**/<normalized>.spec.ts` and `e2e/pages/**/<normalized>.page.ts` files
5. Implement `e2e/pages/...page.ts` and `e2e/spec/...spec.ts` following the existing local pattern:
   - Import `test` / `expect` from `e2e/fixtures/reachability.fixture.ts` (a thin extension of
     `@playwright/test`); use `@playwright/test` directly only for specs that never navigate.
   - Reach screens through `e2e/helpers/navigation.ts` (`enter` / `reachVia` / `step` /
     `directAccess`), not raw `page.goto()`. `transition-only` screens must be reached from their
     entry screen through on-screen operations; direct access is allowed only when direct access is
     itself the viewpoint, and then it must carry a reason. Import `test` from
     `e2e/fixtures/reachability.fixture.ts` so a forgotten helper still fails at runtime.
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
python3 .codex/skills/hareruya-playwright-standard-tests/scripts/audit_transition_paths.py --repo . --scope <target fids> --strict
e2e/seed/lib/apply.sh <needed SEED ids>
eval "$(e2e/seed/lib/seed-env.sh)"
cd e2e && npx playwright test spec/_harness/navigation.selfcheck.spec.ts
cd e2e && npx playwright test --list
```

## Oracle Rules

- Do not rewrite expected results to match the current implementation after a failure.
- Expected values must come from the design document, integration test case, documented messages, route definitions, or a clearly named seed prerequisite.
- If a test fails because the implementation violates the design, keep the test expectation and report the implementation mismatch.
- If the design is ambiguous, add a `test.fixme` with the missing prerequisite instead of encoding an implementation guess.
- Do not silently drop destructive or seed-dependent cases. Represent them in case Markdown and, when automation is intended, in spec with `test.fixme`.
- Once the blocking seed is present and non-destructive, convert the matching `test.fixme` to a live test and keep the expected result unchanged.

## Logical Naming (no physical names)

Full rules: `.cursor/skills/logical-naming/SKILL.md`. Summary:

- Never write internal identifiers (translation keys, session keys, flash keys, route bind names) or
  DB physical names (`dtb_` / `mtb_` / `plg_`) in case Markdown, spec/page comments, or oracle text.
  Writing them "as evidence" alongside the logical name is also forbidden.
- Resolve logical names from `e2e/config/logical-names.tsv` (物理名 / 種別 / 論理名 / 機能ID / 出典 / 状態).
  Add a row with evidence before using a name that is missing; never invent one.
- Out of scope (keep physical): selectors and form field id/name, `file:line` provenance, HTTP paths
  and methods, command names, executable SQL and seed definitions (`e2e/seed`, `e2e/db`).
- When a translation key is undefined and the raw key would render, report it as a defect candidate;
  do not make the raw key string the expected value.
- Existing files are baselined, so only newly added physical names fail the audit.

## File Mapping

- Function ID `M09-08` normalizes to `m09_08`.
- E2E cases live at `integration_test/e2e/m09_08_*_e2e_cases.md`.
- Admin specs live under `e2e/spec/admin/<module>/m09_08_*.spec.ts`.
- Admin Page Objects live under `e2e/pages/admin/<module>/m09_08_*.page.ts`.
- Login has legacy files at `e2e/spec/admin/login.spec.ts` and `e2e/pages/admin/login.page.ts`; the harness treats them as covered.

## Resources

- `scripts/audit_standard_playwright.py`: coverage harness for standard functions.
- `scripts/extract_screen_transitions.py`: deterministic extraction of screen-transition facts from
  the design docs (`## 利用者視点の入口` / `## 画面遷移` / `### 遷移時に引き継ぐ状態`) plus a
  candidate reachability list. Facts only — it never decides a class.
- `scripts/audit_transition_paths.py`: transition-path audit over spec/page code and case TSVs.
- `references/IMPLEMENTATION_RULES.md`: concise implementation checklist and naming rules.
- `references/TRANSITION_RULES.md`: screen reachability rules (registry, `reachVia`, direct-access
  declaration, audit severities).
- `e2e/config/screen-reachability.tsv`: reachability registry (evidence `file:line` required).
- `e2e/helpers/navigation.ts`: navigation helpers that enforce the registry at runtime.
- `e2e/fixtures/reachability.fixture.ts`: `test` fixture that replaces `page.goto` so raw navigation
  is checked against the registry even when the helpers are bypassed.
- `e2e/spec/_harness/navigation.selfcheck.spec.ts`: harness self-check (runs without a live app).
- `.cursor/skills/logical-naming/scripts/audit_logical_naming.py`: logical-naming audit (physical
  names in test assets / harness), baselined at `.cursor/skills/logical-naming/baseline.tsv`.
- `.cursor/skills/logical-naming/scripts/build_logical_name_map.py`: regenerates the message rows of
  `e2e/config/logical-names.tsv` from `message_inventory/` (deterministic join; no hand edits).
- `e2e/config/logical-names.tsv`: physical → logical name registry (evidence required).
- `e2e/spec/_harness/logical-naming.selfcheck.spec.ts`: harness self-check for the registry and the
  audit (runs without a live app).

## E2E Case TSV Format

- `integration_test/e2e/*_e2e_cases.md` uses a 14-column TSV in the first ```tsv fence.
- The first 10 columns match the integration-test case grain: `機能名`, `テストID`, `I/FID`, `テスト観点`, `優先度`, `テスト項目名`, `前提条件`, `入力データ/リクエスト内容`, `操作手順/実行方法`, `期待結果／レスポンス`.
- The last 4 columns are execution-management fields: `実施者`, `実施日`, `結果`, `失敗理由`.
- When creating or regenerating E2E case Markdown, include the last 4 columns and leave their data cells empty.
- Rows targeting a `transition-only` screen must describe the whole path: `操作手順/実行方法` chains
  from the entry screen with 「→」, and `入力データ/リクエスト内容` names the entry point and the
  transition trigger, not just the final request. `audit_transition_paths.py` checks both.

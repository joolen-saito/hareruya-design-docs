# Implementation Rules

## Scope

- Target only rows in `functions/todo-list.md` whose customization category is `標準`.
- Prefer functions with an existing `integration_test/e2e/*_e2e_cases.md` file and missing/thin `e2e/spec` coverage.
- Keep standard-function expectations aligned to ec-cube-enterprise design, not current defects.
- Exclude Ph2 (phase-2 and later) whole-function features. Their Excel design docs carry a shape/textbox note such as `…はPh2で対応するため、Ph1では実装しない` / `Ph2で対応` / `フェーズ2以降で設計予定`. Do not create or keep `e2e_cases.md`, `e2e/spec`, or `e2e/pages` for them (not even as `test.fixme`). Current set: M03-43, M04-06, M04-07, M06-13, M08-11, M08-15, M08-16, A06-14, B01-02, B01-03, F02-05. The generator drivers (`.codex/e2e_workflow.js` / `e2e_review.js` / `e2e_audit.js`) skip these via their `EXCLUDED_STEMS` set.

## Spec Pattern

- Start with unauthenticated direct-access tests when the screen is admin-only.
- Add authenticated display/navigation tests guarded by credentials.
- Add mutation tests only when rollback or a dedicated seed is available.
- Add `test.fixme` for planned automation blocked by seed, environment setting, external service, or destructive shared-state risk.
- Do not mirror every manual or out-of-scope E2E case as `fixme`; keep those in the case Markdown.

## Page Object Pattern

- Keep one class per function page where possible.
- Store route URLs in the Page Object using `ECCUBE_ADMIN_ROUTE`.
- Expose locators for stable screen regions and commands.
- Put design/Twig/message provenance in comments only where it prevents future oracle drift.

## Verification

Run these before finishing a rollout slice:

```bash
python3 .codex/skills/hareruya-playwright-standard-tests/scripts/audit_standard_playwright.py --repo .
cd e2e && npx playwright test --list
```

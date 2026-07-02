# Implementation Rules

## Scope

- Target only rows in `functions/todo-list.md` whose customization category is `標準`.
- Prefer functions with an existing `integration_test/e2e/*_e2e_cases.md` file and missing/thin `e2e/spec` coverage.
- Keep standard-function expectations aligned to ec-cube-enterprise design, not current defects.

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

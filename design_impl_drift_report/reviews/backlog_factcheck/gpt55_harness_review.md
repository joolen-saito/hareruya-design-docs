# gpt-5.5 high Critical Review: Backlog Drift Export Harness

Date: 2026-07-08

## Findings And Actions

1. No all-findings coverage gate.
   - Action: added `backlog_factcheck_workflow.py` and `backlog_factcheck_queue.json` to track every finding with `pending`, `verified`, `rejected`, or `needs_review`.

2. `sourceFinding` was file-level, not finding-level.
   - Action: added required `sourceFindingId` to verified registry items and validator checks that the ID exists in the source finding JSON.

3. Unverified export was explicitly allowed.
   - Action: removed `--include-unverified`; exporter now writes only `status: "verified"` items.

4. Verification commands were string-checked, not fact-checked.
   - Action: kept command-string checks, added queue/review workflow. Remaining risk: command output capture and rerunnable zero-hit assertions are not yet automated.

5. Evidence labels could be spoofed.
   - Action: evidence classification now uses allowlisted source paths, not labels.

6. Snippet validation proved existence, not relevance.
   - Action: all snippets now require non-empty `contains` assertions.

7. Backlog registry dropped report comparison structure.
   - Action: exporter now validates that the referenced source finding is `CONFIRMED` and has `comparisonRows`. Remaining risk: comparison rows are not rendered into the Backlog Markdown body.

## Review Result

The previous 6 verified registry items were updated to satisfy the stronger gates and revalidated.

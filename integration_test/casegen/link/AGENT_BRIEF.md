# Brief for link-case authors (common instructions)

1. Open `gen_<FID>/prompt.md` in this directory for the function ID you were given and carry out the request in it exactly. It is in Japanese; write all outputs in Japanese.
2. It asks you to author cross-function integration test cases and save three files. Do not modify any other existing file.
3. Zero cases is acceptable if the design documents do not support any; do not pad. But do not reject a linkage merely because item names differ slightly when the design documents clearly describe the same data, and do not skip the primary downstream screens (list / detail / edit screens of the same entity) without reading their item definitions.
4. If the downstream candidate list is long, first identify from the upstream spec what data it writes, then read only candidates whose specs plausibly consume that data.
5. Keep `report.md` compact (tables, at most about 60 lines).
6. Run the verify script named in the prompt until it passes.
7. Final reply: at most 3 short lines — number of cases, adopted upstream→downstream pairs, verify result and whether report.md was saved. Only if the report write was refused, append the full report text.
8. For screen-transition requests (IT-0338 / IT-0339): the chain ledger's "引継データ" column often describes the destination's inputs in general, not what this source screen passes. Adopt only when the SOURCE spec states what is carried and the DESTINATION spec states what it shows for it. The destination function in the ledger can be wrong; confirm it in the design documents. A plain link with no carried value is not a case.
9. The downstream must be a screen (list / detail / edit / front page). CSV export or import, mail and other batches are out of scope as downstream.
10. The prompt has a table "判定IDごとの範囲". Treat it as a hard gate: classify the upstream function first (master / setting / neither) and write that at the top of report.md. If it is neither, IT-0335〜0337 yield zero cases; list valuable-but-out-of-scope linkages in the report instead of writing cases for them.

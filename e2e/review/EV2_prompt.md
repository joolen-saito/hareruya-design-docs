# レビュー依頼: E2E のエビデンス基盤とスキル（2巡目・範囲を絞る）

読み取りだけ。前回の指摘（e2e/review/EV1_out.txt の末尾）への扱いは e2e/review/EV1_disposition.md。
その扱いが正しく実装されたか、直したことで新しい誤りが入っていないかだけを確かめる。

対象: e2e/lib/case.ts・e2e/lib/evidence.ts・e2e/lib/evidence_reporter.ts・e2e/tools/evidence_index.mjs・e2e/tools/evidence_check.mjs・
e2e/tools/evidence_judgements.py・e2e/tools/run_evidence.sh・e2e/tools/pw_run.sh・.codex/skills/hareruya-e2e-case-evidence/（SKILL.md と references/）・
.cursor/skills/logical-naming/scripts/audit_logical_naming.py の除外の1行。
（M03-14 を裏で流し直している最中なので、e2e/evidence/M03-14/ は書き換わっていく。）

前回と同じ主張の再提示、却下した8の再提示、文体の好みは書かない。

出力: 新しい事実の誤りが無ければ `NONE` の1語。あれば1件ごとに 主張 / 実際（file:line・再現の入力）/ 判定 / 修正案。

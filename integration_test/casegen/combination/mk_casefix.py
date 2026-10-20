#!/usr/bin/env python3
"""ケースのレビューの束ごとに、直しの依頼文を作る。 mk_casefix.py <巡> [束...] → prompts/R<巡>_NN_fix.md
束を書かないときは、指摘があるか前提条件の検査の不合格（review/<機能ID>_gate.txt）がある束を全部。"""
import csv, pathlib, sys
G = pathlib.Path(__file__).resolve().parent
rnd = sys.argv[1]
tpl = (G / "CASEFIX_ROLLOUT_PROMPT.md").read_text(encoding="utf-8")
notes = (G / "review/notes/casefix_rules_1020.md").read_text(encoding="utf-8").strip()
B = list(csv.DictReader(open(G / f"review/R{rnd}_bundles.tsv", encoding="utf-8"), delimiter="\t"))
want = set(sys.argv[2:])
for r in B:
    name = r["束"].split("_", 1)[1]
    us = r["対象"].split(" ")
    gate = [u.split(":")[0] for u in us if (G / f"review/{u.split(':')[0]}_gate.txt").exists()]
    if want and r["束"] not in want:
        continue
    if not want and int(r["指摘"] or 0) == 0 and not (rnd == "1" and gate):
        continue
    t = tpl.replace("{ROUND}", rnd).replace("{BUNDLE}", name).replace("{TARGETS}", "・".join(us)).replace("{NOTES}", notes)
    if rnd != "1":
        t = t.replace("- 前提条件の検査の不合格（ある機能だけ）", "- 前提条件の検査の不合格（ある機能だけ。1巡目で直した残り）")
    (G / f"prompts/R{rnd}_{name}_fix.md").write_text(t, encoding="utf-8")
    print(f"R{rnd}_{name}_fix", r["指摘"] or 0, "gate:" + ",".join(gate) if gate else "")

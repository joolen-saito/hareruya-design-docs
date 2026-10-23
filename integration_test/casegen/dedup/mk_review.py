#!/usr/bin/env python3
"""判定表（judg/*.tsv）の外す行を codex の事実確認の束に分ける。 mk_review.py [1束の行数]
review/V_<nn>_targets.tsv と review/V_<nn>_prompt.md、review/v_batches.tsv を書く。機能をまたぐ表は X 束にまとめる。"""
import csv, pathlib, sys
D = pathlib.Path(__file__).resolve().parent
N = int(sys.argv[1]) if len(sys.argv) > 1 else 40
H = ["外すテストID", "残すテストID", "種別", "根拠", "理由"]
cb = {l.split("\t")[0] for l in open(D.parent / "combination/cb_map.tsv", encoding="utf-8")}
inner, cross, gated = [], [], []
for p in sorted((D / "judg").glob("*.tsv")):
    rs = [l.rstrip("\n").split("\t") for l in open(p, encoding="utf-8") if l.strip()][1:]
    for r in rs:
        if r[0] in cb and r[2] == "同値":   # 機械検査で弾く（組合せのケースは同値で外さない）
            gated.append(r); continue
        (cross if p.stem.startswith("_cross") else inner).append(r)
batches, cur = [], []
for r in inner:          # 機能の途中で切らない
    if cur and len(cur) >= N and cur[-1][0][3:9] != r[0][3:9]:
        batches.append(cur); cur = []
    cur.append(r)
if cur: batches.append(cur)
if cross: batches.append(cross)
tpl = (D / "VERIFY_PROMPT.md").read_text(encoding="utf-8")
out = ["束\t行数\t機能\n"]
for k, b in enumerate(batches, 1):
    name = f"V_{k:02d}"
    (D / f"review/{name}_targets.tsv").write_text("\t".join(H) + "\n" + "".join("\t".join(r) + "\n" for r in b), encoding="utf-8")
    (D / f"review/{name}_prompt.md").write_text(tpl.replace("{NAME}", name), encoding="utf-8")
    out.append(f"{name}\t{len(b)}\t{','.join(sorted({r[0][3:9] for r in b}))}\n")
(D / "review/v_batches.tsv").write_text("".join(out), encoding="utf-8")
(D / "review/gated.tsv").write_text("\t".join(H) + "\n" + "".join("\t".join(r) + "\n" for r in gated), encoding="utf-8")
print(f"束 {len(batches)}・行 {sum(map(len, batches))}・機械検査で戻す {len(gated)}")

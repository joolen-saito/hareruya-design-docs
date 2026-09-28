#!/usr/bin/env python3
"""判定を1本にまとめ、「維持」を論点の単位に集約する。

出力（S/out/）:
  hold_rejudge.tsv  保留1245件の判定（1ケース1行）
  issues.tsv        論点台帳（同じ機能で論点の文言が同じケースを1論点にまとめる）
"""
import collections, pathlib, sys

S = pathlib.Path(sys.argv[1])
OUT = S / "out"
OUT.mkdir(exist_ok=True)
rows = []
for p in sorted((S / "judge").glob("b*.tsv")):
    ls = p.read_text(encoding="utf-8").rstrip("\n").split("\n")
    hdr = ls[0].split("\t")
    rows += [dict(zip(hdr, l.split("\t"))) for l in ls[1:]]
ids = [r["テストID"] for r in rows]
assert len(ids) == len(set(ids)), "重複"

issues = collections.OrderedDict()
for r in rows:
    r["論点ID"] = ""
    if r["判定"] != "維持":
        continue
    key = (r["機能ID"], r["論点"].strip())
    if key not in issues:
        n = sum(1 for k in issues if k[0] == r["機能ID"]) + 1
        issues[key] = {"論点ID": f"Q-{r['機能ID']}-{n:02d}", "分類": collections.Counter(),
                       "決める人": collections.Counter(), "ケース": [], "引用": []}
    it = issues[key]
    r["論点ID"] = it["論点ID"]
    it["分類"][r["分類"]] += 1
    it["決める人"][r["決める人"]] += 1
    it["ケース"].append(r["テストID"])
    if r["根拠引用"].strip() and r["根拠引用"] not in it["引用"]:
        it["引用"].append(r["根拠引用"])

# 機能横断の共通論点（手順2の後半。group_*.tsv があれば取り込む）
grp = {}
for p in sorted(OUT.glob("group_*.tsv")):
    for l in p.read_text(encoding="utf-8").rstrip("\n").split("\n")[1:]:
        c = l.split("\t") + ["", ""]
        grp[c[0]] = (c[1].strip(), c[2].strip())
# group_*.tsv は issues_v1.tsv の論点IDで書かれている。論点の文言が後で変わると
# 論点IDが振り直されるので、(機能ID, 文言) で引き直す
v1 = {}
if (OUT / "issues_v1.tsv").exists():
    for l in (OUT / "issues_v1.tsv").read_text(encoding="utf-8").rstrip("\n").split("\n")[1:]:
        c = l.split("\t")
        v1[c[0]] = (c[1], c[4])
bytext = {v1[k]: g for k, g in grp.items() if k in v1}
grp = {it["論点ID"]: bytext[key] for key, it in issues.items() if key in bytext}
lost = [k for k in bytext if k not in issues]
if lost:
    print("共通論点から外れた論点（文言が変わった）:", len(lost))
    for k in lost: print("  ", k[0], bytext[k][0], k[1][:60])
for r in rows:
    r["共通論点ID"], r["共通論点"] = grp.get(r["論点ID"], ("", ""))
with (OUT / "issues.tsv").open("w", encoding="utf-8") as w:
    w.write("\t".join(["論点ID", "機能ID", "分類", "決める人", "論点", "ケース数", "テストID", "根拠引用", "共通論点ID", "共通論点"]) + "\n")
    for (fid, text), it in issues.items():
        cat = "／".join(k for k, _ in it["分類"].most_common())
        who = "／".join(k for k, _ in it["決める人"].most_common())
        g = grp.get(it["論点ID"], ("", ""))
        w.write("\t".join([it["論点ID"], fid, cat, who, text, str(len(it["ケース"])),
                           ",".join(it["ケース"]), " || ".join(it["引用"]), g[0], g[1]]) + "\n")
cols = ["テストID", "機能ID", "判定", "分類", "決める人", "論点ID", "論点", "共通論点ID", "共通論点", "根拠引用", "生成後の変化", "説明"]
with (OUT / "hold_rejudge.tsv").open("w", encoding="utf-8") as w:
    w.write("\t".join(cols) + "\n")
    for r in rows:
        w.write("\t".join(r[c] for c in cols) + "\n")

# 質問の単位 = 共通論点 + 単独の論点
q = collections.OrderedDict()
for (fid, text), it in issues.items():
    g = grp.get(it["論点ID"], ("", ""))
    key = g[0] or it["論点ID"]
    e = q.setdefault(key, {"文": g[1] or text, "分類": set(), "決める人": set(), "機能": [], "論点": [], "ケース": 0})
    e["分類"].update(it["分類"]); e["決める人"].update(it["決める人"])
    if fid not in e["機能"]: e["機能"].append(fid)
    e["論点"].append(it["論点ID"]); e["ケース"] += len(it["ケース"])
with (OUT / "questions.tsv").open("w", encoding="utf-8") as w:
    w.write("\t".join(["質問ID", "分類", "決める人", "質問", "機能数", "論点数", "ケース数", "機能ID", "論点ID"]) + "\n")
    for k, e in q.items():
        w.write("\t".join([k, "／".join(sorted(e["分類"])), "／".join(sorted(e["決める人"])), e["文"],
                           str(len(e["機能"])), str(len(e["論点"])), str(e["ケース"]),
                           ",".join(e["機能"]), ",".join(e["論点"])]) + "\n")
print("質問", len(q), "（共通論点", sum(1 for k in q if k.startswith("G-")), "）",
      dict(collections.Counter("／".join(sorted(e["決める人"])) for e in q.values())))

v = collections.Counter(r["判定"] for r in rows)
c = collections.Counter(r["分類"] for r in rows if r["判定"] == "維持")
mixed = [i["論点ID"] for i in issues.values() if len(i["分類"]) > 1]
print("ケース", len(rows), dict(v))
print("維持の分類", dict(c))
print("論点", len(issues), "（うち分類が割れた論点", len(mixed), "）", mixed[:10])
print("決める人", dict(collections.Counter(
    "／".join(k for k, _ in i["決める人"].most_common()) for i in issues.values())))

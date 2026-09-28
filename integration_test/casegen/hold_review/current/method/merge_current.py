#!/usr/bin/env python3
"""現行ソース調査の結果を論点台帳・質問の一覧に取り込む。

出力（S/current/final/）:
  current_answers.tsv  論点ごとの現行の答え（1133件）
  issues.tsv           論点台帳に現行の判定・答え・使えるか・次の扱いを足したもの
  questions.tsv        質問の一覧に、現行で答えが出た論点の数と次の扱いを足したもの
"""
import collections, csv, pathlib, sys

S = pathlib.Path(sys.argv[1])
OUT = S / "current/final"
OUT.mkdir(exist_ok=True)


def read(p):
    return list(csv.DictReader(p.open(encoding="utf-8"), delimiter="\t"))


cur = {}
for p in sorted((S / "current/out").glob("c[0-9][0-9].tsv")):
    for r in read(p):
        cur[r["論点ID"]] = r
iss = read(S / "out/issues.tsv")
missing = [r["論点ID"] for r in iss if r["論点ID"] not in cur]
assert not missing, f"調査結果の無い論点 {missing[:5]}"


def next_step(r, c):
    v, use = c["現行の判定"], c["使えるか"]
    if r["決める人"] == "テスト側":
        return "テスト側で決める（現行の答えを参考にできる）" if v in ("現行で確定", "現行で一部") else "テスト側で決める"
    if v == "現行で確定" and use == "可":
        return "現行の答えで期待結果を決められる（設計者の確認は任意）"
    if v == "現行で一部" and use == "可":
        return "現行で一部決まる。残りを設計者に聞く"
    if use == "参考のみ":
        return "設計者に聞く（現行の答えを判断材料として添える）"
    if use == "不可":
        return "設計者に聞く（現行は刷新の指示と食い違う）"
    return "設計者に聞く（現行に答えが無い）"


cols = ["論点ID", "機能ID", "現行の判定", "現行での答え", "根拠", "使えるか", "補足"]
with (OUT / "current_answers.tsv").open("w", encoding="utf-8") as w:
    w.write("\t".join(cols) + "\n")
    for r in iss:
        w.write("\t".join(cur[r["論点ID"]][c] for c in cols) + "\n")

icols = list(iss[0].keys()) + ["現行の判定", "現行での答え", "使えるか", "次の扱い"]
for r in iss:
    c = cur[r["論点ID"]]
    r.update({"現行の判定": c["現行の判定"], "現行での答え": c["現行での答え"],
              "使えるか": c["使えるか"], "次の扱い": next_step(r, c)})
with (OUT / "issues.tsv").open("w", encoding="utf-8") as w:
    w.write("\t".join(icols) + "\n")
    for r in iss:
        w.write("\t".join(r[k] for k in icols) + "\n")

byid = {r["論点ID"]: r for r in iss}
qs = read(S / "out/questions.tsv")
qcols = list(qs[0].keys()) + ["現行で決まる論点", "現行で一部の論点", "現行に無しの論点", "次の扱い"]
with (OUT / "questions.tsv").open("w", encoding="utf-8") as w:
    w.write("\t".join(qcols) + "\n")
    for q in qs:
        rs = [byid[i] for i in q["論点ID"].split(",")]
        ok = sum(1 for r in rs if r["現行の判定"] == "現行で確定" and r["使えるか"] == "可")
        part = sum(1 for r in rs if r["現行の判定"] in ("現行で確定", "現行で一部")) - ok
        none = len(rs) - ok - part
        steps = collections.Counter(r["次の扱い"] for r in rs)
        q.update({"現行で決まる論点": str(ok), "現行で一部の論点": str(part), "現行に無しの論点": str(none),
                  "次の扱い": steps.most_common(1)[0][0] if len(steps) == 1 else "論点ごとに異なる（issues.tsv を参照）"})
        w.write("\t".join(q[k] for k in qcols) + "\n")

print("論点", len(iss))
print("現行の判定", dict(collections.Counter(r["現行の判定"] for r in iss)))
print("使えるか", dict(collections.Counter(r["使えるか"] for r in iss)))
print("次の扱い（論点）")
for k, v in collections.Counter(r["次の扱い"] for r in iss).most_common():
    print(f"  {v:4d} {k}")
print("次の扱い（質問）")
for k, v in collections.Counter(q["次の扱い"] for q in qs).most_common():
    print(f"  {v:4d} {k}")

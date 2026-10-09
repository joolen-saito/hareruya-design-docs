#!/usr/bin/env python3
"""対応機能が無い・複数あるシートの抜けを、どの機能のケースにするか決めるための入力を作る。 build_assign.py

assign/<単位>_in.tsv   そのシートの抜け
assign/<単位>_prompt.md 依頼文（候補は同じ冊子でケースを持つ機能）
"""
import csv, pathlib, re, collections
G = pathlib.Path(__file__).resolve().parent
CG = G.parent
ROOT = CG.parents[1]
R = list(csv.DictReader(open(CG / "coverage_audit/confirmed_gaps.tsv", encoding="utf-8"), delimiter="\t", quoting=csv.QUOTE_NONE))
names = {}
for l in open(ROOT / "functions/todo-list.md", encoding="utf-8"):
    c = [x.strip() for x in l.split("|")]
    if len(c) > 7 and re.fullmatch(r"[A-Z]\d\d-\d\d", c[5]):
        names[c[5]] = c[4]
U = {(r["書番"], r["シートID"]): r for r in csv.DictReader(open(CG / "coverage_audit/units.tsv", encoding="utf-8"), delimiter="\t")}
book_f = collections.defaultdict(dict)
for r in U.values():
    for f in filter(None, r["機能"].split(",")):
        if (CG / f"cases/{f}_test_cases.tsv").exists():
            book_f[r["書番"]].setdefault(f, []).append(r["シート名"])
by = collections.defaultdict(list)
for r in R:
    if not r["機能"] or "," in r["機能"]:
        by[r["単位"]].append(r)
for u, rows in by.items():
    b = u[:4]
    with open(G / f"assign/{u}_in.tsv", "w", encoding="utf-8", newline="") as f:
        w = csv.writer(f, delimiter="\t", lineterminator="\n", quoting=csv.QUOTE_NONE, quotechar=None, escapechar="\\")
        w.writerow(["指摘ID", "行", "記述", "1巡目が挙げたテストID", "理由"])
        for r in rows:
            w.writerow([r["指摘ID"], r["行"], r["記述"], r["テストID"], r["理由"]])
    multi = rows[0]["機能"].split(",") if rows[0]["機能"] else None
    cand = "\n".join(f"| {f} | {names.get(f, '')} | {'、'.join(dict.fromkeys(s))} |" for f, s in sorted(book_f[b].items()) if not multi or f in multi)
    (G / f"assign/{u}_prompt.md").write_text(f"""# 依頼: シート「{rows[0]['シート名']}」（{u}）の抜け{len(rows)}件を、どの機能の結合テストケースにするか決める

リポジトリ `/home/y-saito/Developments/hareruya-design-docs/`。出力は日本語。ファイルは下の出力1つだけを書く。

このシートは{'複数の機能に対応する' if multi else '対応する機能が無い（別添資料・共通処理など）'}ため、被覆監査で見つかった「ケースが無い定め」を、どの機能のケースとして書くかが決まっていない。
1件ずつ、**その定めのふるまいを実際に起こす操作・処理を持つ機能**を、下の候補から1つ選べ。

- 抜けの一覧: `integration_test/casegen/gapfill/assign/{u}_in.tsv`
- 設計書（行頭 L0001 が行番号）: `integration_test/casegen/coverage_audit/units/{u}/sheet.txt`
- 候補の機能の設計書は `integration_test/casegen/coverage_audit/units/{b}_<シートID>/sheet.txt`（対応は `coverage_audit/units.tsv`）、既存ケースは `integration_test/casegen/cases/<機能ID>_test_cases.tsv`。必要な分だけ読む。

決め方:
- 1巡目がテストIDを挙げている（一部抜け）なら、原則そのテストIDの機能。
- 複数の機能で同じふるまいが起きる定め（例: 「各機能で在庫チェックを行う」）は、理由に書かれている未確認の操作を持つ機能を選ぶ。決め手が無ければ、その定めをいちばん直接に実行する機能。
- 候補のどれにも当たらないときだけ、機能IDを `該当なし` とし、理由を書く。

候補（同じ冊子でケースを持つ機能）:

| 機能ID | 機能名 | シート |
| --- | --- | --- |
{cand}

出力: `integration_test/casegen/gapfill/assign/{u}_out.tsv`（ヘッダつきタブ区切り・全{len(rows)}件）

```
指摘ID	機能ID	理由
```

返答は、機能IDごとの件数を1行で。
""", encoding="utf-8")
print(len(by), "単位", sum(len(v) for v in by.values()), "件")
print(" ".join(sorted(by)))

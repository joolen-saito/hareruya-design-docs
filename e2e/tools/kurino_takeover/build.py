#!/usr/bin/env python3
"""
栗野さん分の巻き取り（2026-11-21 依頼者「栗野さん担当分も巻き取って進めて」）の、流す対象を項目表の写しから作る。

- 対象: e2e/review/WORK_SPLIT.tsv で栗野さんの機能のうち、結合試験項目表で実施者が空欄（か「E2E（Playwright）」）の行。
- 流す対象（.runs/kurino/run.tsv）: テストがあり、流せない一覧（config/sheet_not_runnable*.tsv）に無く、
  開発環境の結果がまだ無い・手元だけ・スキップ・未判定のもの。共有の設定を書き換えて戻すシードの機能（SKIP）と、
  消してよいの表に無い「消す」シードを使うもの（人の行に触れうる）は除く。
- 出力: .runs/kurino/blank.tsv（機能・項目表のID・E2EのID・区分）と run.tsv（機能・E2EのID）。

使い方: excel_to_html/.venv/bin/python e2e/tools/kurino_takeover/build.py <項目表の写し.xlsx>
（リポジトリの直下で流す）
"""
import collections
import csv
import glob
import json
import os
import re
import sys

import openpyxl

csv.field_size_limit(10**9)
OUT = "e2e/.runs/kurino/"
# 共有の設定を書き換えて戻すシード（11/21 に戻しのボタンの時間切れが2回）や、作り方が重すぎて止めている機能。判断待ち20・22番
SKIP = set("F01-01 F01-02 F02-03 F02-04 F03-03 F03-07 F06-05 F06-08 F06-22 F06-26 F08-03 F08-04 F08-05 F09-05 "
           "M06-03 M06-04 M07-01 M07-04 M08-02 M10-05 M10-15 M16-04 M06-10 M06-11".split())
# 開発環境では前提が作れず、流しても同じところで止まると分かっている機能（11/22〜23 の流しで確かめた。理由は e2e/review/kurino_takeover_2026-11-22_dev.md）
SKIP |= set("F02-02 F03-06 F09-04 F10-01".split())


def main() -> None:
    wb = openpyxl.load_workbook(sys.argv[1], read_only=True, data_only=True)
    rows = wb["テストケース"].iter_rows(values_only=True)
    for r in rows:
        if r and "テストID" in r:
            hdr = list(r)
            break
    iid, ie = hdr.index("テストID"), hdr.index("実施者")
    kur = {r[0] for r in csv.reader(open("e2e/review/WORK_SPLIT.tsv"), delimiter="\t") if len(r) > 1 and r[1].startswith("栗野")}
    idmap = {r[0]: r[1] for r in csv.reader(open("integration_test/casegen/all_test_cases_id_map.tsv"), delimiter="\t")}
    tested = set()
    for p in glob.glob("e2e/spec/**/*.spec.ts", recursive=True):
        tested |= set(re.findall(r'caseTest\("(IT-[A-Z0-9]+-\d+-\d+)"', open(p, encoding="utf-8").read()))
    nr = set()
    for p in glob.glob("e2e/config/sheet_not_runnable*.tsv"):
        nr |= {r[0] for r in csv.reader(open(p), delimiter="\t") if r}
    ok = {r[0] for r in csv.reader(open("e2e/config/shared_env_delete_ok.tsv"), delimiter="\t") if len(r) > 1 and r[1].strip() == "消してよい"}
    seedtxt = {}
    for p in glob.glob("integration_test/casegen/cases/*_seed_data.tsv"):
        for r in csv.reader(open(p), delimiter="\t"):
            if r and r[0].startswith("S-") and len(r) > 5:
                seedtxt[r[0]] = r[5]
    cs = {}
    for p in glob.glob("integration_test/casegen/cases/*_test_cases.tsv"):
        for r in csv.reader(open(p), delimiter="\t"):
            if r and r[0].startswith("IT-") and len(r) > 6:
                cs[r[0]] = [s.strip() for s in r[6].split(",") if s.strip()]

    def devstat(e: str) -> str:
        f = "-".join(e.split("-")[1:3])
        p = f"e2e/evidence/{f}/{e}/result.json"
        if not os.path.exists(p):
            return "なし"
        try:
            r = json.load(open(p))
        except Exception:
            return "?"
        if r.get("環境", {}).get("E2E_ENV") != "dev":
            return "手元のみ"
        return "dev:" + r["結果"]

    blank, run, c = [], [], collections.Counter()
    for r in rows:
        if not r or not r[iid]:
            continue
        t = str(r[iid])
        f = "-".join(t.split("-")[1:3])
        if f not in kur or str(r[ie] or "").strip() not in ("", "E2E（Playwright）"):
            continue
        e = idmap.get(t, "")
        k = ("テストあり" if e in tested else "テストなし") + "/" + ("流せない一覧" if (e in nr or t in nr) else "-") + "/" + devstat(e)
        blank.append((f, t, e, k))
        c[k] += 1
        if not k.startswith("テストあり/-/") or k.endswith("dev:合格") or k.endswith("dev:不合格") or f in SKIP:
            continue
        if any(re.search("削除|消す|消して|0件にする", seedtxt.get(s, "")) and s not in ok for s in cs.get(e, [])):
            continue
        run.append((f, e))
    with open(OUT + "blank.tsv", "w") as fo:
        fo.writelines("\t".join(x) + "\n" for x in blank)
    with open(OUT + "run.tsv", "w") as fo:
        fo.writelines(f"{f}\t{e}\n" for f, e in run)
    for k, n in c.most_common():
        print(n, k)
    print("流す", len(run), " ".join(f"{k}:{v}" for k, v in sorted(collections.Counter(f for f, _ in run).items())))


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
栗野さんの機能で、項目表の実施者が空欄だった行（.runs/kurino/blank.tsv。build.py が作る）のうち、
開発環境で合格したケースと、判定の表で不合格にして起票済み（台帳にある）のケースを、config/sheet_split_exceptions.tsv に足す。
書き戻しの道具は、栗野さんの機能の行をこの表に載ったものだけ書く。
使い方: python3 tools/kurino_takeover/add_split_exc.py <機能ID>...（e2e/ で流す）
"""
import csv
import json
import os
import sys

E = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))) + "/"
P = E + "config/sheet_split_exceptions.tsv"
WHY = "栗野さんの受け持ちの機能だが、実施者が空欄の行を依頼者の指示（11/21）でこちらが巻き取って流した"


def main() -> None:
    have = {r[0] for r in csv.reader(open(P), delimiter="\t") if r}
    led = {x[0] for x in csv.reader(open(E + "review/backlog_e2e_ledger.tsv"), delimiter="\t") if x}
    add = []
    for f, sheet, e2e, _k in csv.reader(open(E + ".runs/kurino/blank.tsv"), delimiter="\t"):
        if f not in sys.argv[1:] or not e2e or e2e in have:
            continue
        p = f"{E}evidence/{f}/{e2e}/result.json"
        if not os.path.exists(p):
            continue
        r = json.load(open(p))
        if r.get("環境", {}).get("E2E_ENV") != "dev":
            continue
        ok = r.get("結果") == "合格"
        if not ok and r.get("結果") == "不合格":
            jp = f"{E}review/judgements/{f}.tsv"
            jr = {x[0]: x for x in csv.reader(open(jp), delimiter="\t")} if os.path.exists(jp) else {}
            ok = e2e in jr and jr[e2e][1] == "不合格" and e2e in led
        if ok:
            add.append((e2e, sheet, WHY))
    with open(P, "a") as fo:
        fo.writelines("\t".join(a) + "\n" for a in add)
    print("足した", len(add), ", ".join(a[0] for a in add))


if __name__ == "__main__":
    main()

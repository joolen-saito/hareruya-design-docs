#!/usr/bin/env python3
"""単体テストで確かめるべきケース（単体テストレベル）を、ケースの正本（cases/）から外す（依頼者決定 2026-10-21）。 exclude_ut.py

外すケースは ut_layer/adopted.tsv（判定と codex の事実確認を経て採ったもの。区分は 入力チェック・書式・変換・計算・一致条件・並び順・サニタイズ）。
線引きは 2026-08-31 の決裁（ut_layer_audit/DECISION.md）と同じ。

行は消さず excluded_ut_cases.tsv へ移す（区分・理由つき。元の11列は「元_」付き）。
外したケースだけが使っていたシードは excluded_ut_seeds.tsv へ移す。
何度流しても同じ（前回外した分を cases/ へ戻してから判定し直し、除外表は毎回いま外れているケースだけで作り直す）。
順序は merge → seed_screen/apply.py → datapattern/conflicts/apply_rulings.py → exclude_open.py → exclude_scope.py → exclude_dup.py → これ → build_all_test_cases.py → precond/gate_precond.py --all。
exclude_dup.py の後に流す（重複で残す側に選んだケースをこれが外しても、重複で外したケースは外れたままになる）。
"""
import csv, glob, pathlib, re, collections

CG = pathlib.Path(__file__).resolve().parent
csv.field_size_limit(10**9)
CH = ["テストID", "要求ID", "連鎖ID", "観点ID", "優先度", "実行区分", "使用シード", "事前準備", "手順", "期待結果", "出典"]
OH = ["テストID", "機能ID", "区分", "理由"] + ["元_" + c for c in CH]
SH = ["機能ID", "使用していた除外ケース", "シードID", "区分", "論理名", "状態・属性", "用途", "投入方法", "共有"]


def rows(p):
    r = [l.rstrip("\n").split("\t") for l in open(p, encoding="utf-8")]
    return r[0], [x for x in r[1:] if x and x != [""]]


def write(p, h, rs):
    open(p, "w", encoding="utf-8", newline="").write("".join("\t".join(r) + "\n" for r in [h] + rs))


def seeds_of(s):
    return [x.strip() for x in re.split(r"[,、]", s) if x.strip() and x.strip() != "—"]


def main():
    ah, A = rows(CG / "ut_layer/adopted.tsv")
    ix = {c: i for i, c in enumerate(ah)}
    pair = {r[ix["外すテストID"]]: r for r in A}
    # 前回外した分を戻す
    prev_c, prev_s = collections.defaultdict(list), collections.defaultdict(list)
    op, sp_ = CG / "excluded_ut_cases.tsv", CG / "excluded_ut_seeds.tsv"
    if op.exists():
        for r in rows(op)[1]:
            prev_c[r[1]].append(r[4:])
    if sp_.exists():
        for r in rows(sp_)[1]:
            prev_s[r[0]].append(r[2:])
    files = {}
    for p in sorted(glob.glob(str(CG / "cases/*_test_cases.tsv"))):
        fid = pathlib.Path(p).name.split("_")[0]
        h, C = rows(p)
        if h != CH:
            raise SystemExit(f"{p}: 見出しが想定と違う")
        sh, S = rows(CG / f"cases/{fid}_seed_data.tsv")
        have = {x[0] for x in C}
        C += [x for x in prev_c.get(fid, []) if x[0] not in have]
        haves = {x[0] for x in S}
        S += [x for x in prev_s.get(fid, []) if x[0] not in haves]
        C.sort(key=lambda x: x[0])
        files[fid] = (p, h, C, sh, S)
    present = {x[0] for (_, _, C, _, _) in files.values() for x in C}
    outc, outs, n = [], [], collections.Counter()
    for fid, (p, h, C, sh, S) in files.items():
        keep, drop = [], []
        for x in C:
            r = pair.get(x[0])
            if not r:
                keep.append(x); continue
            drop.append(x); n[r[ix["区分"]]] += 1
            outc.append([x[0], fid, r[ix["区分"]], r[ix["理由"]]] + x)
        used = {s for x in keep for s in seeds_of(x[6])}
        by = collections.defaultdict(list)
        for x in drop:
            for s in seeds_of(x[6]):
                by[s].append(x[0])
        write(p, h, keep)
        write(CG / f"cases/{fid}_seed_data.tsv", sh, [x for x in S if x[0] not in by or x[0] in used])
        outs += [[fid, ",".join(by[x[0]])] + x for x in S if x[0] in by and x[0] not in used]
    write(op, OH, sorted(outc, key=lambda r: r[0]))
    write(sp_, SH, sorted(outs, key=lambda r: (r[0], r[2])))
    gone = sorted(set(pair) - present)
    print(f"外す {len(outc)}件 {dict(n)} / 外したシード {len(outs)}件 / 判定表にあるが cases/ に無い {len(gone)}件")


main()

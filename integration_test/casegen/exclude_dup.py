#!/usr/bin/env python3
"""ほかのケースと同じことを確かめている類似・重複のケースを、ケースの正本（cases/）から外す（依頼者決定 2026-10-21）。 exclude_dup.py

外すケースと残すケースの対は dedup/adopted.tsv（判定と codex の事実確認を経て採ったもの。種別は 同一・包含・同値）。
残すケースが cases/ に無いとき（作り方が未確定・フェーズ2などで別に外れたとき）は、外さずに残す（同じ確認が一覧から消えないように）。

行は消さず excluded_dup_cases.tsv へ移す（残すテストID・種別・根拠・理由つき。元の11列は「元_」付き）。
外したケースだけが使っていたシードは excluded_dup_seeds.tsv へ移す。
何度流しても同じ（前回外した分を cases/ へ戻してから判定し直し、除外表は毎回いま外れているケースだけで作り直す）。
順序は merge → seed_screen/apply.py → datapattern/conflicts/apply_rulings.py → exclude_open.py → exclude_scope.py → これ → build_all_test_cases.py → precond/gate_precond.py --all。
"""
import csv, glob, pathlib, re, collections

CG = pathlib.Path(__file__).resolve().parent
csv.field_size_limit(10**9)
CH = ["テストID", "要求ID", "連鎖ID", "観点ID", "優先度", "実行区分", "使用シード", "事前準備", "手順", "期待結果", "出典"]
OH = ["テストID", "機能ID", "残すテストID", "種別", "根拠", "理由"] + ["元_" + c for c in CH]
SH = ["機能ID", "使用していた除外ケース", "シードID", "区分", "論理名", "状態・属性", "用途", "投入方法", "共有"]


def rows(p):
    r = [l.rstrip("\n").split("\t") for l in open(p, encoding="utf-8")]
    return r[0], [x for x in r[1:] if x and x != [""]]


def write(p, h, rs):
    open(p, "w", encoding="utf-8", newline="").write("".join("\t".join(r) + "\n" for r in [h] + rs))


def seeds_of(s):
    return [x.strip() for x in re.split(r"[,、]", s) if x.strip() and x.strip() != "—"]


def main():
    ah, A = rows(CG / "dedup/adopted.tsv")
    ix = {c: i for i, c in enumerate(ah)}
    pair = {r[ix["外すテストID"]]: r for r in A}
    # 前回外した分を戻す
    prev_c, prev_s = collections.defaultdict(list), collections.defaultdict(list)
    op, sp_ = CG / "excluded_dup_cases.tsv", CG / "excluded_dup_seeds.tsv"
    if op.exists():
        for r in rows(op)[1]:
            prev_c[r[1]].append(r[6:])
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
    # 残す側を単体テストレベルとして外したとき（exclude_ut.py）は、同じ確認なので重複のケースも外したままにする
    up = CG / "excluded_ut_cases.tsv"
    if up.exists():
        present |= {r[0] for r in rows(up)[1]}
    outc, outs, n, kept_back = [], [], collections.Counter(), []
    for fid, (p, h, C, sh, S) in files.items():
        keep, drop = [], []
        for x in C:
            r = pair.get(x[0])
            if not r:
                keep.append(x); continue
            k = r[ix["残すテストID"]]
            if k not in present or k in pair:
                kept_back.append((x[0], k)); keep.append(x); continue
            drop.append(x); n[r[ix["種別"]]] += 1
            outc.append([x[0], fid, k, r[ix["種別"]], r[ix["根拠"]], r[ix["理由"]]] + x)
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
    print(f"外す {len(outc)}件 {dict(n)} / 外したシード {len(outs)}件 / 残す側が無いので外さない {len(kept_back)}件"
          f" / 判定表にあるが cases/ に無い {len(gone)}件")
    for a, k in kept_back:
        print("  外さない", a, "残す側", k)


main()

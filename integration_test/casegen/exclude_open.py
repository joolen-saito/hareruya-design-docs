#!/usr/bin/env python3
"""テストできないケース・作り方が未確定のケースを、ケースの正本（cases/）から外す（依頼者決定 2026-10-14）。 exclude_open.py

外すのは、次のどちらかに当たるケース（前提条件の検査 G9 が「未整備・未確定の前提を使うケース」と数えるものと同じ）。
  1. 使用シードのどれかの投入方法に「未確定」「未整備」がある（作り方が決まっていない／実装上その状態を作れない／試験環境の決定待ち）
  2. precond/open_preconditions.tsv の影響ケースに載っている（作り方が決まっていない前提を使う）

行は消さず excluded_open_cases.tsv へ移す（除外理由つき。元の11列は「元_」付きで持つ）。
外したケースだけが使っていたシードは excluded_open_seeds.tsv へ移す。
何度流しても同じ。各 merge_into_cases.py と seed_screen/apply.py は cases/ へケースを戻すので、そのあとに必ずこれを流し、
そのあと exclude_scope.py（フェーズ2見送り・実装しない機能の除外）、最後に build_all_test_cases.py を流す。作り方が決まったら、シードの投入方法と open_preconditions.tsv を直してから
merge → apply → これ、の順に流し直せば戻る（excluded_open_cases.tsv は毎回、いま外れているケースだけで作り直す）。
"""
import csv, glob, pathlib, re, collections

CG = pathlib.Path(__file__).resolve().parent
PC = CG / "precond"
UNS = re.compile(r"未確定|未整備")
csv.field_size_limit(10**9)


def rows(p):
    r = [l.rstrip("\n").split("\t") for l in open(p, encoding="utf-8")]
    return r[0], [x for x in r[1:] if x and x != [""]]


def write(p, h, rs):
    open(p, "w", encoding="utf-8", newline="").write("".join("\t".join(r) + "\n" for r in [h] + rs))


def seeds_of(s):
    return [x.strip() for x in re.split(r"[,、]", s) if x.strip() and x.strip() != "—"]


def main():
    oh, op = rows(PC / "open_preconditions.tsv")
    listed = collections.defaultdict(dict)       # 機能 → テストID → 未確定の内容
    for r in op:
        for c in re.split(r"[,、]", r[3]):
            c = c.strip()
            if c:
                listed[r[0]][c if c.startswith("IT-") else f"IT-{r[0]}-{c}"] = f"{r[1]}: {r[2]}"
    kind = {}                                    # シードID → 確定作業での判定（作れない／環境の決定待ち）
    if (CG / "seed_resolve/all.tsv").exists():
        for r in rows(CG / "seed_resolve/all.tsv")[1]:
            kind[r[0]] = r[2]
    # 前回外した分を戻してから判定し直す（cases/ に無く、前回の除外表にだけある行）
    prev_c, prev_s = collections.defaultdict(list), collections.defaultdict(list)
    if (CG / "excluded_open_cases.tsv").exists():
        for r in rows(CG / "excluded_open_cases.tsv")[1]:
            prev_c[r[1]].append(r[4:])
    if (CG / "excluded_open_seeds.tsv").exists():
        for r in rows(CG / "excluded_open_seeds.tsv")[1]:
            prev_s[r[0]].append(r[2:])
    outc, outs, n_keep, why_n = [], [], 0, collections.Counter()
    for p in sorted(glob.glob(str(CG / "cases/*_test_cases.tsv"))):
        fid = pathlib.Path(p).name.split("_")[0]
        h, C = rows(p)
        sp = CG / f"cases/{fid}_seed_data.tsv"
        sh, S = rows(sp)
        have = {x[0] for x in C}
        C += [x for x in prev_c.get(fid, []) if x[0] not in have]
        haves = {x[0] for x in S}
        S += [x for x in prev_s.get(fid, []) if x[0] not in haves]
        C.sort(key=lambda x: x[0])
        iu = h.index("使用シード")
        how = {x[0]: x[5] for x in S}
        keep, drop = [], []
        for x in C:
            us = [s for s in seeds_of(x[iu]) if UNS.search(how.get(s, ""))]
            if us:
                ks = {kind.get(s, "") for s in us}
                cls = "作れない" if "作れない" in ks else "環境の決定待ち" if "環境の決定待ち" in ks else "作り方が未確定"
                detail = "／".join(f"{s}: " + "・".join(re.findall(r"(?:未確定|未整備)[:：]?[^。／]*", how[s])[:2])[:200] for s in us)
            elif x[0] in listed[fid]:
                cls, detail = "作り方が未確定", listed[fid][x[0]][:300]
            else:
                keep.append(x); continue
            drop.append(x); why_n[cls] += 1
            outc.append([x[0], fid, cls, detail] + x)
        used = {s for x in keep for s in seeds_of(x[iu])}
        dropped_by = collections.defaultdict(list)
        for x in drop:
            for s in seeds_of(x[iu]):
                dropped_by[s].append(x[0])
        write(p, h, keep)
        write(sp, sh, [x for x in S if x[0] in used])
        outs += [[fid, ",".join(dropped_by.get(x[0], []))] + x for x in S if x[0] not in used]
        n_keep += len(keep)
    hc = rows(sorted(glob.glob(str(CG / "cases/*_test_cases.tsv")))[0])[0]
    write(CG / "excluded_open_cases.tsv", ["テストID", "機能ID", "除外理由", "未確定の内容"] + ["元_" + c for c in hc], outc)
    write(CG / "excluded_open_seeds.tsv", ["機能ID", "使用していた除外ケース", "シードID", "区分", "論理名", "状態・属性", "用途", "投入方法", "共有"], outs)
    print(f"残す {n_keep}件 / 外す {len(outc)}件 {dict(why_n)} / 外したシード {len(outs)}件")


main()

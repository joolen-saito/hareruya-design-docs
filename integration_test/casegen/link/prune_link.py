#!/usr/bin/env python3
"""連携ケースから判定単位の範囲外のケースを外す。捨てずに out_of_scope/ へ移す。

  prune_link.py <機能ID> <外すケース番号,..|all> <提案する付け替え先> <理由>

残したケースは L001 から振り直し、ケース専用シードIDの末尾も合わせる（verify_link.py の規則）。
"""
import csv, pathlib, re, sys

L = pathlib.Path(__file__).resolve().parent


def rd(p):
    with p.open(encoding="utf-8") as f:
        r = list(csv.reader(f, delimiter="\t"))
    return r[0], [x for x in r[1:] if x]


def wr(p, h, rows):
    with p.open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f, delimiter="\t", lineterminator="\n")
        w.writerow(h); w.writerows(rows)


def main(fid, drop, retag, why):
    cp, sp = L / f"cases/{fid}_link_test_cases.tsv", L / f"cases/{fid}_link_seed_data.tsv"
    ch, C = rd(cp); sh, S = rd(sp)
    num = lambda t: t.rsplit("-L", 1)[1]
    dropset = {num(c[0]) for c in C} if drop == "all" else {f"{int(x):03d}" for x in drop.split(",")}
    out, keep = [c for c in C if num(c[0]) in dropset], [c for c in C if num(c[0]) not in dropset]
    assert len(out) == len(dropset), f"{fid}: 外す番号が実在しない {dropset}"
    iu = ch.index("使用シード")
    used = lambda rows: {s.strip() for c in rows for s in re.split(r"[,、]", c[iu]) if s.strip()}
    kept_seeds = used(keep)
    od = L / "out_of_scope"; od.mkdir(exist_ok=True)
    op = od / f"{fid}_cases.tsv"
    oh = ch + ["提案する付け替え先", "外した理由"]
    prev = rd(op)[1] if op.exists() else []
    wr(op, oh, prev + [c + [retag, why] for c in out])
    osp = od / f"{fid}_seeds.tsv"
    prevs = rd(osp)[1] if osp.exists() else []
    # IDでなく行全体で重複を見る。振り直しで先に退避したシードと同じIDになった別シードを落とさないため
    have = {tuple(r) for r in prevs}
    wr(osp, sh, prevs + [s for s in S if s[0] in used(out) and tuple(s) not in have])
    S = [s for s in S if s[0] in kept_seeds]
    # 振り直し
    ren = {}
    for i, c in enumerate(keep, 1):
        old, new = num(c[0]), f"{i:03d}"
        if old != new:
            for s in S:
                if s[sh.index("共有")].strip() == "ケース専用" and s[0].endswith("-" + old) and s[0] in used([c]):
                    ren[s[0]] = s[0][: -len(old)] + new
            c[0] = f"IT-{fid}-L{new}"
    if ren:
        pat = re.compile("|".join(sorted(map(re.escape, ren), key=len, reverse=True)))
        sub = lambda x: pat.sub(lambda m: ren[m.group(0)], x)
        keep = [[sub(v) for v in c] for c in keep]
        S = [[sub(v) for v in s] for s in S]
    wr(cp, ch, keep); wr(sp, sh, S)
    print(f"{fid}: 外した {len(out)} / 残り {len(keep)} / 振り直したシード {len(ren)}")


if __name__ == "__main__":
    main(*sys.argv[1:5])

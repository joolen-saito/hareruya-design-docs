#!/usr/bin/env python3
"""合流済みの連携ケースに、作業ファイル（link_pub/cases/）で後から直した内容を当て直す。

  sync_pub.py            何が変わるかを表示するだけ
  sync_pub.py --apply    ../cases/ と merged_map.tsv、../precond/added_cases.tsv を書く

merge_pub.py は merged_map.tsv に載ったケースを飛ばすので、合流のあとに作業ファイルを直しても ../cases/ には届かない。
これは merged_map.tsv に載ったケースについて、合流と同じ置き換え（テストIDとケース専用シードIDの末尾の番号）で
../cases/ の行を作り直す。
- 作業ファイルから消えたケースは ../cases/ からも消し、merged_map.tsv と added_cases.tsv から外して merged_gone.tsv に移す（番号は詰めない）。
- 作業ファイルに新しく足したケースは扱わない。このあとに merge_pub.py --apply を流す（続きの番号で足される）。
- シード: この機能のケースが使う連携のシードは作業ファイルの内容で置き換え、無ければ足す。
  連携のシード（IDが S-<機能ID>-<群>- の形のもの）で、この機能のどのケースも使わなくなったものは消す。
何度流しても同じ。流したあとは merge_pub.py --apply → ../seed_screen/apply.py → ../exclude_open.py →
../build_all_test_cases.py → ../precond/gate_precond.py --all の順に流す。
"""
import glob, pathlib, re, sys, collections

P = pathlib.Path(__file__).resolve().parent
CG = P.parent
sys.path.insert(0, str(P))
from merge_pub import HDR, SHDR, rd, wr   # noqa: E402

SPLIT = re.compile(r"[,、]")
# 連携のシードIDの形。合流前の ../cases/ にこの形のシードは無い（2026-10-15 に確認）
LINKSEED = re.compile(r"^S-[A-Z]\d\d-\d\d-(?:P[A-F]|Q[A-N])-")


def seeds_of(s):
    return [x.strip() for x in SPLIT.split(s) if x.strip() and x.strip() != "—"]


def main(apply):
    mh, M = rd(P / "merged_map.tsv")
    src, seeds = {}, {}
    for p in sorted(glob.glob(str(P / "cases/*_test_cases.tsv"))):
        h, rows = rd(pathlib.Path(p))
        for r in rows:
            src[r[0]] = dict(zip(h, r))
    for p in sorted(glob.glob(str(P / "cases/*_seed_data.tsv"))):
        _, rows = rd(pathlib.Path(p))
        for s in rows:
            seeds[s[0]] = s
    by_fid = collections.defaultdict(list)
    for m in M:
        by_fid[m[5]].append(m)
    gone, changed_c, changed_s, added_s, removed_s = [], 0, 0, 0, 0
    for fid in sorted(by_fid):
        cp, sp = CG / f"cases/{fid}_test_cases.tsv", CG / f"cases/{fid}_seed_data.tsv"
        ch, C = rd(cp); sh, S = rd(sp)
        assert ch == HDR and sh == SHDR, fid
        ren = {}
        for old, new, *_ in by_fid[fid]:
            ren[old] = new
            # 合流時と同じく、ケース専用シードは末尾の番号を新しいケース番号に合わせる
            if old in src:
                for s in seeds_of(src[old]["使用シード"]):
                    if s in seeds and seeds[s][SHDR.index("共有")].strip() == "ケース専用":
                        ren[s] = s[:-3] + new[-3:]
        pat = re.compile("|".join(sorted(map(re.escape, ren), key=len, reverse=True)))
        sub = lambda x: pat.sub(lambda mm: ren[mm.group(0)], x)
        idx = {r[0]: i for i, r in enumerate(C)}
        drop = set()
        for old, new, *_ in by_fid[fid]:
            if old not in src:
                drop.add(new); gone.append((old, new)); continue
            row = [sub(src[old][k]) for k in HDR]
            row[0] = new
            if row[1].strip() in ("—", "-"):
                row[1] = ""
            i = idx[new]
            if C[i] != row:
                changed_c += 1
                print(f"変更 {new}（旧 {old}）:", ", ".join(HDR[j] for j in range(len(HDR)) if C[i][j] != row[j]))
                C[i] = row
        C = [r for r in C if r[0] not in drop]
        used = []
        for r in C:
            for s in seeds_of(r[6]):
                if s not in used:
                    used.append(s)
        inv = {v: k for k, v in ren.items()}
        sidx = {s[0]: i for i, s in enumerate(S)}
        for s in used:
            w = inv.get(s, s)
            if w not in seeds:
                continue                      # 連携のシードでない（既存のシード）
            row = [sub(v) for v in seeds[w]]
            if s in sidx:
                if S[sidx[s]] != row:
                    changed_s += 1; print(f"シード変更 {s}"); S[sidx[s]] = row
            else:
                added_s += 1; print(f"シード追加 {s}（{fid}）"); S.append(row); sidx[s] = len(S) - 1
        keep = []
        for s in S:
            if LINKSEED.match(s[0]) and s[0] not in used:
                removed_s += 1; print(f"シード削除 {s[0]}（{fid}）")
            else:
                keep.append(s)
        if apply:
            wr(cp, HDR, C); wr(sp, SHDR, keep)
    for old, new in gone:
        print(f"削除 {new}（旧 {old}）")
    print(f"ケース変更 {changed_c}・削除 {len(gone)}／シード変更 {changed_s}・追加 {added_s}・削除 {removed_s}")
    if apply and gone:
        dead_old = {o for o, _ in gone}; dead_new = {n for _, n in gone}
        wr(P / "merged_map.tsv", mh, [m for m in M if m[0] not in dead_old])
        gh, G = rd(P / "merged_gone.tsv")
        if gh is None:
            gh, G = mh, []
        wr(P / "merged_gone.tsv", gh, G + [m for m in M if m[0] in dead_old])
        ah, A = rd(CG / "precond/added_cases.tsv")
        wr(CG / "precond/added_cases.tsv", ah, [a for a in A if a[0] not in dead_new])
    if apply:
        print("書き込んだ")


if __name__ == "__main__":
    main("--apply" in sys.argv)

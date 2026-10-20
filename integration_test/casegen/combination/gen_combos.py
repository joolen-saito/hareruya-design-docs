#!/usr/bin/env python3
"""要因表（factors/）から、試す値の組（combos/）を機械で並べる。 gen_combos.py [機能ID...]

依頼者決定 2026-10-20: 効き合う要因は値の組合せを全部、関係しない要因はどの2つの要因の値の組もどこかで1回は出るように並べる。
既存のケースが通している組は埋めなくてよい。作れない組・正解未定の組は行に入れない。
打ち切り（constraints の種別「打ち切り」）: その条件に当たると処理がそこで打ち切られ、ほかの要因の値は結果に効かない。
依頼者決定 2026-10-20「打ち切り側は1回でよい」により、打ち切りの条件にほかの要因の値を足した組は埋めず、条件そのものを1行で通す。
その行のほかの要因は「（効かない）」と書き、組の列には書かない。ふつうの行では、打ち切りの条件ができあがる値を選ばない。

埋める組（必要な組）:
  - 効き合う行（2つ以上の要因）: その要因の値の組合せすべて
  - それ以外の2つの要因の組（関係しない・設計書が決めていない）: 2つの値の組すべて
  から、制約（作れない・正解未定）を含む組と、既存ケース（existing.tsv）が値を全部持っている組を除く。
並べ方: 埋める組のうち、要因の多い組・要因IDと値の順で先頭のものを種にして1行を始め、残りの要因を要因IDの順に、
まだ埋まっていない組を最も多く埋める値で決める（同数なら値の順で先）。制約を破らずに行を最後まで埋められる値だけを選ぶ。
何度流しても同じ結果になる。

すでにケースを書いた機能（cases/<機能ID>_cb_dispositions.tsv がある）は、前の combos/<機能ID>.tsv の行を組IDごとそのまま残し、
残した行のうち今の制約に当たらない行も、既存ケースと同じく組を埋めたものとして数え、足りない組だけを末尾に新しい組IDで足す
（ケースの項目IDがずれないように。2026-10-20）。残した行が今の制約に当たるときは、その行の「埋める組」の頭に【制約に当たる】と書く。

出力:
  combos/<機能ID>.tsv               組ID・処理ID・組・組（読める形）・埋める組
  combos/<機能ID>_undetermined.tsv  設計書から結果が決まらない組（ケースにしない。報告書の論点）
"""
import csv, itertools, pathlib, sys

G = pathlib.Path(__file__).resolve().parent
csv.field_size_limit(10**9)


def read(p):
    return list(csv.DictReader(p.open(encoding="utf-8"), delimiter="\t", quoting=csv.QUOTE_NONE))


def parse_set(s):
    out = {}
    for part in [x.strip() for x in s.split("&") if x.strip()]:
        k, _, v = part.partition("=")
        out[k.strip()] = v.strip()
    return out


def load(fid):
    d = G / "factors"
    P = read(d / f"{fid}_processes.tsv")
    F = read(d / f"{fid}_factors.tsv")
    I = read(d / f"{fid}_interactions.tsv")
    C = read(d / f"{fid}_constraints.tsv")
    E = read(d / f"{fid}_existing.tsv")
    return P, F, I, C, E


def kept_rows(fid):
    """ケースを書いた後なら、前の組の行（組ID・処理ID・値）を返す。"""
    if not (G / f"cases/{fid}_cb_dispositions.tsv").exists() or not (G / f"combos/{fid}.tsv").exists():
        return []
    return [(r["組ID"], r["処理ID"], parse_set(r["組"])) for r in read(G / f"combos/{fid}.tsv")]


def plan(fid):
    """処理ごとの、埋める組・既存で埋まる組・作れない組・行を返す。"""
    P, F, I, C, E = load(fid)
    KEPT = kept_rows(fid)
    fac = {r["要因ID"]: r for r in F}
    vals = {k: [v.strip() for v in r["値"].split("｜")] for k, r in fac.items()}
    res = []
    for p in P:
        pid = p["処理ID"]
        fs = sorted(k for k, r in fac.items() if pid in [x.strip() for x in r["処理ID"].split(",")])
        order = {k: i for i, k in enumerate(fs)}
        groups, judged = [], {}
        for r in I:
            if r["処理ID"] != pid:
                continue
            g = tuple(sorted(x.strip() for x in r["要因"].split("+")))
            if r["判定"] == "効き合う":
                groups.append(g)
            for a, b in itertools.combinations(g, 2):
                judged.setdefault((a, b), []).append(r["判定"])
        cons_all = [(parse_set(r["組"]), r["種別"]) for r in C if r["処理ID"] == pid]
        cons = [(c, k) for c, k in cons_all if k != "打ち切り"]
        cuts = [c for c, k in cons_all if k == "打ち切り"]

        def bad(assign, cons=cons):   # 処理ごとの制約を束縛する（後から res の bad を呼ぶときに最後の処理の制約を見ないように）
            return any(all(assign.get(k) == v for k, v in c.items()) for c, _ in cons)

        def cut_of(assign, cuts=cuts):   # 打ち切りの条件に当たるなら、その条件（入れ子のときはいちばん細かい条件）
            hit = [c for c in cuts if all(assign.get(k) == v for k, v in c.items())]
            return max(hit, key=len) if hit else None

        def tup(items):
            return tuple(sorted(items, key=lambda kv: (order[kv[0]], vals[kv[0]].index(kv[1]))))

        need = set()
        for g in groups:
            for combo in itertools.product(*[vals[k] for k in g]):
                need.add(tup(zip(g, combo)))
        ingroup = {pr for g in groups for pr in itertools.combinations(g, 2)}
        for a, b in itertools.combinations(fs, 2):
            if (a, b) in ingroup:
                continue
            for va in vals[a]:
                for vb in vals[b]:
                    need.add(tup([(a, va), (b, vb)]))
        # 打ち切りの条件にほかの要因の値を足した組は埋めない。条件そのものを1回通す
        need = {t for t in need if not ((c := cut_of(dict(t))) and len(t) > len(c))}
        need |= {tup(c.items()) for c in cuts}
        need_all = {t for t in need if not bad(dict(t))}
        excluded = sorted(need - need_all, key=lambda t: [(order[k], vals[k].index(v)) for k, v in t])
        ex = [parse_set(r["値"]) for r in E if r["処理ID"] == pid]
        by_existing = {t for t in need_all if any(all(e.get(k) == v for k, v in t) for e in ex)}
        kept = [(cid, a) for cid, p, a in KEPT if p == pid]
        live_kept = [a for cid, a in kept if not bad(a) and (all(k in a for k in fs) or cut_of(a))]
        by_kept = {t for t in need_all - by_existing if any(all(a.get(k) == v for k, v in t) for a in live_kept)}
        todo = need_all - by_existing - by_kept

        def completable(assign, allow_cut=False):
            """制約を破らずに行を埋められるか。ふつうの行（allow_cut=False）は打ち切りの条件をつくらない。
            打ち切りの条件そのものの組（allow_cut=True）は、ほかの要因が効かないので埋めなくてよい。"""
            if allow_cut and cut_of(assign) and not bad(assign):
                return True
            free = [k for k in fs if k not in assign]

            def rec(i, a):
                if bad(a) or cut_of(a):
                    return False
                if i == len(free):
                    return True
                for v in vals[free[i]]:
                    a[free[i]] = v
                    if rec(i + 1, a):
                        del a[free[i]]
                        return True
                    del a[free[i]]
                return False
            return rec(0, dict(assign))

        def reachable(assign):   # 制約を破らずに、ふつうの行か打ち切りの行のどちらかにできるか
            free = [k for k in fs if k not in assign]

            def rec(i, a):
                if bad(a):
                    return False
                if cut_of(a) or i == len(free):
                    return True
                for v in vals[free[i]]:
                    a[free[i]] = v
                    ok = rec(i + 1, a)
                    del a[free[i]]
                    if ok:
                        return True
                return False
            return rec(0, dict(assign))

        infeasible = {t for t in todo if not reachable(dict(t))}
        todo -= infeasible
        # ふつうの行にはできず、打ち切りの行にしかならない組（その値の組では処理が打ち切られる）。打ち切りの行が通すので埋めない
        cut_only = {t for t in todo if not cut_of(dict(t)) and not completable(dict(t))}
        todo -= cut_only
        key = lambda t: (-len(t), [(order[k], vals[k].index(v)) for k, v in t])
        rows = []
        while todo:
            seed = min(todo, key=key)
            row = dict(seed)
            if (c := cut_of(row)):   # 打ち切りの行: 条件の値だけ。ほかの要因は効かない
                row = dict(c)
                got = sorted((t for t in todo if dict(t) == row), key=key)
                todo -= set(got)
                rows.append((row, got))
                continue
            for k in fs:
                if k in row:
                    continue
                best, bestn = None, -1
                for v in vals[k]:
                    row[k] = v
                    if completable(row):
                        n = sum(1 for t in todo if any(kk == k for kk, _ in t) and all(row.get(kk) == vv for kk, vv in t))
                        if n > bestn:
                            best, bestn = v, n
                    del row[k]
                row[k] = best
            got = sorted((t for t in todo if all(row.get(k) == v for k, v in t)), key=key)
            todo -= set(got)
            rows.append((row, got))
        res.append(dict(pid=pid, factors=fs, vals=vals, need=len(need), need_all=len(need_all), existing=len(by_existing),
                        kept=kept, kept_live=len(live_kept), by_kept=len(by_kept), bad=bad, cut_of=cut_of,
                        excluded=excluded, infeasible=sorted(infeasible, key=key), cut_only=len(cut_only), rows=rows,
                        undetermined=[(c, k) for c, k in cons if k == "正解未定"],
                        judged=judged))
    return fac, vals, res


def fmt(fac, t, sep="×"):
    names = "×".join(fac[k]["要因"] for k, _ in t)
    return f"{names}: " + sep.join(v for _, v in t)


def free_note(r, row, k):
    """打ち切りの行で効かない要因。作れない・正解未定の組に当たる値があれば、それを避けて選ぶ値を書く。"""
    ok = [v for v in r["vals"][k] if not r["bad"]({**row, k: v}) and r["cut_of"]({**row, k: v}) == row]
    return "（効かない）" if len(ok) == len(r["vals"][k]) else f"（効かない。{'・'.join(ok) or '選べる値なし'}から選ぶ）"


def write(fid):
    fac, vals, res = plan(fid)
    out = G / "combos"
    out.mkdir(exist_ok=True)
    lines = [["組ID", "処理ID", "組", "組（読める形）", "埋める組"]]
    n = 0
    old = {r["組ID"]: r for r in read(out / f"{fid}.tsv")} if kept_rows(fid) else {}
    if old:
        for cid, r0 in old.items():
            r = next(x for x in res if x["pid"] == r0["処理ID"]) if any(x["pid"] == r0["処理ID"] for x in res) else None
            a = parse_set(r0["組"])
            mark = "【制約に当たる】" if (r is None or r["bad"](a)) else ""
            lines.append([cid, r0["処理ID"], r0["組"], r0["組（読める形）"], mark + r0["埋める組"].replace("【制約に当たる】", "")])
        n = max(int(c.rsplit("-", 1)[-1]) for c in old)
    for r in res:
        for row, got in r["rows"]:
            n += 1
            fs = r["factors"]
            lines.append([f"CB-{fid}-{n:03d}", r["pid"], "&".join(f"{k}={row[k]}" for k in fs if k in row),
                          "／".join(f"{fac[k]['要因']}={row[k] if k in row else free_note(r, row, k)}" for k in fs),
                          "；".join(fmt(fac, t) for t in got)])
    with (out / f"{fid}.tsv").open("w", encoding="utf-8", newline="") as f:
        csv.writer(f, delimiter="\t", lineterminator="\n", quoting=csv.QUOTE_NONE, escapechar="\\").writerows(lines)
    _, _, _, C, _ = load(fid)
    u = [["処理ID", "組", "組（読める形）", "根拠", "理由"]]
    for c in C:
        if c["種別"] == "正解未定":
            s = parse_set(c["組"])
            u.append([c["処理ID"], c["組"], "／".join(f"{fac[k]['要因']}={v}" for k, v in s.items()), c["根拠"], c["理由"]])
    with (out / f"{fid}_undetermined.tsv").open("w", encoding="utf-8", newline="") as f:
        csv.writer(f, delimiter="\t", lineterminator="\n", quoting=csv.QUOTE_NONE, escapechar="\\").writerows(u)
    return res, n


def main(fids):
    for fid in fids:
        res, n = write(fid)
        for r in res:
            print(f"{fid} {r['pid']}: 要因{len(r['factors'])} 埋める組{r['need_all']}（制約で除外{len(r['excluded'])}）"
                  f" 既存で済み{r['existing']} 残した行で済み{r['by_kept']} 作れない{len(r['infeasible'])} → 足す行{len(r['rows'])}")
        print(f"{fid}: 計 {n}行")


if __name__ == "__main__":
    main(sys.argv[1:])

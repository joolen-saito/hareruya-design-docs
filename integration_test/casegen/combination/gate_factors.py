#!/usr/bin/env python3
"""要因表（factors/<機能ID>_*.tsv）の機械検査。 gate_factors.py [機能ID...]

形式、根拠の行の実在、要因の2つの組の判定漏れ0、制約と既存ケースの値の実在を見る。
合格したら gen_combos.py で組を並べ、処理ごとの行の数を出す。判定の当否は codex の反証で見る。
"""
import csv, glob, itertools, pathlib, re, sys

G = pathlib.Path(__file__).resolve().parent
CG = G.parent
csv.field_size_limit(10**9)
sys.path.insert(0, str(G))
import gen_combos  # noqa: E402

HDR = {
    "processes": ["処理ID", "処理", "契機", "確かめる所", "根拠"],
    "factors": ["要因ID", "処理ID", "要因", "値", "値ごとの結果", "根拠", "出所"],
    "interactions": ["処理ID", "要因", "判定", "根拠", "理由"],
    "constraints": ["処理ID", "組", "種別", "根拠", "理由"],
    "existing": ["テストID", "処理ID", "値", "理由"],
}
JUDGE = ("効き合う", "関係しない", "設計書が決めていない")
REF = re.compile(r"^(?:(?P<f>[A-Z]\d\d-\d\d):|(?P<c>_common/[^:]+):)?L(?P<a>\d{4})(?:-L(?P<b>\d{4}))?$")
BADV = re.compile(r"[=&｜＋×\t\"]")


def read(p):
    return list(csv.DictReader(p.open(encoding="utf-8"), delimiter="\t", quoting=csv.QUOTE_NONE))


_len = {}


def nlines(path):
    if path not in _len:
        _len[path] = sum(1 for _ in open(path, encoding="utf-8")) if path.exists() else 0
    return _len[path]


def maxline(path):
    n = 0
    if path.exists():
        for l in open(path, encoding="utf-8"):
            m = re.match(r"L(\d{4})\t", l)
            if m:
                n = int(m.group(1))
    return n


def check_ref(fid, s, err, where):
    refs = [x.strip() for x in s.replace("、", ",").split(",") if x.strip()]
    if not refs:
        err.append((where, "根拠が空"))
    out = set()
    for x in refs:
        m = REF.match(x)
        if not m:
            err.append((where, f"根拠の形が違う: {x}"))
            continue
        if m["f"]:
            p = G / f"units/{m['f']}/design.txt"
            out.add(m["f"])
        elif m["c"]:
            p = G / "units" / m["c"]
        else:
            p = G / f"units/{fid}/design.txt"
        mx = maxline(p)
        for n in (m["a"], m["b"]):
            if n and not (1 <= int(n) <= mx):
                err.append((where, f"根拠の行が無い: {x}（{p.relative_to(G)} は L{mx:04d} まで）"))
    return out


def live_ids():
    ids = set()
    # 一覧のテストIDは機能ごとに振り直した連番なので（2026-10-23）、対応表で cases/ のテストIDを引く
    with open(CG / "all_test_cases_id_map.tsv", encoding="utf-8", newline="") as f:
        ids |= {r["cases/のテストID"] for r in csv.DictReader(f, delimiter="\t")}
    return ids


def main(fids):
    live = live_ids()
    bad = 0
    for fid in fids:
        err = []
        T = {}
        for k, h in HDR.items():
            p = G / f"factors/{fid}_{k}.tsv"
            if not p.exists():
                err.append((k, "ファイルが無い"))
                continue
            first = p.open(encoding="utf-8").readline().rstrip("\n").split("\t")
            if first != h:
                err.append((k, f"ヘッダが違う: {first}"))
                continue
            T[k] = read(p)
            for i, r in enumerate(T[k], 2):
                if None in r or any(v is None for v in r.values()):
                    err.append((k, f"{i}行目の列数が合わない"))
        if err:
            print(f"{fid}: 不合格"); [print("   ", *e) for e in err]; bad += 1; continue
        P = {r["処理ID"]: r for r in T["processes"]}
        if len(P) != len(T["processes"]):
            err.append(("processes", "処理IDが重なる"))
        for pid, r in P.items():
            if not re.fullmatch(r"P\d+", pid):
                err.append(("processes", f"処理IDの形: {pid}"))
            for c in ("処理", "契機", "確かめる所"):
                if not r[c].strip():
                    err.append(("processes", f"{pid} の{c}が空"))
            check_ref(fid, r["根拠"], err, f"processes {pid}")
        fac = {}
        for r in T["factors"]:
            k = r["要因ID"]
            if not re.fullmatch(r"F\d\d", k) or k in fac:
                err.append(("factors", f"要因IDの形か重なり: {k}"))
            fac[k] = r
            ps = [x.strip() for x in r["処理ID"].split(",") if x.strip()]
            for x in ps:
                if x not in P:
                    err.append(("factors", f"{k} の処理ID {x} が processes に無い"))
            vs = [v.strip() for v in r["値"].split("｜")]
            if len(vs) < 2 or len(set(vs)) != len(vs) or any(not v for v in vs):
                err.append(("factors", f"{k} の値が2つ以上の重ならない値でない: {r['値']}"))
            for v in vs:
                if BADV.search(v) or len(v) > 30:
                    err.append(("factors", f"{k} の値に使えない文字か30字超: {v}"))
            parts = {x.split(":", 1)[0].strip() for x in r["値ごとの結果"].split("／") if ":" in x}
            for v in vs:
                if v not in parts:
                    err.append(("factors", f"{k} の値ごとの結果に「{v}: …」が無い"))
            if not r["要因"].strip():
                err.append(("factors", f"{k} の要因が空"))
            others = check_ref(fid, r["根拠"], err, f"factors {k}")
            m = re.fullmatch(r"この機能|([A-Z]\d\d-\d\d)（(設定|データ)）", r["出所"].strip())
            if not m:
                err.append(("factors", f"{k} の出所の形: {r['出所']}"))
            elif m.group(1) and m.group(1) not in others:
                err.append(("factors", f"{k} の出所 {m.group(1)} の行が根拠に無い"))
        vals = {k: [v.strip() for v in r["値"].split("｜")] for k, r in fac.items()}
        inproc = {pid: sorted(k for k, r in fac.items() if pid in [x.strip() for x in r["処理ID"].split(",")]) for pid in P}
        for pid, fs in inproc.items():
            if len(fs) < 2:
                err.append(("processes", f"{pid} の要因が{len(fs)}つ（2つ以上の処理だけを挙げる）"))
        cover = {}
        undecided = set()
        for i, r in enumerate(T["interactions"], 2):
            pid, j = r["処理ID"], r["判定"]
            g = sorted(x.strip() for x in r["要因"].split("+") if x.strip())
            w = f"interactions {i}行目 {pid} {r['要因']}"
            if pid not in P:
                err.append((w, "処理IDが無い")); continue
            if j not in JUDGE:
                err.append((w, f"判定が不正: {j}")); continue
            if len(g) < 2 or len(set(g)) != len(g):
                err.append((w, "要因が2つ以上でない")); continue
            if any(x not in inproc[pid] for x in g):
                err.append((w, "この処理の要因でないものを含む")); continue
            if len(g) > 2 and j != "効き合う":
                err.append((w, "3つ以上の組は効き合うだけ"))
            if j in ("効き合う", "設計書が決めていない"):
                check_ref(fid, r["根拠"], err, w)
            elif r["根拠"].strip():
                check_ref(fid, r["根拠"], err, w)
            if j in ("関係しない", "設計書が決めていない") and not r["理由"].strip():
                err.append((w, "理由が空"))
            for a, b in itertools.combinations(g, 2):
                cover.setdefault((pid, a, b), []).append((len(g), j))
            if j == "設計書が決めていない":
                undecided.add((pid, g[0], g[1]))
        for pid, fs in inproc.items():
            for a, b in itertools.combinations(fs, 2):
                c = cover.get((pid, a, b), [])
                if not c:
                    err.append(("interactions", f"{pid} {a}+{b} の判定が無い"))
                elif sum(1 for n, _ in c if n == 2) > 1 or (any(n == 2 for n, _ in c) and any(n > 2 for n, _ in c)):
                    err.append(("interactions", f"{pid} {a}+{b} を2回以上判定している"))
        consets = []
        for i, r in enumerate(T["constraints"], 2):
            pid = r["処理ID"]
            w = f"constraints {i}行目 {pid} {r['組']}"
            if pid not in P:
                err.append((w, "処理IDが無い")); continue
            s = gen_combos.parse_set(r["組"])
            if len(s) < 1:
                err.append((w, "組が空"))
            for k, v in s.items():
                if k not in inproc[pid]:
                    err.append((w, f"{k} はこの処理の要因でない"))
                elif v not in vals[k]:
                    err.append((w, f"{k} の値「{v}」が factors に無い"))
            if r["種別"] not in ("作れない", "正解未定", "打ち切り"):
                err.append((w, f"種別が不正: {r['種別']}"))
            if r["種別"] == "打ち切り" and len(s) >= len(inproc.get(pid, ())):
                err.append((w, "打ち切りの条件がこの処理の要因を全部持っている（効かなくなる要因が無い）"))
            check_ref(fid, r["根拠"], err, w)
            if not r["理由"].strip():
                err.append((w, "理由が空"))
            consets.append((pid, s, r["種別"]))
        for pid, a, b in undecided:
            if not any(p == pid and t == "正解未定" and a in s and b in s for p, s, t in consets):
                err.append(("constraints", f"{pid} {a}+{b} は設計書が決めていないのに、正解未定の組が無い"))
        for i, r in enumerate(T["existing"], 2):
            pid, t = r["処理ID"], r["テストID"]
            w = f"existing {i}行目 {t}"
            if t not in live:
                err.append((w, "all_test_cases.tsv に無いテストID（外したケースは書かない）"))
            if pid not in P:
                err.append((w, "処理IDが無い")); continue
            s = gen_combos.parse_set(r["値"])
            if not s:
                err.append((w, "値が空"))
            for k, v in s.items():
                if k not in inproc[pid]:
                    err.append((w, f"{k} はこの処理の要因でない"))
                elif v not in vals[k]:
                    err.append((w, f"{k} の値「{v}」が factors に無い"))
            for p, c, kind in consets:
                if p == pid and kind == "作れない" and all(s.get(k) == v for k, v in c.items()):
                    err.append((w, f"作れない組 {c} を既存ケースが通している（制約か値の読み違い）"))
            if not r["理由"].strip():
                err.append((w, "理由が空"))
        if err:
            bad += 1
            print(f"{fid}: 不合格 {len(err)}")
            for e in err[:60]:
                print("   ", *e)
            continue
        res, n = gen_combos.write(fid)
        print(f"{fid}: 合格")
        for r in res:
            print(f"   {r['pid']}: 要因{len(r['factors'])} 埋める組{r['need_all']}（制約で除外{len(r['excluded'])}）"
                  f" 既存で済み{r['existing']}" + (f" 残した行{len(r['kept'])}（うち制約に当たる{len(r['kept']) - r['kept_live']}）で済み{r['by_kept']}" if r['kept'] else "")
                  + (f" 打ち切りで済む{r['cut_only']}" if r.get('cut_only') else "") + f" 作れない{len(r['infeasible'])} → 足す行{len(r['rows'])}")
            for t in r["infeasible"][:10]:
                print("      作れない組（制約の組合せで行にできない）:", gen_combos.fmt(fac, t))
        print(f"   計 {n}行（combos/{fid}.tsv。組IDの最大の番号）")
    return bad


if __name__ == "__main__":
    sys.exit(1 if main(sys.argv[1:] or sorted({pathlib.Path(p).name.split("_")[0] for p in glob.glob(str(G / "factors/*_factors.tsv"))})) else 0)

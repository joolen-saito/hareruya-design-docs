#!/usr/bin/env python3
"""判定の表（judg/*.tsv）の機械検査。 gate_judg.py [束...]

形式（見出し・5列・種別）、テストIDの実在、機能内の表は同じ機能どうし、外すケースが重ならない、
残す側が外されていない、外さないケース（protected.tsv）を外していない、同値の根拠の行が設計書の写しにある、
要因の組合せのケースを同値で外していない、束の全機能に表がある。
引数なしは judg/ の全部。束（D_001 など）を渡すとその束の機能だけ。
"""
import csv, pathlib, re, sys, collections

D = pathlib.Path(__file__).resolve().parent
CG = D.parent
csv.field_size_limit(10**9)
H = ["外すテストID", "残すテストID", "種別", "根拠", "理由"]
KINDS = {"同一", "包含", "同値"}


def rd(p):
    return list(csv.DictReader(open(p, encoding="utf-8"), delimiter="\t"))


def all_ids():
    ids = set()
    for p in CG.glob("cases/*_test_cases.tsv"):
        for l in list(open(p, encoding="utf-8"))[1:]:
            ids.add(l.split("\t", 1)[0])
    return ids


def lines_of(fid):
    p = CG / f"combination/units/{fid}/design.txt"
    if not p.exists():
        return set()
    return {int(m.group(1)) for m in re.finditer(r"(?m)^L(\d{4,5})", p.read_text(encoding="utf-8"))}


def expand(s):
    out = []
    for part in re.split(r"[,、，\s]+", s.strip()):
        m = re.fullmatch(r"L(\d+)(?:[-〜~]L?(\d+))?", part)
        if not m:
            if part:
                out.append(None)
            continue
        a = int(m.group(1)); b = int(m.group(2) or a)
        out += list(range(a, b + 1))
    return out


def main(args):
    ids = all_ids()
    prot = {r["テストID"] for r in rd(D / "protected.tsv")}
    cb = {r["テストID"] for r in rd(CG / "combination/cb_map.tsv")}
    batches = {r["束"]: r["機能ID"].split(",") for r in rd(D / "batches.tsv")}
    if args:
        names = [f for b in args for f in batches[b]]
    else:
        names = sorted(p.stem for p in (D / "judg").glob("*.tsv"))
    err = []
    rows = []
    for name in names:
        p = D / f"judg/{name}.tsv"
        if not p.exists():
            err.append((name, "表が無い")); continue
        raw = [l.rstrip("\n").split("\t") for l in open(p, encoding="utf-8") if l.strip()]
        if not raw or raw[0] != H:
            err.append((name, f"見出しが違う: {raw[0] if raw else '空'}")); continue
        for k, r in enumerate(raw[1:], 2):
            if len(r) != 5:
                err.append((name, f"{k}行目: 列が{len(r)}")); continue
            rows.append((name, k, dict(zip(H, r))))
    out = collections.Counter(r["外すテストID"] for _, _, r in rows)
    removed = set(out)
    for name, k, r in rows:
        a, b, kind, ev = r["外すテストID"], r["残すテストID"], r["種別"], r["根拠"]
        w = f"{name}:{k} {a}"
        if a not in ids: err.append((w, "外すテストIDが無い"))
        if b not in ids: err.append((w, f"残すテストIDが無い: {b}"))
        if a == b: err.append((w, "外す側と残す側が同じ"))
        if not name.startswith("_cross") and (a[3:9] != name or b[3:9] != name):
            err.append((w, "機能内の表なのに別の機能のケース"))
        if name.startswith("_cross") and a[3:9] == b[3:9]:
            err.append((w, "機能またぎの表なのに同じ機能"))
        if kind not in KINDS: err.append((w, f"種別が不正: {kind}"))
        if out[a] > 1: err.append((w, "外すテストIDが重なる"))
        if b in removed: err.append((w, f"残す側 {b} も外されている"))
        if a in prot: err.append((w, "外さないケース（E2E・Playwright）を外している"))
        if a in cb and kind == "同値": err.append((w, "要因の組合せのケースを同値で外している"))
        if not r["理由"].strip(): err.append((w, "理由が無い"))
        if kind == "同値":
            common = re.findall(r"_common/([\w.-]+?)(?:\.txt)?(?=[\s,、]|$)", ev)
            ev = re.sub(r"_common/[\w.-]+", " ", ev)
            ev = re.sub(r"\b[A-Z]\d\d-\d\d[:：]", "", ev)   # 機能またぎの表の「機能ID:L…」
            ls = expand(ev)
            if not ls or None in ls:
                err.append((w, f"同値の根拠が行番号でない: {ev}"))
            else:
                have = lines_of(a[3:9]) | lines_of(b[3:9])
                for c in common:
                    q = CG / f"combination/units/_common/{c}.txt"
                    if q.exists():
                        have |= {int(m.group(1)) for m in re.finditer(r"(?m)^L(\d{4,5})", q.read_text(encoding="utf-8"))}
                miss = [x for x in ls if x not in have]
                if miss: err.append((w, f"根拠の行が設計書の写しに無い: {miss[:5]}"))
    kinds = collections.Counter(r["種別"] for _, _, r in rows)
    for e in err:
        print("NG", *e, sep="\t")
    print(f"表 {len(names)}・外す {len(rows)} {dict(kinds)}・NG {len(err)}")
    return 1 if err else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))

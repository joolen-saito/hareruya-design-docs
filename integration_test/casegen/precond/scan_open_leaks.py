#!/usr/bin/env python3
"""open_preconditions.tsv の影響ケースから漏れていそうなケースを洗い出す（候補を出すだけ。判定は人が行う）。 scan_open_leaks.py

影響ケースは行を足した時点のケースで書いた固定の一覧なので、あとから足したケース（被覆監査・データパターン・連携ケースなど）が
同じ未確定の前提を使っても除外に掛からない（2026-10-16 に IT-A05-04-047〜060 ほか63件で見つかった。README「影響ケースの漏れ」）。
ケースを合流したあと、exclude_open.py の前に流して、出た候補を読んで判定する。

  1. 同じシード: 対象に書かれたシードを使うのに、その行の影響ケースに無いケース
  2. 同じ役割の別名: 対象のシードと同じ機能で、同じ役割の語（ENV・EXEC・CLOCK・API・CONFIG・MAIL・RELAY・STUB など）を
     含む別のシード（連携ケースの S-B06-01-L-ENV など）を使い、どの行の影響ケースにも無いケース

意図して影響ケースから外したもの（例: 共有の定義だけを使い未確定の項目に触れない IT-M05-03-001 など）も候補に出る。
"""
import collections, glob, pathlib, re

CG = pathlib.Path(__file__).resolve().parent.parent
SEED = re.compile(r"S-([A-Z]\d\d-\d\d)-([A-Z0-9]+(?:-[A-Z0-9]+)*)")
ROLES = {"ENV", "EXEC", "CLOCK", "API", "CONFIG", "MAIL", "RELAY", "STUB", "RUNTIME", "CONTROL", "RECORDER", "MAILBOX", "SMAREGI", "BATCH"}


def rows(p):
    r = [l.rstrip("\n").split("\t") for l in open(p, encoding="utf-8")]
    return r[0], [x for x in r[1:] if x and x != [""]]


def main():
    _, op = rows(CG / "precond/open_preconditions.tsv")
    by_seed = collections.defaultdict(lambda: ([], set()))     # シード → (行番号, 影響ケース)
    aff = collections.defaultdict(set)                        # 機能 → どれかの行の影響ケース
    roles = collections.defaultdict(set)                      # 機能 → 対象のシードの役割の語
    for n, r in enumerate(op, 2):
        ids = {c.strip() if c.strip().startswith("IT-") else f"IT-{r[0]}-{c.strip()}" for c in re.split(r"[,、]", r[3]) if c.strip()}
        aff[r[0]] |= ids
        for f, rest in SEED.findall(r[1]):
            s = f"S-{f}-{rest}"
            by_seed[s][0].append(n); by_seed[s][1].update(ids)
            roles[f] |= set(rest.split("-")) & ROLES
    use = collections.defaultdict(set)
    for p in glob.glob(str(CG / "cases/*_test_cases.tsv")):
        h, C = rows(p)
        i = h.index("使用シード")
        for x in C:
            for s in re.split(r"[,、]", x[i]):
                if s.strip():
                    use[s.strip()].add(x[0])
    out = []
    for s, (ns, ids) in by_seed.items():
        for c in sorted(use.get(s, set()) - ids):
            out.append(("同じシード", s, c, ",".join(map(str, ns))))
    for s, cs in use.items():
        m = SEED.fullmatch(s)
        if not m or s in by_seed:
            continue
        hit = set(m.group(2).split("-")) & roles.get(m.group(1), set())
        for c in sorted(cs - aff[m.group(1)]) if hit else ():
            out.append(("同じ役割の別名", s, c, "-".join(sorted(hit))))
    print("種別\tシード\tケース\t行または役割")
    for o in sorted(out):
        print("\t".join(o))
    print(f"候補 {len(out)}件（{len(set(o[2] for o in out))}ケース）", file=__import__("sys").stderr)


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""機能間データ連携のケース（link/cases/）を、既存の機能ごとのケースファイルへ合流させる（依頼者決定 2026-10-06）。

  merge_into_cases.py            何が起きるかを表示するだけ
  merge_into_cases.py --apply    cases/ と precond/added_cases.tsv、link/merged_map.tsv を書く

- テストIDは既存の連番の続きへ振り直す。保留として除外したケース（excluded_hold_cases.tsv）の番号も避ける。
- 列は既存の11列に合わせる。連携ケースだけが持つ「判定ID」列は落とし、対応は link/merged_map.tsv に残す。
- ケース専用シードIDは末尾の3桁を新しいケース番号に合わせる（precond/README.md P3）。
- 前提条件のゲートは基線（precond/baseline/）とテストIDの集合を照合するので、足したIDを precond/added_cases.tsv に載せる。
  基線は書き換えない。
- 2回流しても重複しない（merged_map.tsv に載った連携ケースは飛ばす）。
"""
import csv, glob, pathlib, re, sys, collections, datetime

CG = pathlib.Path(__file__).resolve().parents[1]
L = CG / "link"
HDR = ["テストID", "要求ID", "連鎖ID", "観点ID", "優先度", "実行区分", "使用シード", "事前準備", "手順", "期待結果", "出典"]
SHDR = ["シードID", "区分", "論理名", "状態・属性", "用途", "投入方法", "共有"]


def rd(p):
    if not p.exists():
        return None, []
    r = list(csv.reader(p.open(encoding="utf-8"), delimiter="\t"))
    return r[0], [x for x in r[1:] if x]


def wr(p, h, rows):
    with p.open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f, delimiter="\t", lineterminator="\n")
        w.writerow(h); w.writerows(rows)


def num(t):
    m = re.search(r"-(\d{3})$", t)
    return int(m.group(1)) if m else 0


def main(apply):
    mp = L / "merged_map.tsv"
    mh, done = rd(mp)
    done_old = {r[0] for r in done}
    held = collections.defaultdict(int)
    for r in csv.DictReader((CG / "excluded_hold_cases.tsv").open(encoding="utf-8"), delimiter="\t"):
        m = re.match(r"IT-(\w\d\d-\d\d)-(\d{3})$", r["テストID"])
        if m:
            held[m.group(1)] = max(held[m.group(1)], int(m.group(2)))
    ap = CG / "precond/added_cases.tsv"
    ah, added = rd(ap)
    newmap, newadded, total, newfiles = [], [], 0, []
    for p in sorted(glob.glob(str(L / "cases/*_link_test_cases.tsv"))):
        fid = pathlib.Path(p).name.split("_")[0]
        lh, LC = rd(pathlib.Path(p))
        LC = [c for c in LC if c[0] not in done_old]
        if not LC:
            continue
        _, LS = rd(L / f"cases/{fid}_link_seed_data.tsv")
        cp, sp = CG / f"cases/{fid}_test_cases.tsv", CG / f"cases/{fid}_seed_data.tsv"
        ch, C = rd(cp); sh, S = rd(sp)
        if ch is None:
            newfiles.append(fid); ch, C = HDR, []
        if sh is None:
            sh, S = SHDR, []
        assert ch == HDR, f"{fid}: 既存ケースの列が11列の規定と違う {ch}"
        assert sh == SHDR, f"{fid}: 既存シードの列が規定と違う {sh}"
        nxt = max([num(c[0]) for c in C] + [held[fid]]) + 1
        idx = {k: lh.index(k) for k in lh}
        seed_by = {s[0]: s for s in LS}
        have_seed = {s[0] for s in S}
        ren = {}                      # 旧文字列 → 新文字列（テストIDとケース専用シードID）
        plan = []
        for c in LC:
            old = c[0]; new = f"IT-{fid}-{nxt:03d}"; oldn = old.rsplit("-L", 1)[1]
            ren[old] = new
            for s in [x.strip() for x in re.split(r"[,、]", c[idx["使用シード"]]) if x.strip()]:
                row = seed_by.get(s)
                assert row, f"{old}: シード {s} が連携ケースのシード表に無い"
                if row[SHDR.index("共有")].strip() == "ケース専用":
                    assert s.endswith("-" + oldn), f"{old}: ケース専用シード {s} の末尾がケース番号でない"
                    ren[s] = s[: -len(oldn)] + f"{nxt:03d}"
            plan.append((c, old, new)); nxt += 1
        pat = re.compile("|".join(sorted(map(re.escape, ren), key=len, reverse=True)))
        sub = lambda x: pat.sub(lambda m: ren[m.group(0)], x)
        used = set()
        for c, old, new in plan:
            row = [sub(c[idx[k]]) for k in HDR]
            if row[1].strip() in ("—", "-"):      # 要求IDが無いものは空にする（既存の書き方。verify_cases.py は「—」を不明IDと数える）
                row[1] = ""
            C.append(row)
            used |= {x.strip() for x in re.split(r"[,、]", row[6]) if x.strip()}
            newmap.append([old, new, c[idx["判定ID"]], fid])
            newadded.append([new, datetime.date(2026, 10, 6).isoformat(), f"機能間データ連携（{c[idx['判定ID']]}。旧 {old}）"])
        for s in LS:
            r2 = [sub(v) for v in s]
            if r2[0] in used and r2[0] not in have_seed:
                S.append(r2); have_seed.add(r2[0])
        missing = used - have_seed
        assert not missing, f"{fid}: シードが足りない {missing}"
        total += len(plan)
        print(f"{fid}: {len(plan)}件 → {plan[0][2]}〜{plan[-1][2]}" + ("（ケースファイルを新設）" if fid in newfiles else ""))
        if apply:
            wr(cp, HDR, C); wr(sp, SHDR, S)
    print(f"計 {total}件 / 新設する機能 {newfiles}")
    if apply:
        wr(mp, ["連携ケースの旧テストID", "新テストID", "判定ID", "機能ID"], done + newmap)
        wr(ap, ["テストID", "追加日", "由来"], added + newadded)
        print("書き込んだ")


if __name__ == "__main__":
    main("--apply" in sys.argv)

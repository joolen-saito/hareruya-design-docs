#!/usr/bin/env python3
"""APIから画面・管理画面どうしの連携ケース（link_flow/cases/）を、機能ごとのケースファイルへ合流させる。

  merge_flow.py            何が起きるかを表示するだけ
  merge_flow.py --apply    ../cases/ と ../precond/added_cases.tsv、merged_map.tsv を書く

../link_pub/merge_pub.py を元にした。違いは、番号を避ける除外の表に excluded_scope_cases.tsv を加えたことだけ。
../link/merge_into_cases.py と同じ考え方で、次だけ違う。
- 作業ファイルは群ごと（14列）で、テストIDは `IT-<機能ID>-<群><3桁>`。機能ごとに振り分ける。
- テストIDは既存の連番の続きへ振り直す。保留の除外（excluded_hold_cases.tsv）と未確定の除外
  （excluded_open_cases.tsv）の番号も避ける。
- 判定ID・上流機能・下流機能の列は落とし、対応は merged_map.tsv に残す。
- ケース専用シードIDは末尾の3桁を新しいケース番号に合わせる（precond/README.md P3）。
- セル内にタブ・改行が無い決まりなので、行はタブで分けて読み、タブで連結して書く（csv の引用符処理で中身を変えない）。
- 2回流しても重複しない（merged_map.tsv に載ったケースは飛ばす）。
"""
import glob, pathlib, re, sys, collections

P = pathlib.Path(__file__).resolve().parent
CG = P.parent
HDR = ["テストID", "要求ID", "連鎖ID", "観点ID", "優先度", "実行区分", "使用シード", "事前準備", "手順", "期待結果", "出典"]
SHDR = ["シードID", "区分", "論理名", "状態・属性", "用途", "投入方法", "共有"]
TODAY = "2026-10-16"


def rd(p):
    if not p.exists():
        return None, []
    lines = [l for l in p.read_text(encoding="utf-8").split("\n") if l]
    return lines[0].split("\t"), [l.split("\t") for l in lines[1:]]


def wr(p, h, rows):
    p.write_text("\n".join("\t".join(r) for r in [h] + rows) + "\n", encoding="utf-8")


def num(t):
    m = re.search(r"-(\d{3})$", t)
    return int(m.group(1)) if m else 0


def main(apply):
    mp = P / "merged_map.tsv"
    _, done = rd(mp)
    done_old = {r[0] for r in done}
    taken = collections.defaultdict(int)          # 除外したケースの番号も避ける
    for name in ("excluded_hold_cases.tsv", "excluded_open_cases.tsv", "excluded_scope_cases.tsv"):
        _, rows = rd(CG / name)
        for r in rows:
            m = re.match(r"IT-(\w\d\d-\d\d)-(\d{3})$", r[0])
            if m:
                taken[m.group(1)] = max(taken[m.group(1)], int(m.group(2)))
    ah, added = rd(CG / "precond/added_cases.tsv")
    # 群ごとの作業ファイルを、ケースを置く機能ごとに束ねる
    by_fid = collections.defaultdict(list)
    seeds = {}
    for p in sorted(glob.glob(str(P / "cases/*_test_cases.tsv"))):
        code = pathlib.Path(p).name.split("_")[0]
        h, rows = rd(pathlib.Path(p))
        ix = {k: h.index(k) for k in h}
        for r in rows:
            assert len(r) == len(h), f"{code}: 列数が合わない {r[0]}"
            if r[0] in done_old:
                continue
            m = re.match(rf"^IT-([A-Z]\d\d-\d\d)-{code}(\d{{3}})$", r[0])
            assert m, f"{code}: テストIDの形が違う {r[0]}"
            by_fid[m.group(1)].append((code, ix, r))
        sh, srows = rd(P / f"cases/{code}_seed_data.tsv")
        if sh:
            assert sh == SHDR, f"{code}: シード表の列が違う"
            for s in srows:
                assert s[0] not in seeds, f"シードIDが群の間で重なる {s[0]}"
                seeds[s[0]] = s
    newmap, newadded, total, newfiles = [], [], 0, []
    for fid in sorted(by_fid):
        cp, sp = CG / f"cases/{fid}_test_cases.tsv", CG / f"cases/{fid}_seed_data.tsv"
        ch, C = rd(cp); sh, S = rd(sp)
        if ch is None:
            newfiles.append(fid); ch, C = HDR, []
        if sh is None:
            sh, S = SHDR, []
        assert ch == HDR, f"{fid}: 既存ケースの列が11列の規定と違う {ch}"
        assert sh == SHDR, f"{fid}: 既存シードの列が規定と違う {sh}"
        nxt = max([num(c[0]) for c in C] + [taken[fid]]) + 1
        have_seed = {s[0] for s in S}
        ren, plan = {}, []
        for code, ix, c in by_fid[fid]:
            old = c[0]; new = f"IT-{fid}-{nxt:03d}"; oldn = old[-3:]
            ren[old] = new
            for s in [x.strip() for x in re.split(r"[,、]", c[ix["使用シード"]]) if x.strip()]:
                row = seeds.get(s)
                assert row, f"{old}: シード {s} が群のシード表に無い"
                if row[SHDR.index("共有")].strip() == "ケース専用":
                    assert s.endswith("-" + oldn), f"{old}: ケース専用シード {s} の末尾がケース番号でない"
                    ren[s] = s[: -len(oldn)] + f"{nxt:03d}"
            plan.append((code, ix, c, old, new)); nxt += 1
        pat = re.compile("|".join(sorted(map(re.escape, ren), key=len, reverse=True)))
        sub = lambda x: pat.sub(lambda m: ren[m.group(0)], x)
        used = []
        for code, ix, c, old, new in plan:
            row = [sub(c[ix[k]]) for k in HDR]
            if row[1].strip() in ("—", "-"):
                row[1] = ""
            C.append(row)
            for s in [x.strip() for x in re.split(r"[,、]", row[6]) if x.strip()]:
                if s not in used:
                    used.append(s)
            newmap.append([old, new, c[ix["判定ID"]], c[ix["上流機能"]], c[ix["下流機能"]], fid, code])
            newadded.append([new, TODAY, f"機能間データ連携・APIから画面／管理画面どうし（{c[ix['判定ID']]}。旧 {old}）"])
        inv = {v: k for k, v in ren.items()}
        for s in used:
            if s in have_seed:
                continue
            src = seeds[inv.get(s, s)]
            S.append([sub(v) for v in src]); have_seed.add(s)
        total += len(plan)
        print(f"{fid}: {len(plan)}件 → {plan[0][4]}〜{plan[-1][4]}" + ("（ケースファイルを新設）" if fid in newfiles else ""))
        if apply:
            wr(cp, HDR, C); wr(sp, SHDR, S)
    print(f"計 {total}件 / 新設する機能 {newfiles}")
    if apply:
        wr(mp, ["旧テストID", "新テストID", "判定ID", "上流機能", "下流機能", "機能ID", "群"], done + newmap)
        wr(CG / "precond/added_cases.tsv", ah, added + newadded)
        print("書き込んだ")


if __name__ == "__main__":
    main("--apply" in sys.argv)

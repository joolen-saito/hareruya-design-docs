#!/usr/bin/env python3
"""フェーズ2見送りの機能、実装しない機能のケースを、ケースの正本から外す（依頼者決定 2026-10-16）。 exclude_scope.py

外す機能・ケースは scope_out.tsv（種別=機能 は機能IDのケースすべて、種別=ケース はそのテストIDだけ。根拠つき）。
探す場所は3つ。cases/（ケース一覧）、excluded_open_cases.tsv（作り方が未確定で外したもの）、excluded_hold_cases.tsv（保留で外したもの）。
作り方や設計者の回答が決まっても戻さないので、どれも excluded_scope_cases.tsv へ移す（元の表と元の除外理由を残す。元の11列は「元_」付き）。
外したケースだけが使っていたシードは excluded_scope_seeds.tsv へ移す。

何度流しても同じ（前回までに移した行は残し、同じテストIDが再び現れたら最新の内容で置き換える）。
exclude_open.py は前回の除外表から cases/ へ戻してから判定し直すので、これは exclude_open.py の後に流す。
順序は merge → seed_screen/apply.py → datapattern/conflicts/apply_rulings.py → exclude_open.py → これ → build_all_test_cases.py → precond/gate_precond.py --all。
"""
import pathlib, collections

CG = pathlib.Path(__file__).resolve().parent


def rows(p):
    ls = [l.rstrip("\n").split("\t") for l in open(p, encoding="utf-8")]
    return ls[0], [x for x in ls[1:] if x and x != [""]]


def write(p, h, rs):
    p.write_text("".join("\t".join(r) + "\n" for r in [h] + rs), encoding="utf-8")


def seeds_of(s):
    return [x.strip() for x in s.replace("、", ",").split(",") if x.strip() and x.strip() != "—"]


def main():
    sh, S = rows(CG / "scope_out.tsv")
    S = [dict(zip(sh, r)) for r in S]
    funcs = {r["ID"]: r for r in S if r["種別"] == "機能"}
    cases = {r["ID"]: r for r in S if r["種別"] == "ケース"}

    def hit(tid):
        return cases.get(tid) or funcs.get(tid[3:9])

    CH = ["テストID", "要求ID", "連鎖ID", "観点ID", "優先度", "実行区分", "使用シード", "事前準備", "手順", "期待結果", "出典"]
    OH = ["テストID", "機能ID", "区分", "根拠", "元の表", "元の除外理由"] + ["元_" + c for c in CH]
    SH = ["機能ID", "使用していた除外ケース", "シードID", "区分", "論理名", "状態・属性", "用途", "投入方法", "共有"]
    op, sp = CG / "excluded_scope_cases.tsv", CG / "excluded_scope_seeds.tsv"
    out = {r[0]: r for r in rows(op)[1]} if op.exists() else {}
    outs = {(r[0], r[2]): r for r in rows(sp)[1]} if sp.exists() else {}
    n = collections.Counter()

    def take(tid, fid, where, why, case11):
        s = hit(tid)
        out[tid] = [tid, fid, s["区分"], s["根拠"], where, why] + case11
        n[where] += 1

    # 1. cases/
    for p in sorted(CG.glob("cases/*_test_cases.tsv")):
        fid = p.name.split("_")[0]
        h, C = rows(p)
        if h != CH:
            raise SystemExit(f"{p.name}: 見出しが想定と違う")
        drop = [x for x in C if hit(x[0])]
        if not drop:
            continue
        keep = [x for x in C if not hit(x[0])]
        for x in drop:
            take(x[0], fid, "cases", "", x)
        used = {s for x in keep for s in seeds_of(x[6])}
        by = collections.defaultdict(list)
        for x in drop:
            for s in seeds_of(x[6]):
                by[s].append(x[0])
        sdp = CG / f"cases/{fid}_seed_data.tsv"
        hs, SD = rows(sdp)
        for x in SD:
            if x[0] in by and x[0] not in used:
                outs[(fid, x[0])] = [fid, ",".join(by[x[0]])] + x
        write(p, h, keep)
        write(sdp, hs, [x for x in SD if not (x[0] in by and x[0] not in used)])

    # 2. 作り方が未確定で外した表・3. 保留で外した表
    for name, sname, why_cols in (("excluded_open_cases.tsv", "excluded_open_seeds.tsv", ("除外理由", "未確定の内容")),
                                  ("excluded_hold_cases.tsv", "excluded_hold_seeds.tsv", ("論点ID", "除外理由"))):
        h, R = rows(CG / name)
        ix = {c: i for i, c in enumerate(h)}
        keep, moved = [], set()
        for r in R:
            if hit(r[0]):
                why = "：".join(r[ix[c]] for c in why_cols if r[ix[c]])
                take(r[0], r[ix["機能ID"]], name.replace("_cases.tsv", ""), why, [r[ix["元_" + c]] for c in CH])
                moved.add(r[0])
            else:
                keep.append(r)
        write(CG / name, h, keep)
        hs, SD = rows(CG / sname)
        keep_s = []
        for r in SD:
            users = [u for u in r[1].split(",") if u]
            if users and all(u in moved or hit(u) for u in users):
                outs[(r[0], r[2])] = r
            else:
                keep_s.append(r)
        write(CG / sname, hs, keep_s)

    write(op, OH, sorted(out.values(), key=lambda r: r[0]))
    write(sp, SH, sorted(outs.values(), key=lambda r: (r[0], r[2])))
    by_f = collections.Counter(r[1] for r in out.values())
    print(f"今回移した {sum(n.values())}件 {dict(n)} / 対象外の表 {len(out)}件・シード {len(outs)}件 / 機能別 {dict(sorted(by_f.items()))}")


if __name__ == "__main__":
    main()

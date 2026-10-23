#!/usr/bin/env python3
"""書き直して戻すケース（revive/cases）を、機能ごとのケースファイル（cases/）へ入れる。 apply_revive.py

依頼者の決定（2026-10-23）: B16-09 は出力内容だけを確かめる／MTGバイヤーの試験端末は用意できる。
何度流しても同じ。fp_gap/merge_fg.py の後、exclude_open.py の前に流す。
- cases/<機能ID>_test_cases.tsv: 戻すケースの行を入れる（同じテストIDの行は差し替える）。
- cases/<機能ID>_seed_data.tsv: 書き直したシード（共通の環境シード・担当が書いたシード）を同じシードIDで差し替える／足す。
  書き直さなかった元のシードは exclude_open.py が excluded_open_seeds.tsv から戻す。
- precond/open_preconditions.tsv: 影響ケースから戻すケースを外す。影響ケースが無くなった行は resolved_preconditions.tsv へ移す。
戻したテストIDは rv_applied.tsv に残す。
"""
import csv, glob, pathlib, re, collections

R = pathlib.Path(__file__).resolve().parent
CG = R.parent
PC = CG / "precond"
HDR = ["テストID", "要求ID", "連鎖ID", "観点ID", "優先度", "実行区分", "使用シード", "事前準備", "手順", "期待結果", "出典"]
SHDR = ["シードID", "区分", "論理名", "状態・属性", "用途", "投入方法", "共有"]
MARK = "revive/（2026-10-23 依頼者決定で書き直して戻した）"
csv.field_size_limit(10**9)


def rows(p):
    r = [l.rstrip("\n").split("\t") for l in open(p, encoding="utf-8")]
    return r[0], [x for x in r[1:] if x and x != [""]]


def write(p, h, rs):
    open(p, "w", encoding="utf-8", newline="").write("".join("\t".join(r) + "\n" for r in [h] + rs))


def main():
    parts = list(csv.DictReader(open(R / "parts.tsv", encoding="utf-8"), delimiter="\t"))
    fids = sorted({p["機能ID"] for p in parts})
    prev = {r[0] for r in rows(R / "rv_applied.tsv")[1]} if (R / "rv_applied.tsv").exists() else set()
    prev_s = {r[0] for r in rows(R / "rv_seeds.tsv")[1]} if (R / "rv_seeds.tsv").exists() else set()
    applied, seeds_out, n = [], [], collections.Counter()
    for fid in fids:
        C, S = [], []
        for p in sorted(glob.glob(str(R / f"cases/{fid}_*_rv_test_cases.tsv"))):
            h, x = rows(p); assert h == HDR, p; C += x
        for p in [R / f"cases/{fid}_rv_shared_seeds.tsv"] + sorted(map(pathlib.Path, glob.glob(str(R / f"cases/{fid}_*_rv_seed_data.tsv")))):
            if p.exists():
                h, x = rows(p); assert h == SHDR, p; S += x
        # 前回戻して今回は戻さないケース・シードは、元の行（外したときのもの）へ戻す。exclude_open.py がまた外す
        eh, E = rows(R / f"units/{fid}/excluded_cases.tsv")
        orig = {x[0]: [x[0]] + x[4:] for x in E}
        esh, ES = rows(R / f"units/{fid}/excluded_seeds.tsv")
        orig_s = {x[0]: x[:7] for x in ES}
        cp, sp = CG / f"cases/{fid}_test_cases.tsv", CG / f"cases/{fid}_seed_data.tsv"
        h, base = rows(cp); assert h == HDR, cp
        ids = {x[0] for x in C}
        gone = [orig[t] for t in prev if t in orig and t not in ids]
        write(cp, HDR, sorted([x for x in base if x[0] not in ids and x[0] not in prev] + C + gone, key=lambda x: x[0]))
        sh, sbase = rows(sp) if sp.exists() else (SHDR, [])
        sids = {x[0] for x in S}
        gone_s = [orig_s[s] for s in prev_s if s in orig_s and s not in sids]
        write(sp, SHDR, [x for x in sbase if x[0] not in sids and x[0] not in prev_s] + S + gone_s)
        seeds_out += [[x[0], fid] for x in S]
        applied += [[t, fid] for t in sorted(ids)]
        n[fid] = len(ids)
    back = {t for t, _ in applied}
    oh, op = rows(PC / "open_preconditions.tsv")
    rh, rs = rows(PC / "resolved_preconditions.tsv")
    rs = [r for r in rs if not (len(r) > 6 and r[6] == MARK)]
    NOT = "revive/（戻さない）"
    op = [r for r in op if not (len(r) > 4 and r[4] == NOT)]
    keep, moved = [], 0
    for r in op:
        lst = [c.strip() for c in re.split(r"[,、]", r[3]) if c.strip()]
        full = [c if c.startswith("IT-") else f"IT-{r[0]}-{c}" for c in lst]
        rest = [c for c, f in zip(lst, full) if f not in back]
        if len(rest) == len(lst):
            keep.append(r); continue
        if rest:
            keep.append(r[:3] + [",".join(rest)] + r[4:])
        else:
            moved += 1
            rs.append(r[:6] + [MARK, "依頼者決定", "B16-09は出力内容だけを確かめる／MTGバイヤーの試験端末は用意できる（中継は使わない形に書き直した）", "2026-10-23"])
    # 戻さないと決めたケースは、元の前提のシードが解けても外れたままにする（exclude_open.py が影響ケースとして外す）
    for fid in fids:
        nots = []
        for p in sorted(glob.glob(str(R / f"cases/{fid}_*_rv_dispositions.tsv"))):
            nots += [x[0] for x in rows(p)[1] if len(x) > 1 and x[1] == "戻さない"]
        if nots:
            keep.append([fid, "revive/戻さない", f"2026-10-23 の見直し（B16-09は出力内容だけ・MTGバイヤーの試験端末は用意できる）でも戻さないケース。理由は revive/cases/{fid}_*_rv_dispositions.tsv", ",".join(sorted(nots)), NOT, "未確定"])
    write(PC / "open_preconditions.tsv", oh, keep)
    write(PC / "resolved_preconditions.tsv", rh, rs)
    write(R / "rv_applied.tsv", ["テストID", "機能ID"], applied)
    write(R / "rv_seeds.tsv", ["シードID", "機能ID"], seeds_out)
    print("戻した", dict(n), "計", len(applied), "／前提の行を解消へ移した", moved)


if __name__ == "__main__":
    main()

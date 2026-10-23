#!/usr/bin/env python3
"""画面で作る形への書き直し（out/<機能ID>.tsv・cases/<機能ID>.tsv）を、ケースの正本（../cases/）へ当てる。 apply.py [機能ID...]

- シード: 判定が 画面・画面+DB の行の 状態・属性 と 投入方法 を置き換える。
- ケース: cases/<機能ID>.tsv にあるテストIDの 事前準備・手順・期待結果 を置き換える。
- 前提条件の検査（precond/gate_precond.py）は、書き直し前の基線から期待結果・手順を変えるときに宣言を求める。
  基線にあるケースについて、precond/oracle_changes/・step_changes/ に宣言を書く（類型T4: 画面が振る番号は控えた値を使う）。
- 実在しない試験用URLは、../dummy_url/urlmap.N（2026-10-21 依頼者決定）を当てた文で書く（置き換えた後の文と照合して、
  URLの違いだけで宣言を書き足さない）。
- 何度流しても同じ。sheetmap・nosheet・gapfill・ga の merge_into_cases.py を流すと ../cases/ が作業ファイルの内容へ戻るので、
  そのあとに必ずこれを流し直す。gate.py が合格した機能だけを当てる。
"""
import csv, pathlib, re, subprocess, sys
G = pathlib.Path(__file__).resolve().parent
CG = G.parent
PC = CG / "precond"
sys.path.insert(0, str(CG / "dummy_url"))
from urlmap import N  # noqa: E402
csv.field_size_limit(10**9)
T4 = "類型承認T4（画面が自動で振る番号は、画面で登録したときに控えた値を使う。2026-10-09 依頼者）"
WHY = "画面が自動で振る番号を固定値で書いていた。データを画面で作る形に改め、登録時に控えた番号を使う"


def rows(p):
    r = [l.rstrip("\n").split("\t") for l in open(p, encoding="utf-8")]
    return r[0], [x for x in r[1:] if x and x != [""]]


def dicts(p):
    return list(csv.DictReader(open(p, encoding="utf-8"), delimiter="\t", quoting=csv.QUOTE_NONE))


def write(p, h, rs):
    open(p, "w", encoding="utf-8", newline="").write("".join("\t".join(r) + "\n" for r in [h] + rs))


def upsert(p, head, key, vals):
    """宣言ファイルの テストID の行を足す・置き換える"""
    h, rs = rows(p) if p.exists() else (head, [])
    assert h == head, (p, h)
    hit = [r for r in rs if r[0] == key]      # 同じテストIDの行が複数ある宣言ファイルがある（検査は最後の行を読む）。全部に当てる
    for r in hit:
        r[1:] = vals(r)
    if not hit:
        rs.append([key] + vals(None))
    write(p, h, rs)


def main(fids):
    T = [r["機能ID"] for r in dicts(G / "targets.tsv")]
    added = {r["テストID"] for r in dicts(PC / "added_cases.tsv")}
    ns = nc = 0
    for fid in (fids or T):
        if not (G / f"out/{fid}.tsv").exists() or not (G / f"cases/{fid}.tsv").exists():
            continue
        if subprocess.run([sys.executable, str(G / "gate.py"), fid], capture_output=True).returncode:
            print(f"{fid}: gate 不合格のため当てない"); continue
        S = {r["シードID"].strip(): r for r in dicts(G / f"out/{fid}.tsv") if r["判定"].strip() != "DB"}
        h, rs = rows(CG / f"cases/{fid}_seed_data.tsv")
        for r in rs:
            if r[0] in S:
                r[3], r[5] = N(S[r[0]]["新しい状態・属性"].strip()), N(S[r[0]]["新しい投入方法"].strip()); ns += 1
        write(CG / f"cases/{fid}_seed_data.tsv", h, rs)
        C = {r["テストID"].strip(): r for r in dicts(G / f"cases/{fid}.tsv")}
        h, rs = rows(CG / f"cases/{fid}_test_cases.tsv")
        ia, ib, ic = h.index("事前準備"), h.index("手順"), h.index("期待結果")
        for r in rs:
            c = C.get(r[0])
            if not c:
                continue
            a, b, e = (N(c[k].strip()) for k in ("新事前準備", "新手順", "新期待結果"))
            if r[0] not in added:      # 基線にあるケースは宣言が要る
                if e != r[ic] or (PC / f"oracle_changes/{fid}.tsv").exists() and any(x[0] == r[0] for x in rows(PC / f"oracle_changes/{fid}.tsv")[1]):
                    upsert(PC / f"oracle_changes/{fid}.tsv", ["テストID", "新期待結果", "理由", "承認"], r[0],
                           lambda o: [e, (o[2] if o and WHY in o[2] else ((o[2] + "／" if o and o[2] else "") + WHY)),
                                      (o[3] if o and "T4" in o[3] else ((o[3] + "／" if o and o[3] else "") + T4))])
                if b != r[ib] or (PC / f"step_changes/{fid}.tsv").exists() and any(x[0] == r[0] for x in rows(PC / f"step_changes/{fid}.tsv")[1]):
                    upsert(PC / f"step_changes/{fid}.tsv", ["テストID", "種別", "新手順", "理由"], r[0],
                           lambda o: [(o[1] if o and "発番値控え" in o[1] else ((o[1] + "," if o and o[1] else "") + "発番値控え")), b,
                                      (o[3] if o and WHY in o[3] else ((o[3] + "／" if o and o[3] else "") + WHY))])
            r[ia], r[ib], r[ic] = a, b, e; nc += 1
        write(CG / f"cases/{fid}_test_cases.tsv", h, rs)
    # 控えた番号へ置き換えたケースの一覧（前提条件の検査が改名先の検査を外すのに使う）。全機能分を作り直す
    noted = sorted(r["テストID"].strip() for p in G.glob("cases/*.tsv") if (G / f"out/{p.stem}.tsv").exists() for r in dicts(p))
    write(PC / "screen_noted_cases.tsv", ["テストID"], [[t] for t in noted])
    print(f"シード {ns}件・ケース {nc}件に当てた")


main(sys.argv[1:])

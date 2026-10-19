#!/usr/bin/env python3
"""既存ケースと設計書の食い違いの裁定（rulings.tsv）を、ケースの正本（../../cases/）へ当てる。 apply_rulings.py

依頼者決定（2026-10-16）: 設計書の中で記述が食い違うときは Excel由来＞埋め込みの表示メッセージ節＞埋め込みの現行仕様節、
同じ出所では改訂後を採る。規則で決まらないものは両方に共通する部分だけを期待結果に書き直し、共通部分が無いケースは保留として外す。
現行の不具合を書いた記述に当たるケースは外す（2026-09-28 決定）。項目ごとの裁定は decisions.tsv、設計者への問いは questions.tsv。

- 処置が「保留へ外す」の行: ケースを ../../excluded_hold_cases.tsv へ移す（論点ID・決める人＝設計者・除外理由つき）。
  そのケースだけが使っていたシードは ../../excluded_hold_seeds.tsv へ移す。
- それ以外の行: 事前準備・手順は「旧⇒新」の置き換え（‖ 区切りで複数）、期待結果は丸ごと差し替える。シードは「シードID|列|旧⇒新」。
  ケースが excluded_open_cases.tsv に外れているとき（作り方が未確定）は、その表の「元_」列を直す（exclude_open.py が戻すときに直った値で戻る）。
- 新出典の欄があれば出典を差し替える（裁定と食い違う出典の書き方を直す）。
- 裁定日の欄は、承認に書く日付。空の行は 2026-10-16（最初の裁定の日）とする。
- added_seeds.tsv に裁定と同じテストID・項目の行があれば、そのシードを cases/ のシード表に置き（同じシードIDがあれば差し替える）、
  ケースの使用シードに足す。ケース専用のシードを足したケースは、読み取りだけの宣言（precond/readonly_cases/）から外す。
  事前準備への書き足し（新が旧を含む置き換え）は、新が既にあれば済みとみなす。
- 基線（../../precond/baseline/）にあるケースは、期待結果の変更を precond/oracle_changes/ に、手順の変更を precond/step_changes/（種別「裁定訂正」）に、
  出典の変更を precond/source_changes/ に宣言する。
  既に行があれば（類型T4 など）新しい値に差し替え、理由と承認に裁定を書き足す。

何度流しても同じ（置き換えは旧が無く新があれば済みとみなす）。
流す順は merge（sheetmap・nosheet・ga・gapfill・datapattern/merge_dp.py）→ seed_screen/apply.py → これ → exclude_open.py
→ exclude_scope.py → build_all_test_cases.py → precond/gate_precond.py --all。seed_screen/apply.py が cases/ と oracle_changes/ を書き直すので、必ずその後に流す。
"""
import pathlib, sys

G = pathlib.Path(__file__).resolve().parent
CG = G.parents[1]
PC = CG / "precond"
DAY = "2026-10-16"  # 裁定日の欄が空の行の裁定日
APPROVAL = "%s 依頼者裁定（既存ケースと設計書の食い違いの裁定。datapattern/conflicts/rulings.tsv %s）"


def rows(p):
    ls = [l.rstrip("\n").split("\t") for l in open(p, encoding="utf-8")]
    return ls[0], [x for x in ls[1:] if x and x != [""]]


def write(p, h, rs):
    p.write_text("".join("\t".join(r) + "\n" for r in [h] + rs), encoding="utf-8")


def pairs(s):
    return [tuple(x.split("⇒", 1)) for x in s.split("‖") if x]


def replace(text, spec, where, err):
    for old, new in pairs(spec):
        if old in new and new in text:  # 書き足し（新が旧を含む）は、新が既にあれば済み
            continue
        if old in text:
            text = text.replace(old, new)
        elif new and new not in text:   # 削る置き換え（新が空）は、旧が無ければ削り済みとみなす
            err.append(f"{where}: 置き換え元が無い: {old[:60]}")
    return text


def append_once(s, add):
    return s if add in s else (s + "／" + add if s.strip() else add)


def upsert(path, hdr, tid, fill, err):
    """宣言の表の tid の行を fill(row_dict or None) -> row_dict で書き換える"""
    if path.exists():
        h, rs = rows(path)
    else:
        h, rs = hdr, []
    if h != hdr:
        err.append(f"{path.name}: 見出しが想定と違う {h}")
        return
    idx = {r[0]: i for i, r in enumerate(rs)}
    old = dict(zip(h, rs[idx[tid]])) if tid in idx else None
    new = fill(old)
    line = [new[c] for c in h]
    if tid in idx:
        rs[idx[tid]] = line
    else:
        rs.append(line)
    write(path, h, rs)


def main():
    rh, R = rows(G / "rulings.tsv")
    R = [dict(zip(rh, r)) for r in R]
    eh, E = rows(CG / "excluded_open_cases.tsv")
    hh, H = rows(CG / "excluded_hold_cases.tsv")
    hsh, HS = rows(CG / "excluded_hold_seeds.tsv")
    held = {r[0] for r in H}
    ap = G / "added_seeds.tsv"
    ah, A = rows(ap) if ap.exists() else ([], [])
    A = [dict(zip(ah, r)) for r in A]
    for a in A:
        if not any(r["テストID"] == a["テストID"] and r["項目"] == a["項目"] for r in R):
            print(f"  誤り: added_seeds.tsv の {a['テストID']} {a['項目']} に当たる裁定が rulings.tsv に無い")
            return 1
    err, done = [], {"直した": 0, "保留へ外した": 0, "済み": 0}
    for fid in sorted({r["テストID"][3:9] for r in R}):
        cp, sp = CG / f"cases/{fid}_test_cases.tsv", CG / f"cases/{fid}_seed_data.tsv"
        ch, C = rows(cp)
        sh, S = rows(sp)
        bp = PC / f"baseline/{fid}_test_cases.tsv"
        base = {r[0] for r in rows(bp)[1]} if bp.exists() else set()
        ci = {c: i for i, c in enumerate(ch)}
        si = {c: i for i, c in enumerate(sh)}
        for rl in [r for r in R if r["テストID"][3:9] == fid]:
            tid, item = rl["テストID"], rl["項目"]
            row = next((x for x in C if x[0] == tid), None)
            if rl["処置"] == "保留へ外す":
                if row is None:
                    if tid not in held:
                        err.append(f"{tid}: cases/ にも保留の表にも無い")
                    else:
                        done["済み"] += 1
                    continue
                C.remove(row)
                H.append([tid, fid, rl["論点ID"], "設計者", rl["根拠"]] + row)
                held.add(tid)
                used = {s.strip() for x in C for s in x[ci["使用シード"]].split(",")}
                for s in [s.strip() for s in row[ci["使用シード"]].split(",")]:
                    srow = next((x for x in S if x[0] == s), None)
                    if srow and s not in used:
                        S.remove(srow)
                        HS.append([fid, tid] + srow)
                done["保留へ外した"] += 1
                continue
            # 直す
            if row is not None:
                get = lambda c: row[ci[c]]
                def put(c, v): row[ci[c]] = v
            else:
                erow = next((x for x in E if x[0] == tid), None)
                if erow is None:
                    err.append(f"{tid}: cases/ にも excluded_open にも無い")
                    continue
                ei = {c: i for i, c in enumerate(eh)}
                get = lambda c: erow[ei["元_" + c]]
                def put(c, v): erow[ei["元_" + c]] = v
            state = lambda: (get("事前準備"), get("手順"), get("期待結果"), get("出典"), get("使用シード"),
                             "\n".join("\t".join(x) for x in S))
            before = state()
            if rl.get("新出典"):
                put("出典", rl["新出典"])
            if rl["事前準備の置換"]:
                put("事前準備", replace(get("事前準備"), rl["事前準備の置換"], f"{tid} 事前準備", err))
            if rl["手順の置換"]:
                put("手順", replace(get("手順"), rl["手順の置換"], f"{tid} 手順", err))
            if rl["新期待結果"]:
                put("期待結果", rl["新期待結果"])
            for spec in [x for x in rl["シードの置換"].split("‖") if x]:
                sid, col, rep = spec.split("|", 2)
                srow = next((x for x in S if x[0] == sid), None)
                if srow is None:
                    err.append(f"{tid}: シード {sid} が cases/ に無い")
                    continue
                srow[si[col]] = replace(srow[si[col]], rep, f"{sid} {col}", err)
            for a in [a for a in A if a["テストID"] == tid and a["項目"] == item]:
                new = [a[c] for c in sh]
                at = next((i for i, x in enumerate(S) if x[0] == a["シードID"]), None)
                if at is None:
                    S.append(new)
                else:
                    S[at] = new
                used = [s.strip() for s in get("使用シード").split(",") if s.strip()]
                if a["シードID"] not in used:
                    put("使用シード", ",".join(used + [a["シードID"]]))
                if a["共有"] == "ケース専用":
                    rp = PC / f"readonly_cases/{fid}.tsv"
                    if rp.exists():
                        rh_, ro = rows(rp)
                        if any(x[0] == tid for x in ro):
                            write(rp, rh_, [x for x in ro if x[0] != tid])
            done["直した" if before != state() else "済み"] += 1
            if tid not in base:
                continue
            why = f"{rl['根拠']}（{item}）"
            if rl.get("新出典"):
                upsert(PC / f"source_changes/{fid}.tsv", ["テストID", "新出典", "理由"], tid, lambda o: {
                    "テストID": tid, "新出典": get("出典"),
                    "理由": append_once(o["理由"] if o else "", why)}, err)
            if rl["新期待結果"]:
                upsert(PC / f"oracle_changes/{fid}.tsv", ["テストID", "新期待結果", "理由", "承認"], tid, lambda o: {
                    "テストID": tid, "新期待結果": get("期待結果"),
                    "理由": append_once(o["理由"] if o else "", why),
                    "承認": append_once(o["承認"] if o else "", APPROVAL % (rl.get("裁定日") or DAY, item))}, err)
            if rl["手順の置換"]:
                upsert(PC / f"step_changes/{fid}.tsv", ["テストID", "種別", "新手順", "理由"], tid, lambda o: {
                    "テストID": tid, "新手順": get("手順"),
                    "種別": "裁定訂正" if not o else ",".join(dict.fromkeys(o["種別"].split(",") + ["裁定訂正"])),
                    "理由": append_once(o["理由"] if o else "", why)}, err)
        write(cp, ch, C)
        write(sp, sh, S)
    write(CG / "excluded_open_cases.tsv", eh, E)
    write(CG / "excluded_hold_cases.tsv", hh, H)
    write(CG / "excluded_hold_seeds.tsv", hsh, HS)
    print(" / ".join(f"{k} {v}件" for k, v in done.items()))
    for e in err:
        print("  誤り:", e)
    return 1 if err else 0


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
"""データパターン監査の機械検査。 gate_dp.py <機能ID>...（引数なしは audit/ にある全機能）

audit/<機能ID>.tsv           形式・連番・パターン名・根拠の行の実在・判定ごとの必須欄・テストIDの実在
audit/<機能ID>_keylines.tsv  units/<機能ID>/keylines.tsv の全行に扱いがあること（読み飛ばしの検査）。
                             扱い=項目 の行は、挙げた項目の根拠にその行が含まれること
"""
import csv, pathlib, re, sys

P = pathlib.Path(__file__).resolve().parent
C = P.parent
csv.field_size_limit(10**9)
HDR = ["項目ID", "パターン", "定め", "根拠", "試すデータ", "結果", "確かめる所", "判定", "テストID", "理由"]
KHDR = ["行", "扱い", "項目ID・理由"]
PAT = {"数量・件数", "組合せ", "有無", "混在", "状態・区分ごと", "端数", "ちょうどの値", "同じデータの重ね"}
JUD = {"ケースあり", "抜け", "除外済み", "対象外"}
REF = re.compile(r"^(?:_common/([^:]+):)?L(\d{4})(?:-L(\d{4}))?$")


def rows(p):
    t = p.read_text(encoding="utf-8").split("\n")
    return [l.split("\t") for l in t if l.strip()]


def ids_of(fn, col="テストID"):
    with open(C / fn, encoding="utf-8") as f:
        return {r[col] for r in csv.DictReader(f, delimiter="\t")}


# 一覧のテストIDは機能ごとに振り直した連番なので（2026-10-23）、対応表で cases/ のテストIDを引く
ALL = ids_of("all_test_cases_id_map.tsv", "cases/のテストID")
# 監査の後、既存ケースと設計書の食い違いの裁定（2026-10-16。conflicts/）で保留へ外したケース（論点ID QD-）。
# 監査が「ケースあり」で挙げたテストIDがこれに当たるときは、テストIDの実在の検査を通し、件数だけを出す
RULED = {r[0] for r in rows(C / "excluded_hold_cases.tsv")[1:] if r[2].startswith("QD-")}   # 列: テストID 機能ID 論点ID …
# フェーズ2見送り・実装しない機能として外したケース（2026-10-16。../exclude_scope.py）も同じ扱いにする
if (C / "excluded_scope_cases.tsv").exists():
    RULED |= {r[0] for r in rows(C / "excluded_scope_cases.tsv")[1:]}
ruled_hits = []
back_hits = []   # 「除外済み」と判定したケースのうち、監査の後に一覧へ戻ったもの（2026-10-19 runnable/ で作り方が決まった）
EXC = ids_of("excluded_hold_cases.tsv") | ids_of("excluded_open_cases.tsv")
if (C / "excluded_scope_cases.tsv").exists():   # 2026-10-16 フェーズ2見送り・実装しない機能として外したもの
    EXC |= ids_of("excluded_scope_cases.tsv")
if (C / "excluded_dup_cases.tsv").exists():     # 2026-10-21 ほかのケースと同じ確認として外したもの（../exclude_dup.py）
    EXC |= ids_of("excluded_dup_cases.tsv")
    RULED |= ids_of("excluded_dup_cases.tsv")
if (C / "excluded_ut_cases.tsv").exists():      # 2026-10-21 単体テストレベルとして外したもの（../exclude_ut.py）
    EXC |= ids_of("excluded_ut_cases.tsv")
    RULED |= ids_of("excluded_ut_cases.tsv")


def nlines(p):
    return sum(1 for l in p.read_text(encoding="utf-8").split("\n") if l.startswith("L"))


def check(fid):
    err = []
    u = P / "units" / fid
    a, k = P / "audit" / f"{fid}.tsv", P / "audit" / f"{fid}_keylines.tsv"
    for p in (a, k):
        if not p.exists():
            return [f"{p.relative_to(P)} が無い"]
    maxl = nlines(u / "design.txt")
    A = rows(a)
    if A[0] != HDR:
        err.append(f"{a.name}: ヘッダが違う {A[0]}")
    cover = {}
    for i, r in enumerate(A[1:], 1):
        if len(r) != len(HDR):
            err.append(f"{a.name}:{i + 1}: 列数 {len(r)}（10列）"); continue
        d = dict(zip(HDR, r))
        iid = d["項目ID"]
        if iid != f"DP-{fid}-{i:03d}":
            err.append(f"{a.name}:{i + 1}: 項目IDが連番でない {iid}（DP-{fid}-{i:03d}）")
        if d["パターン"] not in PAT:
            err.append(f"{iid}: パターン名が違う「{d['パターン']}」")
        for c in ("定め", "根拠", "試すデータ", "確かめる所"):
            if not d[c].strip():
                err.append(f"{iid}: {c}が空")
        lines = set()
        for ref in [x.strip() for x in d["根拠"].split(",") if x.strip()]:
            m = REF.match(ref)
            if not m:
                err.append(f"{iid}: 根拠の形が違う「{ref}」"); continue
            lo, hi = int(m.group(2)), int(m.group(3) or m.group(2))
            if m.group(1):
                cp = P / "units/_common" / m.group(1)
                if not cp.exists():
                    err.append(f"{iid}: 共通シートが無い {m.group(1)}")
                elif hi > nlines(cp) or lo > hi:
                    err.append(f"{iid}: 根拠の行が範囲外 {ref}")
            else:
                if hi > maxl or lo > hi or lo < 1:
                    err.append(f"{iid}: 根拠の行が design.txt に無い {ref}（最大 L{maxl:04d}）")
                lines |= set(range(lo, hi + 1))
        cover[iid] = lines
        j, tids = d["判定"], [x.strip() for x in d["テストID"].split(",") if x.strip()]
        if j not in JUD:
            err.append(f"{iid}: 判定が違う「{j}」"); continue
        if j == "ケースあり":
            if not tids:
                err.append(f"{iid}: ケースありなのにテストIDが空")
            for t in tids:
                if t in RULED or t in EXC:   # 監査の後に外れたもの（裁定の保留・対象外・作り方が未確定）
                    ruled_hits.append((iid, t))
                elif t not in ALL:
                    err.append(f"{iid}: テストIDが all_test_cases.tsv に無い {t}")
            if not d["結果"].strip():
                err.append(f"{iid}: 結果が空")
        elif j == "除外済み":
            if not tids:
                err.append(f"{iid}: 除外済みなのにテストIDが空")
            for t in tids:
                if t in ALL:
                    back_hits.append((iid, t))
                elif t not in EXC:
                    err.append(f"{iid}: テストIDが除外の一覧に無い {t}")
        elif j == "抜け":
            if not d["理由"].strip():
                err.append(f"{iid}: 抜けなのに理由が空")
            if not d["結果"].strip():
                err.append(f"{iid}: 抜けなのに結果が空")
            for t in tids:
                if t not in ALL and t not in EXC:
                    err.append(f"{iid}: テストIDが実在しない {t}")
        elif j == "対象外" and not d["理由"].strip():
            err.append(f"{iid}: 対象外なのに理由が空")
    K = rows(k)
    want = [r[0] for r in rows(u / "keylines.tsv")[1:]]
    if K[0] != KHDR:
        err.append(f"{k.name}: ヘッダが違う {K[0]}")
    got = [r[0] for r in K[1:]]
    if got != want:
        miss = [x for x in want if x not in got]
        extra = [x for x in got if x not in want]
        err.append(f"{k.name}: keylines.tsv の行と一致しない（不足 {len(miss)} {miss[:8]}・余分 {len(extra)} {extra[:8]}・順序違いを含む）")
    for r in K[1:]:
        if len(r) != 3:
            err.append(f"{k.name}: {r[0]} の列数 {len(r)}（3列）"); continue
        ln, how, val = r
        if how == "項目":
            its = [x.strip() for x in val.split(",") if x.strip()]
            if not its:
                err.append(f"{k.name}: {ln} 項目IDが空")
            for it in its:
                if it not in cover:
                    err.append(f"{k.name}: {ln} の項目IDが {a.name} に無い {it}")
                elif cover[it] and int(ln[1:]) not in cover[it]:
                    err.append(f"{k.name}: {ln} が {it} の根拠に含まれない")
        elif how == "パターンなし":
            if not val.strip():
                err.append(f"{k.name}: {ln} 理由が空")
        else:
            err.append(f"{k.name}: {ln} 扱いが違う「{how}」（項目／パターンなし）")
    return err


def main():
    fids = sys.argv[1:] or sorted(p.stem for p in (P / "audit").glob("*.tsv") if "_" not in p.stem)
    bad = 0
    for f in fids:
        e = check(f)
        if e:
            bad += 1
            print(f"× {f}（{len(e)}件）")
            for x in e[:40]:
                print("  " + x)
        elif len(fids) <= 20:
            print(f"○ {f}")
    print(f"合格 {len(fids) - bad} / {len(fids)}")
    if back_hits:
        print(f"（参考）監査が「除外済み」としたケースのうち、監査の後に一覧へ戻ったもの（作り方が決まった） {len(back_hits)}件: "
              + "、".join(f"{i}→{t}" for i, t in back_hits))
    if ruled_hits:
        print(f"（参考）監査が挙げた既存ケースのうち、監査の後に外れたもの（裁定の保留・対象外・作り方が未確定） {len(ruled_hits)}件: "
              + "、".join(f"{i}→{t}" for i, t in ruled_hits))
    sys.exit(1 if bad else 0)


main()

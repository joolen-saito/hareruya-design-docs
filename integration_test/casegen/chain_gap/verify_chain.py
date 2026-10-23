#!/usr/bin/env python3
"""ケースが無い機能またぎの画面遷移（chain_gap/）の機械検査。 verify_chain.py [群...]

形式と、群の台帳（groups.tsv）・連鎖表・機能一覧・シード・連鎖ごとの判定表との突合を見る。
期待結果の正しさと判定の妥当性は codex レビューで見る。../link_flow/verify_flow.py を元にし、方向の検査を連鎖の検査に替えた。
"""
import csv, glob, re, sys, pathlib, collections

ROOT = pathlib.Path(__file__).resolve().parents[3]
CG = ROOT / "integration_test/casegen"
P = CG / "chain_gap"
HDR = ["テストID", "遷移元機能", "遷移先機能", "要求ID", "連鎖ID", "観点ID", "優先度", "実行区分",
       "使用シード", "事前準備", "手順", "期待結果", "出典"]
SHDR = ["シードID", "区分", "論理名", "状態・属性", "用途", "投入方法", "共有"]
JHDR = ["連鎖ID", "判定", "テストID", "根拠"]
JUDGE = ("作成", "既存で確認済み", "連鎖ではない", "作れない")
VIEW = ("ITA-20", "ITA-14,ITA-20", "ITA-05,ITA-20")
BAN = re.compile(r"失敗させる|該当する操作|同上|いくつか|別の画面|要確認|TBD")
PHYS = re.compile(r"\b(?:dtb|mtb|plg)_\w+|\b[a-z]+(?:_[a-z0-9]+){1,}\b|\badmin\.[a-z_.]+|(?<![\w.])/[a-z][a-z0-9_-]*(?:/[a-z0-9_{}-]+)+")
LATER = re.compile(r"手順\d|返した値|発番した|発番された")
FID = re.compile(r"^[A-Z]\d\d-\d\d$")
NOT_IMPLEMENTED = {r["ID"] for r in csv.DictReader((CG / "scope_out.tsv").open(encoding="utf-8"), delimiter="\t") if r["種別"] == "機能"}


def read(p):
    return list(csv.DictReader(p.open(encoding="utf-8"), delimiter="\t"))


def functions():
    cat = {}
    for line in (ROOT / "functions/todo-list.md").open(encoding="utf-8"):
        c = [x.strip() for x in line.split("|")]
        if len(c) > 6 and FID.match(c[5]):
            cat[c[5]] = c[6]
    for p in glob.glob(str(CG / "cases/*_test_cases.tsv")):   # 機能一覧に無いがテスト対象の機能（F06-27 など）
        cat.setdefault(pathlib.Path(p).name[:6], "一覧外")
    return cat


def main(codes):
    groups = {r["群"]: r for r in read(P / "groups.tsv")}
    cat = functions()
    # 一覧のテストIDは機能ごとに振り直した連番なので（2026-10-23）、対応表で cases/ のテストIDを引く
    live = {r["cases/のテストID"] for r in read(CG / "all_test_cases_id_map.tsv")}
    old_seed = set()
    for p in glob.glob(str(CG / "cases/*_seed_data.tsv")):
        # 合流で写したこの作業場所のシード（S-<機能ID>-C<英字>- の形）は既存に数えない
        old_seed |= {r.get("シードID", "") for r in read(pathlib.Path(p))
                     if not re.match(r"^S-[A-Z]\d\d-\d\d-C[A-D]-", r.get("シードID", ""))}
    all_seed = collections.Counter()
    for p in glob.glob(str(P / "cases/*_seed_data.tsv")):
        for r in read(pathlib.Path(p)):
            all_seed[r.get("シードID", "")] += 1
    merged_gone = set()
    present = set()
    for p in glob.glob(str(P / "cases/*_test_cases.tsv")):
        present |= {r["テストID"] for r in read(pathlib.Path(p))}
    if (P / "merged_map.tsv").exists():
        merged_gone |= {r["旧テストID"] for r in read(P / "merged_map.tsv")} - present
    total = bad = 0
    for code in sorted(groups):
        if codes and code not in codes:
            continue
        g = groups[code]
        chains = g["連鎖ID"].split(",")
        cp, sp, jp = P / f"cases/{code}_test_cases.tsv", P / f"cases/{code}_seed_data.tsv", P / f"gen_{code}/chain_judgement.tsv"
        err = []
        if not cp.exists():
            print(f"{code}: ケース表が無い"); bad += 1; continue
        if open(cp, encoding="utf-8").readline().rstrip("\n").split("\t") != HDR:
            err.append(("形式", code, "ヘッダが13列の規定と違う"))
        C = read(cp)
        S = read(sp) if sp.exists() else []
        if not sp.exists():
            err.append(("形式", code, "シード表が無い"))
        elif S and list(S[0].keys()) != SHDR:
            err.append(("形式", code, "シード表の列が規定と違う"))
        if not (P / f"gen_{code}/report.md").exists():
            err.append(("形式", code, "report.md が無い"))
        # 連鎖ごとの判定表
        J = []
        if not jp.exists():
            err.append(("判定表", code, "chain_judgement.tsv が無い"))
        else:
            if open(jp, encoding="utf-8").readline().rstrip("\n").split("\t") != JHDR:
                err.append(("判定表", code, "ヘッダが規定と違う"))
            J = read(jp)
        jc = collections.Counter(r.get("連鎖ID", "") for r in J)
        for c in chains:
            if jc[c] != 1:
                err.append(("判定表", c, f"判定の行が{jc[c]}行（1行であるべき）"))
        for c in jc:
            if c not in chains:
                err.append(("判定表", c, "群の連鎖でない"))
        made = {}
        for r in J:
            if r.get("判定") not in JUDGE:
                err.append(("判定表", r.get("連鎖ID"), f"判定が不正: {r.get('判定')!r}"))
                continue
            ids = [t.strip() for t in re.split(r"[,、]", r.get("テストID") or "") if t.strip() and t.strip() != "—"]
            if not (r.get("根拠") or "").strip():
                err.append(("判定表", r["連鎖ID"], "根拠が空"))
            if r["判定"] == "作成":
                if not ids:
                    err.append(("判定表", r["連鎖ID"], "作成なのにテストIDが無い"))
                for t in ids:
                    made[t] = r["連鎖ID"]
            elif r["判定"] == "既存で確認済み":
                if not ids:
                    err.append(("判定表", r["連鎖ID"], "既存で確認済みなのにテストIDが無い"))
                for t in ids:
                    if t not in live:
                        err.append(("判定表", r["連鎖ID"], f"既存ケースに無い: {t}"))
            elif ids:
                err.append(("判定表", r["連鎖ID"], f"{r['判定']}なのにテストIDがある"))
        sid = {r["シードID"]: r for r in S}
        use = collections.defaultdict(list)
        seq = collections.Counter()
        for x in C:
            t = x["テストID"]
            if None in x or any(v is None for v in x.values()):
                err.append(("形式", t, "列数が合わない")); continue
            m = re.match(rf"^IT-([A-Z]\d\d-\d\d)-{code}(\d{{3}})$", t)
            if not m:
                err.append(("ID", t, f"IT-<機能ID>-{code}<3桁> の形でない")); continue
            fid, n = m.group(1), int(m.group(2))
            seq[fid] += 1
            while n > seq[fid] and f"IT-{fid}-{code}{seq[fid]:03d}" in merged_gone:
                seq[fid] += 1
            if n != seq[fid]:
                err.append(("ID", t, f"{fid} の連番は {seq[fid]:03d} であるべき"))
            src, dst = x["遷移元機能"].strip(), x["遷移先機能"].strip()
            for k, v in (("遷移元機能", src), ("遷移先機能", dst)):
                if v not in cat:
                    err.append((k, t, f"機能一覧に無い: {v!r}"))
                elif v in NOT_IMPLEMENTED:
                    err.append((k, t, f"実装しない機能: {v}"))
            if src == dst:
                err.append(("範囲", t, "遷移元と遷移先が同じ機能"))
            want = dst if cat.get(src) == "標準" else src
            if fid != want:
                err.append(("ID", t, f"テストIDの機能は {want} であるべき（遷移元 {src} の区分 {cat.get(src)}）"))
            if cat.get(want) == "標準":
                err.append(("範囲", t, f"ケースを置く機能 {want} が標準機能"))
            if x["連鎖ID"] not in chains:
                err.append(("連鎖ID", t, f"群の連鎖でない: {x['連鎖ID']!r}"))
            elif made.get(t) != x["連鎖ID"]:
                err.append(("判定表", t, f"判定表の「作成」の行にこのテストIDが無い（連鎖 {x['連鎖ID']}）"))
            if x["観点ID"] not in VIEW:
                err.append(("観点ID", t, f"{VIEW} のいずれかであるべき: {x['観点ID']!r}"))
            if x["優先度"] not in ("P1", "P2"):
                err.append(("優先度", t, x["優先度"]))
            if x["実行区分"] not in ("ブラウザのみ", "ブラウザ+DB確認"):
                err.append(("実行区分", t, x["実行区分"]))
            for col in ("事前準備", "手順", "期待結果", "出典", "使用シード"):
                if not x[col].strip() or x[col].strip() == "—":
                    err.append(("空欄", t, col))
            if not x["期待結果"].rstrip("。").endswith("こと"):
                err.append(("期待結果", t, "「〜こと」で終わっていない"))
            if "画面" not in x["期待結果"] and "ページ" not in x["期待結果"]:
                err.append(("期待結果", t, "遷移先の画面を書いていない"))
            body = " ".join(x[c] for c in ("事前準備", "手順", "期待結果"))
            mm = BAN.search(body)
            if mm:
                err.append(("禁止語", t, mm.group(0)))
            for mm in PHYS.finditer(body):
                err.append(("物理名", t, mm.group(0)))
            if LATER.search(x["事前準備"]):
                err.append(("事前準備", t, "手順の結果を参照している"))
            for s in [s.strip() for s in re.split(r"[,、]", x["使用シード"]) if s.strip()]:
                use[s].append(t)
                if s not in sid:
                    err.append(("シード", t, f"未定義: {s}"))
                elif s not in x["事前準備"]:
                    err.append(("シード", t, f"事前準備にシードIDが無い: {s}"))
        present_ids = {x["テストID"] for x in C}
        for t, c in made.items():
            if t not in present_ids and t not in merged_gone:
                err.append(("判定表", c, f"作成としたテストIDがケース表に無い: {t}"))
        for s, r in sid.items():
            if not re.match(rf"^S-[A-Z]\d\d-\d\d-{code}-", s):
                err.append(("シード", s, f"S-<機能ID>-{code}- で始まっていない"))
            if s in old_seed or all_seed[s] > 1:
                err.append(("シード", s, "他のシードとIDが重なる"))
            k = (r.get("共有") or "").strip()
            if k not in ("共有可", "ケース専用"):
                err.append(("シード", s, f"共有 列が不正: {k!r}"))
            if not use.get(s):
                err.append(("シード", s, "どのケースも使わない"))
            elif k == "ケース専用":
                if len(use[s]) != 1:
                    err.append(("シード", s, f"ケース専用を{len(use[s])}件が使う"))
                elif not s.endswith("-" + use[s][0][-3:]):
                    err.append(("シード", s, "ケース専用のIDの末尾がケース番号でない"))
            if not (r.get("投入方法") or "").strip() or "同上" in "".join(v or "" for v in r.values()):
                err.append(("シード", s, "投入方法が空、または「同上」"))
        total += len(C); bad += bool(err)
        jn = collections.Counter(r.get("判定") for r in J)
        print(f"{code}: {len(C)}件 判定 {dict(jn)} " + ("合格" if not err else f"不合格 {len(err)}"))
        for e in err[:40]:
            print("   ", *e)
    print(f"計 {total}件 / 不合格の群 {bad}")
    return bad


if __name__ == "__main__":
    sys.exit(1 if main(sys.argv[1:]) else 0)

#!/usr/bin/env python3
"""抜けを埋めるケース（gapfill/cases・13列）の機械検査。 verify_gapfill.py [機能ID...]

形式と、観点表・シード・抜けの一覧との突合を見る。期待結果の正しさは codex レビューで見る。
"""
import csv, glob, re, sys, pathlib, collections

G = pathlib.Path(__file__).resolve().parent
CG = G.parent
ROOT = CG.parents[1]
csv.field_size_limit(10**9)
HDR = ["テストID", "判定ID", "要求ID", "連鎖ID", "観点ID", "優先度", "実行区分", "使用シード",
       "事前準備", "手順", "期待結果", "出典", "指摘ID"]
SHDR = ["シードID", "区分", "論理名", "状態・属性", "用途", "投入方法", "共有"]
DHDR = ["指摘ID", "扱い", "テストID", "理由"]
BAN = re.compile(r"失敗させる|該当する操作|同上|いくつか|別の画面|要確認|TBD|設計どおり|設計書どおり|仕様どおり|正しいこと|正しく")
PHYS = re.compile(r"\b(?:dtb|mtb|plg)_\w+|\b[a-z]+(?:_[a-z0-9]+){1,}\b|\badmin\.[a-z_.]+")
LATER = re.compile(r"手順\d|返した値|発番した|発番された")


def read(p):
    return list(csv.DictReader(p.open(encoding="utf-8"), delimiter="\t", quoting=csv.QUOTE_NONE))


def main(fids):
    T = {r["機能ID"]: r for r in read(G / "targets.tsv")}
    vp = {r["判定ID"]: r["観点ID"] for r in read(ROOT / "integration_test/viewpoint_canonical/viewpoints_canonical.tsv")}
    reqs = {l.split("\t", 1)[0] for l in open(CG / "requirements_all.tsv", encoding="utf-8")}
    books = {pathlib.Path(p).name[:4] for p in glob.glob(str(ROOT / "excel_to_html/output/0*.html"))}
    gfmap = {r["テストID"] for r in read(G / "gf_map.tsv")} if (G / "gf_map.tsv").exists() else set()
    other_seed = collections.defaultdict(set)     # 既存のシード（今回足した分を除く）
    gfseed = {r["シードID"] for p in glob.glob(str(G / "cases/*_gf_seed_data.tsv")) for r in read(pathlib.Path(p))}
    for p in glob.glob(str(CG / "cases/*_seed_data.tsv")):
        f = pathlib.Path(p).name.split("_")[0]
        for r in read(pathlib.Path(p)):
            if r.get("シードID") not in gfseed:
                other_seed[f].add((r.get("シードID", ""), (r.get("共有") or "").strip()))
    all_old = {s for v in other_seed.values() for s, _ in v}
    total = bad = 0
    for fid in (fids or sorted(T)):
        err = []
        p = G / f"cases/{fid}_gf_test_cases.tsv"
        sp, dp = G / f"cases/{fid}_gf_seed_data.tsv", G / f"cases/{fid}_gf_dispositions.tsv"
        if not (p.exists() and sp.exists() and dp.exists()):
            print(f"{fid}: ファイルが揃っていない（test_cases / seed_data / dispositions）"); bad += 1; continue
        if p.open(encoding="utf-8").readline().rstrip("\n").split("\t") != HDR:
            err.append(("形式", fid, "ケースのヘッダが13列の規定と違う"))
        if sp.open(encoding="utf-8").readline().rstrip("\n").split("\t") != SHDR:
            err.append(("形式", fid, "シード表のヘッダが規定と違う"))
        if dp.open(encoding="utf-8").readline().rstrip("\n").split("\t") != DHDR:
            err.append(("形式", fid, "dispositions のヘッダが規定と違う"))
        if err:
            print(f"{fid}: 不合格"); [print("   ", *e) for e in err]; bad += 1; continue
        C, S, D = read(p), read(sp), read(dp)
        gaps = {r["指摘ID"] for r in read(G / f"targets/{fid}_gaps.tsv")}
        text = "".join((CG / f"coverage_audit/units/{u}/sheet.txt").read_text(encoding="utf-8") for u in T[fid]["単位"].split(","))
        text += (CG / f"cases/{fid}_test_cases.tsv").read_text(encoding="utf-8")
        start = int(T[fid]["開始番号"])
        sid = {r["シードID"]: r for r in S}
        shared_old = {s for s, k in other_seed[fid] if k == "共有可"}
        use = collections.defaultdict(list)
        ids = set()
        for i, x in enumerate(C):
            t = x["テストID"]
            if None in x or any(v is None for v in x.values()):
                err.append(("形式", t, "列数が合わない")); continue
            ids.add(t)
            if t != f"IT-{fid}-{start + i:03d}":
                err.append(("ID", t, f"IT-{fid}-{start + i:03d} であるべき（既存の続き番号）"))
            if x["判定ID"] not in vp:
                err.append(("判定ID", t, f"観点表に無い: {x['判定ID']}"))
            elif vp[x["判定ID"]] != x["観点ID"]:
                err.append(("観点ID", t, f"{x['判定ID']} の観点IDは {vp[x['判定ID']]}"))
            if "IT-0341" <= x["判定ID"] <= "IT-0347":
                err.append(("判定ID", t, f"{x['判定ID']} は使わない（アクセス解析の専用）"))
            if x["連鎖ID"].strip():
                err.append(("形式", t, "連鎖IDは空欄にする"))
            for q in [q.strip() for q in x["要求ID"].split(",") if q.strip()]:
                if q not in reqs:
                    err.append(("要求ID", t, f"requirements_all.tsv に無い要求ID: {q}"))
            if x["優先度"] not in ("P1", "P2", "P3"):
                err.append(("優先度", t, x["優先度"]))
            if x["実行区分"] not in ("ブラウザのみ", "ブラウザ+DB確認"):
                err.append(("実行区分", t, x["実行区分"]))
            for col in ("事前準備", "手順", "期待結果", "出典", "使用シード", "指摘ID"):
                if not x[col].strip() or x[col].strip() == "—":
                    err.append(("空欄", t, col))
            if '"' in "".join(x.values()):
                err.append(("形式", t, "ダブルクォートを含む"))
            if not x["期待結果"].rstrip("。").endswith("こと"):
                err.append(("期待結果", t, "「〜こと」で終わっていない"))
            for part in [q.strip() for q in x["出典"].split("｜") if q.strip()]:
                if " / " not in part or part[:4] not in books:
                    err.append(("出典", t, f"「<書番> <シート名> / <見出し>」の形でない: {part[:40]}"))
            for g in [g.strip() for g in re.split(r"[,、]", x["指摘ID"]) if g.strip()]:
                if g not in gaps:
                    err.append(("指摘ID", t, f"この機能の抜けの一覧に無い: {g}"))
            body = " ".join(x[c] for c in ("事前準備", "手順", "期待結果"))
            m = BAN.search(body)
            if m:
                err.append(("禁止語", t, m.group(0)))
            for m in PHYS.finditer(re.sub(r"`[^`]*`", " ", re.sub(r"[\w.\-]+@[\w.\-]+|[\w\-]+\.(?:csv|tsv|txt|pdf|png|jpg|json|zip|xml|html)", " ", body))):
                if m.group(0) not in text:
                    err.append(("物理名", t, m.group(0)))
            if LATER.search(x["事前準備"]):
                err.append(("事前準備", t, "手順の結果を参照している"))
            own = 0
            for s in [s.strip() for s in re.split(r"[,、]", x["使用シード"]) if s.strip()]:
                use[s].append(t)
                if s in sid:
                    own += sid[s].get("共有") == "ケース専用"
                elif s not in shared_old:
                    err.append(("シード", t, f"今回のシード表にも既存の共有可シードにも無い: {s}"))
                if s not in x["事前準備"]:
                    err.append(("シード", t, f"事前準備にシードIDが無い: {s}"))
            if not own:
                err.append(("シード", t, "今回足したケース専用シードを1件も使っていない"))
        if len(C) != len({(x["事前準備"], x["手順"], x["期待結果"]) for x in C}):
            err.append(("重複", fid, "事前準備・手順・期待結果が同じケースがある"))
        for s, r in sid.items():
            if not s.startswith(f"S-{fid}-"):
                err.append(("シード", s, f"S-{fid}- で始まっていない"))
            if s in all_old:
                err.append(("シード", s, "既存のシードとIDが重なる"))
            k = (r.get("共有") or "").strip()
            if k not in ("共有可", "ケース専用"):
                err.append(("シード", s, f"共有 列が不正: {k!r}"))
            if not use.get(s):
                err.append(("シード", s, "どのケースも使わない"))
            elif k == "ケース専用":
                if len(use[s]) != 1:
                    err.append(("シード", s, f"ケース専用を{len(use[s])}件が使う"))
                elif not s.endswith("-" + use[s][0].rsplit("-", 1)[-1]):
                    err.append(("シード", s, "ケース専用のIDの末尾がケース番号でない"))
            if not (r.get("投入方法") or "").strip() or "同上" in "".join(v or "" for v in r.values()):
                err.append(("シード", s, "投入方法が空、または「同上」"))
        seen = collections.Counter(r["指摘ID"] for r in D)
        live = {l.split("\t", 1)[0] for l in open(CG / f"cases/{fid}_test_cases.tsv", encoding="utf-8")} - gfmap
        cased = {g.strip() for x in C for g in re.split(r"[,、]", x["指摘ID"])}
        for g in gaps:
            if seen[g] != 1:
                err.append(("仕分け", g, f"dispositions に{seen[g]}行（1行であること）"))
        for r in D:
            g, how = r["指摘ID"], r["扱い"]
            tids = [t.strip() for t in re.split(r"[,、]", r["テストID"] or "") if t.strip()]
            if g not in gaps:
                err.append(("仕分け", g, "この機能の抜けの一覧に無い"))
            if how == "ケース化":
                if not tids or any(t not in ids for t in tids):
                    err.append(("仕分け", g, "ケース化なのに、今回のケースのテストIDが無い・存在しない"))
                if g not in cased:
                    err.append(("仕分け", g, "ケース化なのに、どのケースの指摘ID列にも無い"))
            elif how == "既存ケースで確認済み":
                if not tids or any(t not in live for t in tids) or not (r["理由"] or "").strip():
                    err.append(("仕分け", g, "確認済みなのに、既存のテストIDまたは理由が無い"))
            elif how == "ケースにしない":
                if not (r["理由"] or "").strip():
                    err.append(("仕分け", g, "ケースにしない理由が無い"))
            else:
                err.append(("仕分け", g, f"扱いが不正: {how!r}"))
        total += len(C); bad += bool(err)
        print(f"{fid}: {len(C)}件 " + ("合格" if not err else f"不合格 {len(err)}"))
        for e in err[:40]:
            print("   ", *e)
    print(f"計 {total}件 / 不合格ファイル {bad}")
    return bad


if __name__ == "__main__":
    sys.exit(1 if main(sys.argv[1:]) else 0)

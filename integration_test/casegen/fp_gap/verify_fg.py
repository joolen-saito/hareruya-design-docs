#!/usr/bin/env python3
"""FPから見て足したケース（fp_gap/cases・13列）の機械検査。 verify_fg.py [機能ID...]

../combination/verify_cb.py を 2026-10-23 に写した。違いは、要因の組の代わりに、著者が書いた観点の項目（cases/<機能ID>_fg_items.tsv）と突き合わせること。
- 項目は 項目ID（FG-<機能ID>-3桁）・判定ID・根拠の行（units/<機能ID>/design.txt の L番号。他の機能は <機能ID>:L番号）・確かめること。根拠の行が写しに実在すること。
- 項目1つにケースは何件でもよい（1件以上）。判定IDは観点表の行（アクセス解析専用の IT-0341〜0347 を除く）で、ケースの判定IDは項目の判定IDと同じ。
- 番号は開始番号から増えていく（上限なし）。シードIDは S-<機能ID>-FG で始める。
期待結果の正しさは codex レビューで見る。
"""
import csv, glob, re, sys, pathlib, collections

G = pathlib.Path(__file__).resolve().parent
CG = G.parent
ROOT = CG.parents[1]
csv.field_size_limit(10**9)
HDR = ["テストID", "判定ID", "要求ID", "連鎖ID", "観点ID", "優先度", "実行区分", "使用シード",
       "事前準備", "手順", "期待結果", "出典", "項目ID"]
IHDR = ["項目ID", "判定ID", "根拠の行", "確かめること"]
SHDR = ["シードID", "区分", "論理名", "状態・属性", "用途", "投入方法", "共有"]
DHDR = ["項目ID", "扱い", "テストID", "理由"]
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
    gfmap = {r["テストID"] for r in read(G / "fg_map.tsv")} if (G / "fg_map.tsv").exists() else set()
    other_seed = collections.defaultdict(set)     # 既存のシード（今回足した分を除く）
    gfseed = {r["シードID"] for p in glob.glob(str(G / "cases/*_fg_seed_data.tsv")) for r in read(pathlib.Path(p))}
    for p in glob.glob(str(CG / "cases/*_seed_data.tsv")):
        f = pathlib.Path(p).name.split("_")[0]
        for r in read(pathlib.Path(p)):
            if r.get("シードID") not in gfseed:
                other_seed[f].add((r.get("シードID", ""), (r.get("共有") or "").strip()))
    # 作り方が未確定で外したケース・シード（../exclude_open.py）も、既存のものとして数える
    exo_ids = set()
    if (CG / "excluded_open_seeds.tsv").exists():
        for r in read(CG / "excluded_open_seeds.tsv"):
            if r["シードID"] not in gfseed:
                other_seed[r["機能ID"]].add((r["シードID"], (r.get("共有") or "").strip()))
    if (CG / "excluded_open_cases.tsv").exists():
        exo_ids = {r["テストID"] for r in read(CG / "excluded_open_cases.tsv")}
    all_old = {s for v in other_seed.values() for s, _ in v}
    # 一覧のテストIDは機能ごとに振り直した連番なので（2026-10-23）、対応表で cases/ のテストIDを引く
    all_live = {r["cases/のテストID"] for r in read(CG / "all_test_cases_id_map.tsv")} - gfmap
    warn_total = 0
    total = bad = 0
    for arg in (fids or sorted(T)):
        err = []
        fid = arg
        p = G / f"cases/{fid}_fg_test_cases.tsv"
        sp, dp, ip = G / f"cases/{fid}_fg_seed_data.tsv", G / f"cases/{fid}_fg_dispositions.tsv", G / f"cases/{fid}_fg_items.tsv"
        if not (p.exists() and sp.exists() and dp.exists() and ip.exists()):
            print(f"{arg}: ファイルが揃っていない（items / test_cases / seed_data / dispositions）"); bad += 1; continue
        if ip.open(encoding="utf-8").readline().rstrip("\n").split("\t") != IHDR:
            err.append(("形式", fid, "items のヘッダが規定と違う"))
        if p.open(encoding="utf-8").readline().rstrip("\n").split("\t") != HDR:
            err.append(("形式", fid, "ケースのヘッダが13列の規定と違う"))
        if sp.open(encoding="utf-8").readline().rstrip("\n").split("\t") != SHDR:
            err.append(("形式", fid, "シード表のヘッダが規定と違う"))
        if dp.open(encoding="utf-8").readline().rstrip("\n").split("\t") != DHDR:
            err.append(("形式", fid, "dispositions のヘッダが規定と違う"))
        if err:
            print(f"{arg}: 不合格"); [print("   ", *e) for e in err]; bad += 1; continue
        C, S, D, I = read(p), read(sp), read(dp), read(ip)
        gaps = {r["項目ID"]: r for r in I}
        if len(gaps) != len(I):
            err.append(("項目", fid, "項目IDが重複している"))
        design = {fid: (G / f"units/{fid}/design.txt").read_text(encoding="utf-8")}
        for g, r in gaps.items():
            if not re.fullmatch(rf"FG-{fid}-\d{{3}}", g):
                err.append(("項目", g, f"FG-{fid}-3桁 の形でない"))
            if r["判定ID"] not in vp or "IT-0341" <= r["判定ID"] <= "IT-0347":
                err.append(("項目", g, f"判定IDが観点表に無いか、使えない: {r['判定ID']}"))
            if not (r["確かめること"] or "").strip():
                err.append(("項目", g, "確かめることが空"))
            refs = re.findall(r"(?:([A-Z]\d\d-\d\d):)?L(\d{4})", r["根拠の行"] or "")
            if not refs:
                err.append(("項目", g, "根拠の行（L番号）が無い"))
            for of, n in refs:
                of = of or fid
                if of not in design:
                    up = G / f"units/{of}/design.txt"
                    up = up if up.exists() else CG / f"combination/units/{of}/design.txt"
                    design[of] = up.read_text(encoding="utf-8") if up.exists() else ""
                if f"\nL{n}\t" not in "\n" + design[of]:
                    err.append(("項目", g, f"根拠の行が写しに無い: {of}:L{n}"))
        cp = CG / f"cases/{fid}_test_cases.tsv"
        text = "".join(design.values()) + (cp.read_text(encoding="utf-8") if cp.exists() else "")
        start = int(T[fid]["開始番号"])
        sid = {r["シードID"]: r for r in S}
        shared_old = {s for s, k in other_seed[fid] if k == "共有可"}
        use = collections.defaultdict(list)
        ids = set()
        warns = []
        for i, x in enumerate(C):
            t = x["テストID"]
            if None in x or any(v is None for v in x.values()):
                err.append(("形式", t, "列数が合わない")); continue
            ids.add(t)
            # 番号は開始番号から組の数の範囲で増えていく（ケースにしないへ変えた組の番号は欠番のまま残してよい）
            num = int(t.rsplit("-", 1)[-1]) if re.fullmatch(rf"IT-{fid}-\d{{3}}", t) else -1
            if not (start <= num <= 999) or (i and num <= prev_num):
                err.append(("ID", t, f"IT-{fid}-{start:03d} から増えていく番号であるべき"))
            prev_num = num
            if x["項目ID"].strip() in gaps and x["判定ID"] != gaps[x["項目ID"].strip()]["判定ID"]:
                err.append(("判定ID", t, "項目の判定IDと違う"))
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
            for col in ("事前準備", "手順", "期待結果", "出典", "使用シード", "項目ID"):
                if not x[col].strip() or x[col].strip() == "—":
                    err.append(("空欄", t, col))
            if '"' in "".join(x.values()):
                err.append(("形式", t, "ダブルクォートを含む"))
            if not x["期待結果"].rstrip("。").endswith("こと"):
                err.append(("期待結果", t, "「〜こと」で終わっていない"))
            for part in [q.strip() for q in x["出典"].split("｜") if q.strip()]:
                if " / " not in part or part[:4] not in books:
                    err.append(("出典", t, f"「<書番> <シート名> / <見出し>」の形でない: {part[:40]}"))
            gs = [g.strip() for g in re.split(r"[,、]", x["項目ID"]) if g.strip()]
            if len(gs) != 1:
                err.append(("項目ID", t, "項目IDを1つだけ書く"))
            for g in gs:
                if g not in gaps:
                    err.append(("項目ID", t, f"items に無い項目: {g}"))
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
            if not s.startswith(f"S-{fid}-FG"):
                err.append(("シード", s, f"S-{fid}-FG で始まっていない"))
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
        seen = collections.Counter(r["項目ID"] for r in D)
        live = all_live
        cased = collections.Counter(g.strip() for x in C for g in re.split(r"[,、]", x["項目ID"]) if g.strip())
        for g in gaps:
            if seen[g] != 1:
                err.append(("仕分け", g, f"dispositions に{seen[g]}行（1行であること）"))
        for r in D:
            g, how = r["項目ID"], r["扱い"]
            tids = [t.strip() for t in re.split(r"[,、]", r["テストID"] or "") if t.strip()]
            if g not in gaps:
                err.append(("仕分け", g, "items に無い項目"))
            if how == "ケース化":
                if not tids or any(t not in ids for t in tids):
                    err.append(("仕分け", g, "ケース化なのに、今回のケースのテストIDが無い・存在しない"))
                if g not in cased:
                    err.append(("仕分け", g, "ケース化なのに、どのケースの項目ID列にも無い"))
            elif how == "既存ケースで確認済み":
                if not tids or any(t not in live for t in tids) or not (r["理由"] or "").strip():
                    err.append(("仕分け", g, "確認済みなのに、既存のテストIDまたは理由が無い"))
            elif how == "ケースにしない":
                if not (r["理由"] or "").strip():
                    err.append(("仕分け", g, "ケースにしない理由が無い"))
            else:
                err.append(("仕分け", g, f"扱いが不正: {how!r}"))
        total += len(C); bad += bool(err); warn_total += len(warns)
        print(f"{arg}: {len(C)}件 " + ("合格" if not err else f"不合格 {len(err)}") + (f"（注意 {len(warns)}）" if warns else ""))
        for e in err[:40]:
            print("   ", *e)
        for w in warns[:40]:
            print("    注意", *w)
    print(f"計 {total}件 / 不合格ファイル {bad}")
    return bad


if __name__ == "__main__":
    sys.exit(1 if main(sys.argv[1:]) else 0)

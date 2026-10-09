#!/usr/bin/env python3
"""ケースが無かったExcel無し冊子の機能のケース（nosheet/cases・12列）の機械検査。 verify_nosheet.py [機能ID...]

sheetmap/verify_sheetmap.py と同じ検査。違いは、要求表に行が無い機能（F09）は要求ID列を空欄にしてよいことと、
出典のシート名を「<書番> <機能ID> <機能名>」の形で受けること。

形式と、観点表・要求表・シート名・シードとの突合を見る。期待結果の正しさは codex レビューで見る。
"""
import csv, glob, re, sys, pathlib, collections

ROOT = pathlib.Path(__file__).resolve().parents[3]
CG = ROOT / "integration_test/casegen"
G = CG / "nosheet"
csv.field_size_limit(10**9)
HDR = ["テストID", "判定ID", "要求ID", "連鎖ID", "観点ID", "優先度", "実行区分", "使用シード",
       "事前準備", "手順", "期待結果", "出典"]
SHDR = ["シードID", "区分", "論理名", "状態・属性", "用途", "投入方法", "共有"]
# シートに別機能の機能設計書が埋め込まれている機能。現行仕様は機能設計書を直接読み、出典は「<機能ID> 機能設計書 / <小見出し>」と書く
DOCS = {}
BAN = re.compile(r"失敗させる|該当する操作|同上|いくつか|別の画面|要確認|TBD|設計どおり|設計書どおり|仕様どおり|正しいこと|正しく")
PHYS = re.compile(r"\b(?:dtb|mtb|plg)_\w+|\b[a-z]+(?:_[a-z0-9]+){1,}\b|\badmin\.[a-z_.]+")
LATER = re.compile(r"手順\d|返した値|発番した|発番された")


def read(p):
    return list(csv.DictReader(p.open(encoding="utf-8"), delimiter="\t"))


def main(fids):
    T = collections.defaultdict(list)
    for r in read(G / "targets.tsv"):
        if r["扱い"] == "ケース作成":
            T[r["機能ID"]].append(f"{r['書番']} {r['シート名']}")
    vp = {r["判定ID"]: r["観点ID"] for r in read(ROOT / "integration_test/viewpoint_canonical/viewpoints_canonical.tsv")}
    RA = read(CG / "requirements_all.tsv")
    sheets = {f"{r['書番']} {r['シート名'].split(' ／ ')[0]}" for r in RA} | {s for v_ in T.values() for s in v_}
    bookreq = collections.defaultdict(set)      # 同じ冊子の別シートを根拠にしたケースは、そのシートの要求IDを書いてよい
    for r in RA:
        bookreq[r["書番"]].add(r["要求ID"])
    old_seed = set()
    for p in glob.glob(str(CG / "cases/*_seed_data.tsv")):
        if pathlib.Path(p).name.split("_")[0] in T:
            continue
        old_seed |= {r.get("シードID", "") for r in read(pathlib.Path(p))}
    total = bad = 0
    for fid in (fids or sorted(T)):
        p = G / f"cases/{fid}_ns_test_cases.tsv"
        if not p.exists():
            print(f"{fid}: ケースが無い"); bad += 1; continue
        err = []
        own_req = {r["要求ID"] for r in read(G / f"materials/{fid}_requirements.tsv")}
        okreq = own_req | bookreq[T[fid][0].split(" ")[0]]
        text = (G / f"materials/{fid}_sheet.txt").read_text(encoding="utf-8")
        if p.open(encoding="utf-8").readline().rstrip("\n").split("\t") != HDR:
            err.append(("形式", fid, "ヘッダが12列の規定と違う"))
        C = read(p)
        sp = G / f"cases/{fid}_ns_seed_data.tsv"
        S = read(sp) if sp.exists() else []
        if not sp.exists():
            err.append(("形式", fid, "シード表が無い"))
        elif S and list(S[0].keys()) != SHDR:
            err.append(("形式", fid, "シード表の列が規定と違う"))
        if not (G / f"gen_{fid}/report.md").exists():
            err.append(("形式", fid, "report.md が無い"))
        sid = {r["シードID"]: r for r in S}
        use = collections.defaultdict(list)
        for i, x in enumerate(C, 1):
            t = x["テストID"]
            if None in x or any(v is None for v in x.values()):
                err.append(("形式", t, "列数が合わない")); continue
            if t != f"IT-{fid}-{i:03d}":
                err.append(("ID", t, f"IT-{fid}-{i:03d} であるべき"))
            if x["判定ID"] not in vp:
                err.append(("判定ID", t, f"観点表に無い: {x['判定ID']}"))
            elif vp[x["判定ID"]] != x["観点ID"]:
                err.append(("観点ID", t, f"{x['判定ID']} の観点IDは {vp[x['判定ID']]}"))
            if "IT-0332" <= x["判定ID"] <= "IT-0347":
                err.append(("判定ID", t, f"{x['判定ID']} は使わない（機能間データ連携・アクセス解析の専用）。当てはまる別の判定単位か IT-0156 にする"))
            if x["連鎖ID"].strip():
                err.append(("形式", t, "連鎖IDは空欄にする"))
            for q in [q.strip() for q in x["要求ID"].split(",") if q.strip()]:
                if q not in okreq:
                    err.append(("要求ID", t, f"materials にも同じ冊子の要求表にも無い要求ID: {q}"))
            if not x["要求ID"].strip() and own_req:
                err.append(("要求ID", t, "空欄"))
            if x["優先度"] not in ("P1", "P2", "P3"):
                err.append(("優先度", t, x["優先度"]))
            if x["実行区分"] not in ("ブラウザのみ", "ブラウザ+DB確認"):
                err.append(("実行区分", t, x["実行区分"]))
            for col in ("事前準備", "手順", "期待結果", "出典", "使用シード"):
                if not x[col].strip() or x[col].strip() == "—":
                    err.append(("空欄", t, col))
            if not x["期待結果"].rstrip("。").endswith("こと"):
                err.append(("期待結果", t, "「〜こと」で終わっていない"))
            own = 0
            heads = set(re.findall(r"^#{2,4}\s+(.+?)\s*$", (ROOT / DOCS[fid]).read_text(encoding="utf-8"), re.M)) if fid in DOCS else set()
            for part in [p_.strip() for p_ in x["出典"].split("｜") if p_.strip()]:
                if fid in DOCS and part.startswith(f"{fid} 機能設計書 / "):
                    own += 1
                    for h in re.split(r"[、,]", part.split(" / ", 1)[1]):
                        if h.strip() not in heads:
                            err.append(("出典", t, f"機能設計書に無い小見出し: {h.strip()}"))
                    continue
                sh = part.split(" / ")[0]
                if " / " not in part or sh not in sheets:
                    err.append(("出典", t, f"「<書番> <シート名> / <見出し>」の形でない、またはシートが無い: {part[:40]}"))
                own += sh in T[fid]
            if not own:
                err.append(("出典", t, "自機能のシートが出典に無い"))
            body = " ".join(x[c] for c in ("事前準備", "手順", "期待結果"))
            m = BAN.search(body)
            if m:
                err.append(("禁止語", t, m.group(0)))
            for m in PHYS.finditer(re.sub(r"`[^`]*`", " ", re.sub(r"[\w.\-]+@[\w.\-]+", " ", body))):
                if m.group(0) not in text:
                    err.append(("物理名", t, m.group(0)))
            if LATER.search(x["事前準備"]):
                err.append(("事前準備", t, "手順の結果を参照している"))
            for s in [s.strip() for s in re.split(r"[,、]", x["使用シード"]) if s.strip()]:
                use[s].append(t)
                if s not in sid:
                    err.append(("シード", t, f"未定義: {s}"))
                elif s not in x["事前準備"]:
                    err.append(("シード", t, f"事前準備にシードIDが無い: {s}"))
        if len(C) != len({(x["事前準備"], x["手順"], x["期待結果"]) for x in C}):
            err.append(("重複", fid, "事前準備・手順・期待結果が同じケースがある"))
        num = lambda t: t.rsplit("-", 1)[-1]
        for s, r in sid.items():
            if not s.startswith(f"S-{fid}-"):
                err.append(("シード", s, f"S-{fid}- で始まっていない"))
            if s in old_seed:
                err.append(("シード", s, "他機能のシードとIDが重なる"))
            k = (r.get("共有") or "").strip()
            if k not in ("共有可", "ケース専用"):
                err.append(("シード", s, f"共有 列が不正: {k!r}"))
            if not use.get(s):
                err.append(("シード", s, "どのケースも使わない"))
            elif k == "ケース専用":
                if len(use[s]) != 1:
                    err.append(("シード", s, f"ケース専用を{len(use[s])}件が使う"))
                elif not s.endswith("-" + num(use[s][0])):
                    err.append(("シード", s, "ケース専用のIDの末尾がケース番号でない"))
            if not (r.get("投入方法") or "").strip() or "同上" in "".join(v or "" for v in r.values()):
                err.append(("シード", s, "投入方法が空、または「同上」"))
        for x in C:
            if not any((sid.get(s.strip()) or {}).get("共有") == "ケース専用" for s in re.split(r"[,、]", x["使用シード"])):
                err.append(("シード", x["テストID"], "ケース専用シードを1件も使っていない"))
        total += len(C); bad += bool(err)
        print(f"{fid}: {len(C)}件 " + ("合格" if not err else f"不合格 {len(err)}"))
        for e in err[:40]:
            print("   ", *e)
    print(f"計 {total}件 / 不合格ファイル {bad}")
    return bad


if __name__ == "__main__":
    sys.exit(1 if main(sys.argv[1:]) else 0)

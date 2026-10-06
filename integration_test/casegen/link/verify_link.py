#!/usr/bin/env python3
"""機能間データ連携ケースの機械検査。 verify_link.py [機能ID...]

形式と、台帳・観点表・シードとの突合を見る。被覆と期待結果の正しさは codex レビューで見る。
"""
import csv, glob, re, sys, pathlib, collections

ROOT = pathlib.Path(__file__).resolve().parents[3]
CG = ROOT / "integration_test/casegen"
L = CG / "link"
HDR = ["テストID", "判定ID", "要求ID", "連鎖ID", "観点ID", "優先度", "実行区分", "使用シード",
       "事前準備", "手順", "期待結果", "出典"]
SHDR = ["シードID", "区分", "論理名", "状態・属性", "用途", "投入方法", "共有"]
BAN = re.compile(r"失敗させる|該当する操作|同上|いくつか|別の画面|要確認|TBD")
# 物理名: テーブル・カラム・ルート・翻訳キーらしい綴り
PHYS = re.compile(r"\b(?:dtb|mtb|plg)_\w+|\b[a-z]+(?:_[a-z0-9]+){1,}\b|\badmin\.[a-z_.]+")
LATER = re.compile(r"手順\d|返した値|発番した|発番された")


def read(p):
    return list(csv.DictReader(p.open(encoding="utf-8"), delimiter="\t"))


def main(fids):
    vp = {r["判定ID"]: r["観点ID"] for r in read(ROOT / "integration_test/viewpoint_canonical/viewpoints_canonical.tsv")}
    link_ids = {k for k, r in zip(vp, read(ROOT / "integration_test/viewpoint_canonical/viewpoints_canonical.tsv"))
                if r["対象"].startswith("機能間データ連携")}
    # 付け替えで戻したケースが使う既存の判定ID（依頼者決定 2026-10-06）。台帳の突合は行わない
    RETAG = {"IT-0150", "IT-0071", "IT-0072", "IT-0083", "IT-0034", "IT-0035"}
    chains = {r["連鎖ID"]: r for r in read(CG / "chains.tsv")}
    tg = collections.defaultdict(set)
    for r in read(L / "link_targets.tsv"):
        tg[r["上流機能"]] |= set(r["判定ID"].split(","))
    files = sorted(glob.glob(str(L / "cases/*_link_test_cases.tsv")))
    # 識別子の全機能一意（ケース専用シード）
    all_seed = collections.Counter()
    for p in glob.glob(str(L / "cases/*_link_seed_data.tsv")):
        for r in read(pathlib.Path(p)):
            all_seed[r.get("シードID", "")] += 1
    old_seed = set()
    for p in glob.glob(str(CG / "cases/*_seed_data.tsv")):
        old_seed |= {r.get("シードID", "") for r in read(pathlib.Path(p))}
    total = bad = 0
    for p in files:
        fid = pathlib.Path(p).name.split("_")[0]
        if fids and fid not in fids:
            continue
        err = []
        raw = open(p, encoding="utf-8").read().split("\n")
        if raw[0].split("\t") != HDR:
            err.append(("形式", fid, "ヘッダが12列の規定と違う"))
        C = read(pathlib.Path(p))
        sp = L / f"cases/{fid}_link_seed_data.tsv"
        S = read(sp) if sp.exists() else []
        if not sp.exists():
            err.append(("形式", fid, "シード表が無い"))
        elif S and list(S[0].keys()) != SHDR:
            err.append(("形式", fid, "シード表の列が規定と違う"))
        if not (L / f"gen_{fid}/report.md").exists():
            err.append(("形式", fid, "report.md が無い"))
        sid = {r["シードID"]: r for r in S}
        use = collections.defaultdict(list)
        for i, x in enumerate(C, 1):
            t = x["テストID"]
            if None in x or any(v is None for v in x.values()):
                err.append(("形式", t, "列数が合わない")); continue
            if t != f"IT-{fid}-L{i:03d}":
                err.append(("ID", t, f"IT-{fid}-L{i:03d} であるべき"))
            if x["判定ID"] in RETAG:
                if vp[x["判定ID"]] != x["観点ID"]:
                    err.append(("観点ID", t, f"{x['判定ID']} の観点IDは {vp[x['判定ID']]}"))
            elif x["判定ID"] not in link_ids:
                err.append(("判定ID", t, f"機能間データ連携の判定IDでない: {x['判定ID']}"))
            elif vp[x["判定ID"]] != x["観点ID"]:
                err.append(("観点ID", t, f"{x['判定ID']} の観点IDは {vp[x['判定ID']]}"))
            elif x["判定ID"] != "IT-0340" and x["判定ID"] not in tg.get(fid, set()):
                err.append(("判定ID", t, f"台帳がこの上流機能に当てていない判定: {x['判定ID']}"))
            ch = [c for c in re.split(r"[,、 ]+", x["連鎖ID"]) if c]
            for c in ch:
                if c not in chains:
                    err.append(("連鎖ID", t, f"実在しない: {c}"))
            if x["判定ID"] in ("IT-0338", "IT-0339") and not ch:
                err.append(("連鎖ID", t, "画面遷移の判定なのに連鎖IDが無い"))
            if x["優先度"] not in ("P1", "P2"):
                err.append(("優先度", t, x["優先度"]))
            if x["実行区分"] not in ("ブラウザのみ", "ブラウザ+DB確認"):
                err.append(("実行区分", t, x["実行区分"]))
            for col in ("事前準備", "手順", "期待結果", "出典", "使用シード"):
                if not x[col].strip() or x[col].strip() == "—":
                    err.append(("空欄", t, col))
            if not x["期待結果"].rstrip("。").endswith("こと"):
                err.append(("期待結果", t, "「〜こと」で終わっていない"))
            if "上流" not in x["出典"] or "下流" not in x["出典"]:
                err.append(("出典", t, "上流と下流の両方が書かれていない"))
            # 下流は画面に限る。CSV・メールの中身を期待結果にしているものを落とす
            if x["判定ID"] in link_ids and x["判定ID"] != "IT-0337" and re.search(r"CSV|ファイル|メール(?:本文|の件名)?(?:に|が届)", x["期待結果"]) \
                    and not re.search(r"画面|一覧|履歴|ポップアップ", x["期待結果"]):
                err.append(("範囲", t, "期待結果が画面でなくCSV・メールを見ている"))
            body = " ".join(x[c] for c in ("事前準備", "手順", "期待結果"))
            m = BAN.search(body)
            if m:
                err.append(("禁止語", t, m.group(0)))
            for m in PHYS.finditer(body):
                err.append(("物理名", t, m.group(0)))
            if LATER.search(x["事前準備"]):
                err.append(("事前準備", t, "手順の結果を参照している"))
            for s in [s.strip() for s in re.split(r"[,、]", x["使用シード"]) if s.strip()]:
                use[s].append(t)
                if s not in sid:
                    err.append(("シード", t, f"未定義: {s}"))
                elif s not in x["事前準備"]:
                    err.append(("シード", t, f"事前準備にシードIDが無い: {s}"))
        num = lambda t: t.rsplit("-L", 1)[-1]
        for s, r in sid.items():
            if not s.startswith(f"S-{fid}-L-"):
                err.append(("シード", s, f"S-{fid}-L- で始まっていない"))
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
                elif not s.endswith("-" + num(use[s][0])):
                    err.append(("シード", s, "ケース専用のIDの末尾がケース番号でない"))
            if not (r.get("投入方法") or "").strip() or "同上" in "".join(v or "" for v in r.values()):
                err.append(("シード", s, "投入方法が空、または「同上」"))
        total += len(C); bad += bool(err)
        print(f"{fid}: {len(C)}件 " + ("合格" if not err else f"不合格 {len(err)}"))
        for e in err[:40]:
            print("   ", *e)
    print(f"計 {total}件 / 不合格ファイル {bad}")
    return bad


if __name__ == "__main__":
    sys.exit(1 if main(sys.argv[1:]) else 0)

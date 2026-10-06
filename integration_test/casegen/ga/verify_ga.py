#!/usr/bin/env python3
"""アクセス解析連携ケースの機械検査。 verify_ga.py [機能ID...]

形式と、観点表・設計書の見出し・シードとの突合を見る。期待結果の正しさは codex レビューで見る。
"""
import csv, glob, re, sys, pathlib, collections

ROOT = pathlib.Path(__file__).resolve().parents[3]
CG = ROOT / "integration_test/casegen"
G = CG / "ga"
HDR = ["テストID", "判定ID", "要求ID", "連鎖ID", "観点ID", "優先度", "実行区分", "使用シード",
       "事前準備", "手順", "期待結果", "出典"]
SHDR = ["シードID", "区分", "論理名", "状態・属性", "用途", "投入方法", "共有"]
DOCS = {"F10-01": ("f10-01_front_analytics_customer_id.md", "会員IDの連携"),
        "F10-02": ("f10-02_front_analytics_purchase.md", "購入完了の売上連携"),
        "F10-03": ("f10-03_front_analytics_retargeting.md", "閲覧商品の連携")}
# 今回書く範囲。IT-0346・0347（アクセス解析の受信）はタグの管理サービスの設定が無く期待値を決められない
ALLOWED = {"IT-0341", "IT-0342", "IT-0343", "IT-0344", "IT-0345"}
BAN = re.compile(r"失敗させる|該当する操作|同上|いくつか|別の画面|要確認|TBD|設計どおり|正しいこと")
# 物理名: テーブル・カラム・ルート・翻訳キーらしい綴り。受け渡し領域の項目名（バッククォート内）は除く
PHYS = re.compile(r"\b(?:dtb|mtb|plg)_\w+|\b[a-z]+(?:_[a-z0-9]+){1,}\b|\badmin\.[a-z_.]+")
LATER = re.compile(r"手順\d|返した値|発番した|発番された")


def read(p):
    return list(csv.DictReader(p.open(encoding="utf-8"), delimiter="\t"))


def main(fids):
    vp = {r["判定ID"]: r["観点ID"] for r in read(ROOT / "integration_test/viewpoint_canonical/viewpoints_canonical.tsv")}
    old_seed = set()
    for p in glob.glob(str(CG / "cases/*_seed_data.tsv")):
        if pathlib.Path(p).name.split("_")[0] in DOCS:
            continue
        old_seed |= {r.get("シードID", "") for r in read(pathlib.Path(p))}
    total = bad = 0
    for fid in (fids or sorted(DOCS)):
        p = G / f"cases/{fid}_ga_test_cases.tsv"
        if not p.exists():
            print(f"{fid}: ケースが無い"); bad += 1; continue
        err = []
        doc = (ROOT / "functions/pf-eccube3" / DOCS[fid][0]).read_text(encoding="utf-8")
        heads = set(re.findall(r"^#{2,3}\s+(.+?)\s*$", doc, re.M))
        keys = set(re.findall(r"`([^`]+)`", doc))
        if p.open(encoding="utf-8").readline().rstrip("\n").split("\t") != HDR:
            err.append(("形式", fid, "ヘッダが12列の規定と違う"))
        C = read(p)
        sp = G / f"cases/{fid}_ga_seed_data.tsv"
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
            if x["判定ID"] not in ALLOWED:
                err.append(("判定ID", t, f"今回の範囲でない: {x['判定ID']}"))
            elif vp[x["判定ID"]] != x["観点ID"]:
                err.append(("観点ID", t, f"{x['判定ID']} の観点IDは {vp[x['判定ID']]}"))
            if x["要求ID"].strip() or x["連鎖ID"].strip():
                err.append(("形式", t, "要求ID・連鎖IDは空欄にする"))
            if x["優先度"] not in ("P1", "P2"):
                err.append(("優先度", t, x["優先度"]))
            if x["実行区分"] != "ブラウザのみ":
                err.append(("実行区分", t, x["実行区分"]))
            for col in ("事前準備", "手順", "期待結果", "出典", "使用シード"):
                if not x[col].strip() or x[col].strip() == "—":
                    err.append(("空欄", t, col))
            if not x["期待結果"].rstrip("。").endswith("こと"):
                err.append(("期待結果", t, "「〜こと」で終わっていない"))
            pre = f"0310 フロント アクセス解析 / {DOCS[fid][1]} / "
            if not x["出典"].startswith(pre):
                err.append(("出典", t, f"「{pre}<小見出し>」の形でない"))
            else:
                for h in re.split(r"[、,]", x["出典"][len(pre):]):
                    if h.strip() not in heads:
                        err.append(("出典", t, f"機能設計書に無い小見出し: {h.strip()}"))
            body = " ".join(x[c] for c in ("事前準備", "手順", "期待結果"))
            m = BAN.search(body)
            if m:
                err.append(("禁止語", t, m.group(0)))
            for k in re.findall(r"`([^`]+)`", body):
                if k not in keys and k != "dataLayer":
                    err.append(("項目名", t, f"機能設計書に無い項目名: {k}"))
            for m in PHYS.finditer(re.sub(r"`[^`]*`", " ", re.sub(r"[\w.\-]+@[\w.\-]+", " ", body))):
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
        total += len(C); bad += bool(err)
        print(f"{fid}: {len(C)}件 " + ("合格" if not err else f"不合格 {len(err)}"))
        for e in err[:40]:
            print("   ", *e)
    print(f"計 {total}件 / 不合格ファイル {bad}")
    return bad


if __name__ == "__main__":
    sys.exit(1 if main(sys.argv[1:]) else 0)

#!/usr/bin/env python3
"""公開側と管理画面をまたぐ連携ケース（link_pub/）の機械検査。 verify_pub.py [群...]

形式と、群の台帳（groups.tsv）・観点表・機能一覧・シードとの突合を見る。
期待結果の正しさと被覆は codex レビューで見る。verify_link.py を元にしている。
"""
import csv, glob, re, sys, pathlib, collections

ROOT = pathlib.Path(__file__).resolve().parents[3]
CG = ROOT / "integration_test/casegen"
P = CG / "link_pub"
HDR = ["テストID", "判定ID", "上流機能", "下流機能", "要求ID", "連鎖ID", "観点ID", "優先度", "実行区分",
       "使用シード", "事前準備", "手順", "期待結果", "出典"]
SHDR = ["シードID", "区分", "論理名", "状態・属性", "用途", "投入方法", "共有"]
BAN = re.compile(r"失敗させる|該当する操作|同上|いくつか|別の画面|要確認|TBD")
PHYS = re.compile(r"\b(?:dtb|mtb|plg)_\w+|\b[a-z]+(?:_[a-z0-9]+){1,}\b|\badmin\.[a-z_.]+")
LATER = re.compile(r"手順\d|返した値|発番した|発番された")
FID = re.compile(r"^[A-Z]\d\d-\d\d$")
NOT_IMPLEMENTED = {"M03-34", "M03-36"}   # 依頼者決定 2026-10-06: 実装しないのでテスト対象外


def read(p):
    return list(csv.DictReader(p.open(encoding="utf-8"), delimiter="\t"))


def functions():
    cat = {}
    for line in (ROOT / "functions/todo-list.md").open(encoding="utf-8"):
        c = [x.strip() for x in line.split("|")]
        if len(c) > 6 and FID.match(c[5]):
            cat[c[5]] = c[6]
    return cat


def main(codes):
    vp = {r["判定ID"]: r["観点ID"] for r in read(ROOT / "integration_test/viewpoint_canonical/viewpoints_canonical.tsv")}
    groups = {r["群"]: r for r in read(P / "groups.tsv")}
    cat = functions()
    old_seed = set()
    for p in glob.glob(str(CG / "cases/*_seed_data.tsv")):
        old_seed |= {r.get("シードID", "") for r in read(pathlib.Path(p))}
    all_seed = collections.Counter()
    for p in glob.glob(str(P / "cases/*_seed_data.tsv")):
        for r in read(pathlib.Path(p)):
            all_seed[r.get("シードID", "")] += 1
    total = bad = 0
    for code in sorted(groups):
        if codes and code not in codes:
            continue
        g = groups[code]
        judges = set(g["判定ID"].split(","))
        to_admin = g["方向"] == "公開側→管理画面"
        cp, sp = P / f"cases/{code}_test_cases.tsv", P / f"cases/{code}_seed_data.tsv"
        err = []
        if not cp.exists():
            print(f"{code}: ケース表が無い"); bad += 1; continue
        if open(cp, encoding="utf-8").readline().rstrip("\n").split("\t") != HDR:
            err.append(("形式", code, "ヘッダが14列の規定と違う"))
        C = read(cp)
        S = read(sp) if sp.exists() else []
        if not sp.exists():
            err.append(("形式", code, "シード表が無い"))
        elif S and list(S[0].keys()) != SHDR:
            err.append(("形式", code, "シード表の列が規定と違う"))
        if not (P / f"gen_{code}/report.md").exists():
            err.append(("形式", code, "report.md が無い"))
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
            if n != seq[fid]:
                err.append(("ID", t, f"{fid} の連番は {seq[fid]:03d} であるべき"))
            up, down = x["上流機能"].strip(), x["下流機能"].strip()
            for k, v in (("上流機能", up), ("下流機能", down)):
                if v not in cat:
                    err.append((k, t, f"機能一覧に無い: {v!r}"))
                elif v in NOT_IMPLEMENTED:
                    err.append((k, t, f"実装しない機能: {v}"))
            if up == down:
                err.append(("範囲", t, "上流と下流が同じ機能"))
            if to_admin and not (up[:1] == "F" and down[:1] == "M"):
                err.append(("範囲", t, "公開側→管理画面の群なのに上流が公開側・下流が管理画面でない"))
            if not to_admin and not (up[:1] == "M" and down[:1] == "F"):
                err.append(("範囲", t, "管理画面→公開側の群なのに上流が管理画面・下流が公開側でない"))
            # ケースは上流機能の番号で書く。上流が標準機能のときだけ下流の番号で書く（依頼者決定 2026-10-06: 標準機能はケース不要）
            want = down if cat.get(up) == "標準" else up
            if fid != want:
                err.append(("ID", t, f"テストIDの機能は {want} であるべき（上流 {up} の区分 {cat.get(up)}）"))
            if cat.get(want) == "標準":
                err.append(("範囲", t, f"ケースを置く機能 {want} が標準機能"))
            if up not in g["上流機能"].split(","):
                err.append(("範囲", t, f"群の上流機能に無い: {up}"))
            if x["判定ID"] not in judges:
                err.append(("判定ID", t, f"群が当てない判定: {x['判定ID']}"))
            elif vp.get(x["判定ID"]) != x["観点ID"]:
                err.append(("観点ID", t, f"{x['判定ID']} の観点IDは {vp.get(x['判定ID'])}"))
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
            if re.search(r"CSV|ファイル|メール(?:本文|の件名)?(?:に|が届)", x["期待結果"]) \
                    and not re.search(r"画面|一覧|履歴|ポップアップ|ページ", x["期待結果"]):
                err.append(("範囲", t, "期待結果が画面でなくCSV・メールを見ている"))
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
        print(f"{code}: {len(C)}件 " + ("合格" if not err else f"不合格 {len(err)}"))
        for e in err[:40]:
            print("   ", *e)
    print(f"計 {total}件 / 不合格の群 {bad}")
    return bad


if __name__ == "__main__":
    sys.exit(1 if main(sys.argv[1:]) else 0)

#!/usr/bin/env python3
"""反映作業の機械検査。 python3 gate_reflect.py <S> <rNN> [...]"""
import csv, re, sys, pathlib

S = pathlib.Path(sys.argv[1])
R = pathlib.Path("/home/y-saito/Developments/hareruya-design-docs")
BASE = S / "reflect/base"
COLS = ["論点ID", "機能ID", "結果", "md小見出し", "mdに書いた文", "テストID", "補足"]
RES = {"反映", "既存の記述で反映", "ケースのみ", "見送り"}
ALLOWED_H2 = {"処理フロー", "入出力", "業務ロジック", "表示メッセージ", "エラー処理", "出典"}
PHYS = re.compile(r"\b(?:dtb|mtb|plg)_[a-z0-9_]+|\b(?:admin|front|mypage|shopping|eccube)\.[a-z_]+\.[a-z_.]+")
BAN = re.compile(r"失敗させる|該当する操作|同上|いくつか|別の画面")
norm = lambda s: re.sub(r"\s+", "", s)


def rows(p):
    ls = p.read_text(encoding="utf-8").rstrip("\n").split("\n")
    return ls[0].split("\t"), [l.split("\t") for l in ls[1:] if l]


def check(b):
    errs = []
    bh, brows = rows(S / f"reflect/batch/{b}.tsv")
    B = [dict(zip(bh, r)) for r in brows]
    p = S / f"reflect/out/{b}.tsv"
    if not p.exists():
        return [f"{b}: 出力が無い"]
    h, rs = rows(p)
    if h != COLS:
        return [f"{b}: ヘッダーが違う"]
    if [r[0] for r in rs] != [x["論点ID"] for x in B]:
        errs.append(f"{b}: 論点の並びが入力と一致しない")
    binfo = {x["論点ID"]: x for x in B}
    touched_cases = {}
    caseonly = {t.strip() for r in rs if len(r) == 7 and r[2] == "ケースのみ" for t in r[5].split(",") if t.strip()}
    for r in rs:
        if len(r) != 7:
            errs.append(f"{r[0]}: 列数 {len(r)}"); continue
        qid, fid, res, sec, text, tids, note = r
        x = binfo.get(qid, {})
        if res not in RES:
            errs.append(f"{qid}: 結果 {res}"); continue
        if not note.strip():
            errs.append(f"{qid}: 補足が空")
        if res == "見送り":
            continue
        mdt = "".join((R / m).read_text(encoding="utf-8") for m in x.get("機能設計書", "").split(";") if (R / m).is_file())
        for seg in ([] if res == "ケースのみ" else [s.strip() for s in text.split("||") if s.strip() and s.strip() != "—"]):
            if norm(seg) not in norm(mdt):
                errs.append(f"{qid}: mdに書いた文が md に無い「{seg[:40]}」")
            if res == "反映" and PHYS.search(seg):
                errs.append(f"{qid}: mdに書いた文に物理名「{PHYS.search(seg).group(0)}」")
        want = set(x.get("テストID", "").split(","))
        for t in [t.strip() for t in tids.split(",") if t.strip()]:
            if t not in want:
                errs.append(f"{qid}: 担当外のテストID {t}")
            touched_cases.setdefault(fid, set()).add(t)
    # md の見出しと物理名（編集前との差分で見る）
    for mdp in sorted({m for x in B for m in x["機能設計書"].split(";")}):
        fid = mdp
        cur = (R / mdp).read_text(encoding="utf-8")
        old = (BASE / mdp).read_text(encoding="utf-8")
        h2old = set(re.findall(r"^## (.+)$", old, re.M))
        for hh in set(re.findall(r"^## (.+)$", cur, re.M)) - h2old:
            if hh.strip() not in ALLOWED_H2:
                errs.append(f"{fid}: 許されない ## 見出しを新設「{hh}」")
        body_old = old.split("\n## 出典")[0]; body_cur = cur.split("\n## 出典")[0]
        added = [l for l in body_cur.split("\n") if l not in set(body_old.split("\n"))]
        for l in added:
            m = PHYS.search(l)
            if m:
                errs.append(f"{fid}: md本文に足した行に物理名「{m.group(0)}」")
            if re.match(r"\s*(そのため|また|なお|さらに)[、,]", l):
                errs.append(f"{fid}: 接続詞で始まる文「{l[:30]}」")
    # ケース
    for fid, tids in touched_cases.items():
        cp = R / f"integration_test/casegen/cases/{fid}_test_cases.tsv"
        h, cur = rows(cp)
        _, old = rows(BASE / f"cases/{fid}_test_cases.tsv")
        oldd = {r[0]: r for r in old}
        sp = R / f"integration_test/casegen/cases/{fid}_seed_data.tsv"
        seeds = {l.split("\t")[0] for l in sp.read_text(encoding="utf-8").split("\n")[1:] if l} if sp.exists() else set()
        mine = {t for x in B if x["機能ID"] == fid for t in x["テストID"].split(",")}
        for r in cur:
            t = r[0]
            if t not in mine and t in oldd and oldd.get(t) != r:
                errs.append(f"{t}: 担当外のケースが変わった")
            if t not in tids:
                continue
            if len(r) != 11:
                errs.append(f"{t}: 列数 {len(r)}"); continue
            if r[5] not in ("ブラウザのみ", "ブラウザ+DB確認"):
                errs.append(f"{t}: 実行区分 {r[5]}")
            if r[2].strip():
                errs.append(f"{t}: 連鎖IDが空でない")
            if "現行仕様" not in r[10] and t not in caseonly:
                errs.append(f"{t}: 出典が現行仕様を指していない")
            if BAN.search(r[7] + r[8]):
                errs.append(f"{t}: 禁止語")
            m = PHYS.search("\t".join(r[7:10]))
            if m:
                errs.append(f"{t}: ケースに物理名「{m.group(0)}」")
            for s in [s.strip() for s in r[6].split(",") if s.strip() and s.strip() != "—"]:
                if s not in seeds:
                    errs.append(f"{t}: 未定義のシード {s}")
            if [r[0], r[1], r[3], r[4]] != [oldd[t][0], oldd[t][1], oldd[t][3], oldd[t][4]]:
                errs.append(f"{t}: テストID・要求ID・観点ID・優先度が変わった")
        gone = {r[0] for r in old} - {r[0] for r in cur}
        if gone - EXCLUDED or len(cur) - len(old) != -len(gone):
            errs.append(f"{fid}: ケースの行数が変わった {len(old)}→{len(cur)}（除外台帳に無い欠落 {sorted(gone - EXCLUDED)}）")
    return errs


EXCLUDED = {l.split("\t")[0] for l in (R / "integration_test/casegen/hold_review/excluded_cases.tsv").read_text(encoding="utf-8").split("\n")[1:] if l}
bad = 0
for b in sys.argv[2:]:
    e = check(b); bad += len(e)
    print(f"{b}: {'OK' if not e else f'NG {len(e)}件'}")
    for x in e[:60]:
        print("  " + x)
sys.exit(1 if bad else 0)

#!/usr/bin/env python3
"""書き直しの検査と集計。 gate.py [機能ID...]  引数なしは全機能を検査し all.tsv を書く

シード: 対象の全件が1行ずつ／判定が3種／画面は投入方法にDBへの直接投入の語が無い／画面+DB・DB は理由が規定の種類で始まる／
        DB は状態・属性と投入方法がいまと同じ／画面・画面+DB は根拠がある
ケース: テストIDが実在／事前準備に使用シードのIDが全部残っている／期待結果が「〜こと」で終わる／事前準備が後の結果を参照していない／
        呼び名〔…〕が、使用シードの新しい状態・属性か投入方法に定義されている／
        シードの状態・属性から消した5桁以上の番号が、そのシードを使うケースの新しい文に残っていない"""
import csv, pathlib, re, sys, collections
G = pathlib.Path(__file__).resolve().parent
CG = G.parent
csv.field_size_limit(10**9)
DB = re.compile(r"DB投入|DBシード|DBへ|DBで|DBに|DBから|SQL|データベース|フィクスチャ")
WHY = ("過去日時", "入力欄なし", "不整合", "外部・バッチ", "大量", "隔離", "固定番号", "その他")
BAN = re.compile(r"同上|未確定|未整備|\b(?:dtb|mtb|plg)_\w+")
LATER = re.compile(r"手順\d|返した値|発番した|発番された")
LAB = re.compile(r"〔[^〕]+〕")
NUM = re.compile(r"(?<![0-9A-Za-z\-_.@/])\d{5,}(?![0-9A-Za-z\-_.@])")
def rd(p):
    return list(csv.DictReader(open(p, encoding="utf-8"), delimiter="\t", quoting=csv.QUOTE_NONE))
T = [r["機能ID"] for r in rd(G / "targets.tsv")]
EXO = rd(CG / "excluded_open_cases.tsv") if (CG / "excluded_open_cases.tsv").exists() else []
EXS = rd(CG / "excluded_open_seeds.tsv") if (CG / "excluded_open_seeds.tsv").exists() else []
bad, allr, tot, why, ncase = 0, [], collections.Counter(), collections.Counter(), 0
for fid in (sys.argv[1:] or T):
    IN = {r["シードID"]: r for r in rd(G / f"in/{fid}.tsv")}
    p, cp = G / f"out/{fid}.tsv", G / f"cases/{fid}.tsv"
    if not p.exists() or not cp.exists():
        print(f"{fid}: 未着手（out と cases の両方が要る）"); bad += 1; continue
    err, seen, new = [], collections.Counter(), {}
    for r in rd(p):
        s = (r.get("シードID") or "").strip(); seen[s] += 1
        if s not in IN:
            err.append(f"{s}: 対象でないシードID"); continue
        v, st, how, y, ev = [(r.get(k) or "").strip() for k in ("判定", "新しい状態・属性", "新しい投入方法", "理由", "根拠")]
        if v not in ("画面", "画面+DB", "DB"):
            err.append(f"{s}: 判定 {v!r}"); continue
        new[s] = (v, st, how)
        if not how or not st:
            err.append(f"{s}: 新しい状態・属性または投入方法が空")
        if v == "画面" and DB.search(how):
            err.append(f"{s}: 判定が画面なのに投入方法にDBへの直接投入の語がある")
        if v != "DB" and BAN.search(how + st):
            err.append(f"{s}: 同上・未確定・物理名 がある")
        if v != "画面" and not y.startswith(WHY):
            err.append(f"{s}: 理由が規定の種類（{'／'.join(WHY)}）で始まっていない")
        if v == "DB" and (how != IN[s]["投入方法（いま）"].strip() or st != IN[s]["状態・属性"].strip()):
            err.append(f"{s}: 判定がDBなのに状態・属性または投入方法がいまと違う")
        if v != "DB" and not ev:
            err.append(f"{s}: 根拠が空")
        allr.append([s, fid, v, st, how, y, ev]); tot[v] += 1
        if v != "画面":
            why[next((w for w in WHY if y.startswith(w)), "?")] += 1
    for s in IN:
        if seen[s] != 1:
            err.append(f"{s}: {seen[s]}行（1行であること）")
    C = {r["テストID"]: r for r in rd(CG / f"cases/{fid}_test_cases.tsv")}
    SD = {r["シードID"]: r for r in rd(CG / f"cases/{fid}_seed_data.tsv")}
    if EXO:      # 作り方が未確定で外したケース・シード（exclude_open.py）も、書き直しの対象としては実在する
        C.update({r["テストID"]: {k[2:]: v for k, v in r.items() if k.startswith("元_")} for r in EXO if r["機能ID"] == fid and r["テストID"] not in C})
        SD.update({r["シードID"]: r for r in EXS if r["機能ID"] == fid and r["シードID"] not in SD})
    changed = {}
    for r in rd(cp):
        t = (r.get("テストID") or "").strip()
        if t not in C:
            err.append(f"{t}: 実在しないテストID"); continue
        a, b, c = [(r.get(k) or "").strip() for k in ("新事前準備", "新手順", "新期待結果")]
        changed[t] = (a, b, c)
        if not (a and b and c):
            err.append(f"{t}: 空の欄がある")
        if not c.rstrip("。").endswith("こと"):
            err.append(f"{t}: 期待結果が「〜こと」で終わっていない")
        if LATER.search(a):
            err.append(f"{t}: 事前準備が後の結果を参照している（手順N・発番した 等）")
        use = [x.strip() for x in re.split(r"[,、]", C[t]["使用シード"]) if x.strip()]
        for s in use:
            if s not in a:
                err.append(f"{t}: 事前準備からシードID {s} が消えている")
        defs = " ".join((new[s][1] + new[s][2]) if s in new else (SD.get(s, {}).get("状態・属性", "") + SD.get(s, {}).get("投入方法", "")) for s in use)
        for lab in set(LAB.findall(a + b + c)):
            if lab not in defs:
                err.append(f"{t}: 呼び名 {lab} が、使用シードの状態・属性・投入方法に定義されていない")
    for t, x in C.items():
        txt = "".join(changed[t]) if t in changed else x["事前準備"] + x["手順"] + x["期待結果"]
        for s in [y.strip() for y in re.split(r"[,、]", x["使用シード"]) if y.strip()]:
            if s in new and new[s][0] != "DB":
                gone = set(NUM.findall(IN[s]["状態・属性"])) - set(NUM.findall(new[s][1] + new[s][2]))
                left = sorted(n for n in gone if re.search(r"(?<![0-9])" + n + r"(?![0-9])", txt))
                if left:
                    err.append(f"{t}: シード {s} の状態・属性から消した番号 {','.join(left[:4])} がケースに残っている")
    ncase += len(changed)
    if err:
        bad += 1; print(f"{fid}: 不合格 {len(err)}"); [print("   ", e) for e in err[:25]]
if not sys.argv[1:]:
    with open(G / "all.tsv", "w", encoding="utf-8", newline="") as f:
        w = csv.writer(f, delimiter="\t", lineterminator="\n", quoting=csv.QUOTE_NONE, quotechar=None, escapechar="\\")
        w.writerow(["シードID", "機能ID", "判定", "新しい状態・属性", "新しい投入方法", "理由", "根拠"]); w.writerows(allr)
    print(dict(tot)); print(dict(why)); print("書き換えたケース", ncase)
print(f"不合格 {bad}")
sys.exit(1 if bad else 0)

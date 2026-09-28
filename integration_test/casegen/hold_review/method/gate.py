#!/usr/bin/env python3
"""判定TSVの機械検査。形式・網羅・逐語引用・解消の出所を見る。

使い方: python3 gate.py <S> <bNN> [<bNN> ...]
"""
import re, sys, pathlib

S = pathlib.Path(sys.argv[1])
COLS = ["テストID", "機能ID", "判定", "分類", "決める人", "論点", "根拠引用", "生成後の変化", "説明"]
VERDICT = {"維持", "解消", "保留誤り", "対象外"}
CAT = {"矛盾": "設計者", "仕様値": "設計者", "結果": "設計者", "異常の作り方": "テスト側", "外部連携": "設計者"}
norm = lambda s: re.sub(r"\s+", "", s)


def added_lines(fid):
    t = (S / f"src/{fid}.diff.txt").read_text(encoding="utf-8")
    t = t.split("## 生成後に消えた行")[0]
    return norm(t)


def check(b):
    errs = []
    src_rows = [l.rstrip("\n").split("\t") for l in (S / f"batch/{b}.tsv").open(encoding="utf-8")][1:]
    want = [r[0] for r in src_rows]
    p = S / f"judge/{b}.tsv"
    if not p.exists():
        return [f"{b}: 出力が無い"]
    lines = p.read_text(encoding="utf-8").split("\n")
    if lines and lines[-1] == "":
        lines = lines[:-1]
    if not lines or lines[0].split("\t") != COLS:
        errs.append(f"{b}: ヘッダーが違う")
    rows = [l.split("\t") for l in lines[1:]]
    got = [r[0] for r in rows]
    if got != want:
        miss = [x for x in want if x not in got]
        extra = [x for x in got if x not in want]
        dup = sorted({x for x in got if got.count(x) > 1})
        errs.append(f"{b}: ケースの並びが入力と一致しない 欠落{miss[:5]}({len(miss)}) 余分{extra[:5]} 重複{dup[:5]}")
    srcs = {}
    for r in rows:
        if len(r) != 9:
            errs.append(f"{r[0]}: 列数 {len(r)}"); continue
        tid, fid, v, cat, who, issue, quote, chg, why = r
        if fid != "-".join(tid.split("-")[1:3]):
            errs.append(f"{tid}: 機能ID {fid}")
        if v not in VERDICT:
            errs.append(f"{tid}: 判定 {v}"); continue
        if fid not in srcs:
            f = S / f"src/{fid}.txt"
            srcs[fid] = norm(f.read_text(encoding="utf-8")) if f.exists() else ""
        qs = [q.strip() for q in quote.split("||") if q.strip() and q.strip() != "—"]
        if v == "維持":
            if cat not in CAT:
                errs.append(f"{tid}: 分類 {cat}")
            elif who != CAT[cat]:
                errs.append(f"{tid}: 決める人 {who}（{cat}なら{CAT[cat]}）")
            if not issue.strip() or issue.strip() == "—":
                errs.append(f"{tid}: 論点が空")
            if cat in ("矛盾", "異常の作り方") and not qs:
                errs.append(f"{tid}: {cat}は根拠引用が必須")
        else:
            if cat.strip() not in ("", "—"):
                errs.append(f"{tid}: {v}に分類 {cat}")
            if who.strip() != "—":
                errs.append(f"{tid}: {v}の決める人は —")
            if not qs:
                errs.append(f"{tid}: {v}は根拠引用が必須")
        for q in qs:
            if v == "対象外" and "SCOPE" in q:
                continue
            if norm(q) not in srcs[fid] and not any(norm(q) in t for t in ALL.values()):
                errs.append(f"{tid}: 引用が設計書に無い「{q[:40]}」")
        if v == "解消":
            add = added_lines(fid)
            removed = (S / f"src/{fid}.diff.txt").read_text(encoding="utf-8").split("## 生成後に消えた行")[1].strip()
            by_removal = "消えた行" in why and removed
            if not by_removal and not any(norm(q) in add for q in qs):
                errs.append(f"{tid}: 解消だが引用が生成後の追加行に無い")
        if chg not in ("あり", "なし"):
            errs.append(f"{tid}: 生成後の変化 {chg}")
        if not why.strip():
            errs.append(f"{tid}: 説明が空")
    return errs


ALL = {f.stem: norm(f.read_text(encoding="utf-8")) for f in (S / "src").glob("*.txt") if not f.name.endswith(".diff.txt")}
bad = 0
for b in sys.argv[2:]:
    e = check(b)
    bad += len(e)
    print(f"{b}: {'OK' if not e else f'NG {len(e)}件'}")
    for x in e[:60]:
        print("  " + x)
sys.exit(1 if bad else 0)

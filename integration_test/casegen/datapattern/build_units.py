#!/usr/bin/env python3
"""データパターン監査の単位（機能1つ）ごとに設計書の写しを作る。 build_units.py

units/<機能ID>/design.txt   その機能に対応するシート（function-sheet-map.tsv の確定・候補。Excel の無い冊子は機能ごとの節）を
                            いまのHTML設計書から文字に起こしてつないだもの。行頭に L0001 の通し番号。シートの境目に「##### 書番 シートID シート名」の行
units/<機能ID>/keylines.tsv  design.txt のうち、データで結果が変わる定めを含みうる語（KEY）を含む行。監査はこの全行に扱いを付ける（読み飛ばしの検査）
units/<機能ID>/excluded.tsv  その機能のケースのうち、テストから外したもの（保留＝正解が設計書に無い、未確定＝作り方が決まらない）
units/_common/<書番>_<シートID>.txt   どの機能にも対応しないシート（別添資料・共通処理など）。冊子ごとの共通の定めを引くため
units.tsv                    機能ID・機能名・シート・行数・ケース数・共通シート

文字に起こす規則は ../coverage_audit/build_units.py と同じ（取り消し線の中は落とす）。
対象はケースが1件以上ある機能（依頼者決定 2026-10-15「全機能」）。
"""
import csv, glob, html, pathlib, re, collections

ROOT = pathlib.Path(__file__).resolve().parents[3]
P = pathlib.Path(__file__).resolve().parent
C = P.parent
csv.field_size_limit(10**9)
# データで結果が変わる定めに現れやすい語。数量・件数・金額の語、条件の語、範囲の語、重ねの語
KEY = re.compile(r"数量|件数|合計|小計|端数|切り?捨|四捨五入|切り?上げ|残高|在庫数|上限|下限|複数|場合|0件|1件|１件|以上|以下|未満|超え"
                 r"|同一|既に|すでに|組み?合わ?せ|いずれか|ごとに|毎に|按分|税率|とき|時は")


def rd(p):
    return list(csv.DictReader(open(p, encoding="utf-8"), delimiter="\t"))


def to_text(sec):
    sec = re.sub(r"<(script|style)\b.*?</\1>", "", sec, flags=re.S)
    sec = re.sub(r'src="data:[^"]+"', "", sec)
    sec = re.sub(r"<(s|del|strike)\b[^>]*>.*?</\1>", "", sec, flags=re.S)
    sec = re.sub(r"</t[dh]>", "\t", sec)
    sec = re.sub(r"</(tr|p|div|h\d|li|section|table)>|<br\s*/?>", "\n", sec)
    txt = html.unescape(re.sub(r"<[^>]+>", "", sec))
    lines = [re.sub(r"[ 　]+", " ", l).strip(" ") for l in txt.split("\n")]
    return [l.rstrip("\t") for l in lines if l.strip()]


def main():
    fmap = collections.defaultdict(list)
    names = {}
    for r in rd(ROOT / "functions/function-sheet-map.tsv"):
        names.setdefault(r["機能No"], r["機能名"])
        if r["状態"] in ("確定", "候補") and r["シートID"]:
            fmap[(r["ブック"], r["シートID"])].append((r["機能No"], r["状態"]))
    ncase = {}
    for p in glob.glob(str(C / "cases/*_test_cases.tsv")):
        f = pathlib.Path(p).name[:6]
        ncase[f] = len(rd(p))
    excl = collections.defaultdict(list)
    for fn, kind in (("excluded_hold_cases.tsv", "保留"), ("excluded_open_cases.tsv", "未確定")):
        for r in rd(C / fn):
            why = r.get("除外理由", "") + ("：" + r["未確定の内容"] if r.get("未確定の内容") else "")
            excl[r["テストID"][3:9]].append([r["テストID"], kind, why.replace("\t", " "),
                                             r["元_事前準備"], r["元_手順"], r["元_期待結果"]])
    sheets = collections.defaultdict(list)   # 機能 -> [(書番, シートID, 名前, 行)]
    common = collections.defaultdict(list)   # 書番 -> [ファイル名]
    for path in sorted(glob.glob(str(ROOT / "excel_to_html/output/0*.html"))):
        if "詳細設計" in path:
            continue
        book = pathlib.Path(path).name[:4]
        s = open(path, encoding="utf-8").read()
        secs = re.split(r'(?=<section class="sheet-panel(?: is-active)?" id="sheet-\d+")', s)[1:]
        doc = not secs
        if doc:
            secs = re.split(r'(?=<section class="doc-section" id="[^"]+")', s)[1:]
        for sec in secs:
            sid = re.search(r'id="([^"]+)"', sec).group(1)
            m = re.search(r'class="sheet-heading"[^>]*>\s*(?:<h2[^>]*>)?(.*?)</h2>', sec, re.S) or re.search(r"<h[12][^>]*>(.*?)</h[12]>", sec, re.S)
            name = html.unescape(re.sub(r"<[^>]+>", "", m.group(1))).strip() if m else "?"
            if name in ("表紙", "目次"):
                continue
            lines = to_text(sec)
            fids = [(sid.upper(), "確定")] if doc else fmap.get((book, sid), [])
            conf = list(dict.fromkeys([f for f, st in fids if st == "確定"] or [f for f, st in fids]))
            if not conf:
                d = P / "units/_common"
                d.mkdir(parents=True, exist_ok=True)
                fn = f"{book}_{sid}.txt"
                (d / fn).write_text(f"##### {book} {sid} {name}\n" +
                                    "".join(f"L{i:04d}\t{l}\n" for i, l in enumerate(lines, 1)), encoding="utf-8")
                common[book].append(f"{fn}（{name}）")
                continue
            for f in conf:
                sheets[f].append((book, sid, name, lines))
    out = []
    for f in sorted(ncase):
        if ncase[f] == 0:
            continue
        d = P / "units" / f
        d.mkdir(parents=True, exist_ok=True)
        buf, n = [], 0
        for book, sid, name, lines in sheets.get(f, []):
            buf.append(f"##### {book} {sid} {name}\n")
            for l in lines:
                n += 1
                buf.append(f"L{n:04d}\t{l}\n")
        if not n:
            # HTML設計書にシートが無い機能（M01-01・M05-14・M11-05）は機能設計書を使う
            for md in sorted(glob.glob(str(ROOT / f"functions/*/{f.lower()}_*.md"))):
                if "_archive" in md:
                    continue
                buf.append(f"##### 機能設計書 {pathlib.Path(md).relative_to(ROOT)}\n")
                for l in open(md, encoding="utf-8").read().split("\n"):
                    if l.strip():
                        n += 1
                        buf.append(f"L{n:04d}\t{l.rstrip()}\n")
        (d / "design.txt").write_text("".join(buf), encoding="utf-8")
        kl = ["行\t本文\n"] + [f"{l[:5]}\t{l[6:].rstrip(chr(10)).replace(chr(9), ' ')[:300]}\n"
                                for l in buf if l.startswith("L") and KEY.search(l[6:])]
        (d / "keylines.tsv").write_text("".join(kl), encoding="utf-8")
        (d / "excluded.tsv").write_text(
            "テストID\t除外\t理由\t事前準備\t手順\t期待結果\n" +
            "".join("\t".join(x.replace("\t", " ").replace("\n", " ") for x in r) + "\n" for r in excl.get(f, [])),
            encoding="utf-8")
        books = sorted({b for b, *_ in sheets.get(f, [])})
        out.append([f, names.get(f, ""), "・".join(f"{b} {s} {nm}" for b, s, nm, _ in sheets.get(f, [])), n, ncase[f],
                    "・".join(c for b in books for c in common.get(b, []))])
    with open(P / "units.tsv", "w", encoding="utf-8", newline="") as fp:
        w = csv.writer(fp, delimiter="\t", lineterminator="\n")
        w.writerow(["機能ID", "機能名", "シート", "行数", "ケース数", "共通シート"])
        w.writerows(out)
    print(f"機能 {len(out)}・設計書の無い機能 {sum(1 for r in out if r[3] == 0)}・共通シート {sum(map(len, common.values()))}")


main()

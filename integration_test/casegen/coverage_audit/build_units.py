#!/usr/bin/env python3
"""被覆監査の単位（シート1枚）ごとに材料を作る。 build_units.py

units/<書番>_<シートID>/sheet.txt   いまのHTML設計書の該当シートを文字に起こしたもの。行頭に L0001 の行番号
units/<書番>_<シートID>/cases.tsv   そのシートに対応する機能のケース（除外した保留ケースは 実行区分=保留除外 で併せて載せる）
units.tsv                           単位の一覧（書番/シートID/シート名/機能/区分/扱い/行数/ケース数）

扱い: 監査 / 対象外（表紙・目次）/ 対象外（標準機能）/ 対象外（依頼者決定） / 対象外（フェーズ2・廃止・未実装）
"""
import csv, glob, html, pathlib, re, collections

ROOT = pathlib.Path(__file__).resolve().parents[3]
A = ROOT / "integration_test/casegen/coverage_audit"
C = ROOT / "integration_test/casegen"
csv.field_size_limit(10**9)


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


def categories():
    cat = {}
    for l in open(ROOT / "functions/todo-list.md", encoding="utf-8"):
        c = [x.strip() for x in l.split("|")]
        if len(c) > 7 and re.fullmatch(r"[A-Z]\d\d-\d\d", c[5]):
            cat[c[5]] = c[6]
    return cat


def main():
    cat = categories()
    fmap = collections.defaultdict(list)
    for r in rd(ROOT / "functions/function-sheet-map.tsv"):
        if r["状態"] in ("確定", "候補") and r["シートID"]:
            fmap[(r["ブック"], r["シートID"])].append((r["機能No"], r["状態"]))
    targets = {(r["機能ID"]): r["扱い"] for r in rd(C / "sheetmap/targets.tsv")}
    unlisted = {}
    p = C / "sheetmap/unlisted_sheets.tsv"
    for r in rd(p):
        unlisted[(r.get("書番", ""), r.get("シート名", ""))] = r
    cases = collections.defaultdict(list)
    all_rows = rd(C / "all_test_cases.tsv")
    head = list(all_rows[0].keys())
    for r in all_rows:
        cases[re.sub(r"^IT-|-\d+$", "", r["テストID"])].append(r)
    for r in rd(C / "excluded_hold_cases.tsv"):
        tid = r.get("テストID", "")
        row = {k: r.get("元_" + k, "") for k in head}
        row["テストID"] = tid
        row["実行区分"] = "保留除外"
        cases[re.sub(r"^IT-|-\d+$", "", tid)].append(row)

    out = []
    for path in sorted(glob.glob(str(ROOT / "excel_to_html/output/0*.html"))):
        if "詳細設計" in path:
            continue
        book = pathlib.Path(path).name[:4]
        s = open(path, encoding="utf-8").read()
        secs = re.split(r'(?=<section class="sheet-panel(?: is-active)?" id="sheet-\d+")', s)[1:]
        doc = not secs  # Excel の無い冊子（0309 など）は機能ごとの doc-section で並ぶ
        if doc:
            secs = re.split(r'(?=<section class="doc-section" id="[^"]+")', s)[1:]
        if not secs:
            out.append([book, "-", pathlib.Path(path).stem, "", "", "対象外（本文なし）", 0, 0, 0])
        for sec in secs:
            sid = re.search(r'id="([^"]+)"', sec).group(1)
            m = re.search(r'class="sheet-heading"[^>]*>\s*(?:<h2[^>]*>)?(.*?)</h2>', sec, re.S) or re.search(r"<h[12][^>]*>(.*?)</h[12]>", sec, re.S)
            name = html.unescape(re.sub(r"<[^>]+>", "", m.group(1))).strip() if m else "?"
            lines = to_text(sec)
            fids = [(sid.upper(), "確定")] if doc else fmap.get((book, sid), [])
            conf = list(dict.fromkeys([f for f, st in fids if st == "確定"] or [f for f, st in fids]))
            cats = sorted({cat.get(f, "?") for f in conf})
            if name in ("表紙", "目次"):
                how = "対象外（表紙・目次）"
            elif conf and all(cat.get(f) == "標準" for f in conf):
                how = "対象外（標準機能）"
            elif conf and all(targets.get(f, "").startswith("対象外") for f in conf):
                how = "対象外（" + "・".join(sorted({targets[f] for f in conf})) + "）"
            elif not conf and unlisted.get((book, name), {}).get("扱い") == "テスト対象外":
                how = "対象外（依頼者決定 2026-10-06）"
            else:
                how = "監査"
            d = A / "units" / f"{book}_{sid}"
            rows = [r for f in conf for r in cases.get(f, [])]
            if how == "監査":
                d.mkdir(parents=True, exist_ok=True)
                (d / "sheet.txt").write_text(
                    "".join(f"L{i:04d}\t{l}\n" for i, l in enumerate(lines, 1)), encoding="utf-8")
                with open(d / "cases.tsv", "w", encoding="utf-8", newline="") as f:
                    w = csv.DictWriter(f, head, delimiter="\t", lineterminator="\n")
                    w.writeheader()
                    w.writerows(rows)
            out.append([book, sid, name, ",".join(conf), ",".join(cats), how, len(lines),
                        sum(len(l) for l in lines), len(rows)])
    with open(A / "units.tsv", "w", encoding="utf-8", newline="") as f:
        w = csv.writer(f, delimiter="\t", lineterminator="\n")
        w.writerow(["書番", "シートID", "シート名", "機能", "区分", "扱い", "行数", "文字数", "ケース数"])
        w.writerows(out)
    c = collections.Counter(r[5] for r in out)
    for k, v in c.items():
        print(v, k, sum(r[6] for r in out if r[5] == k), "行")


main()

#!/usr/bin/env python3
"""対応表を確定させた機能の材料を作る。 build_materials.py [機能ID...]

materials/<機能ID>_requirements.tsv  要求（requirements_all.tsv から、その機能のシートの行）
materials/<機能ID>_sheet.txt         いまのHTML設計書の該当シートを文字に起こしたもの（表は1行をタブ区切り）
要求文がいまのHTMLに無いときは 要求表の「現HTML」列に 無 を書く（requirements_all.tsv は 2026-09-01 の抽出）。
"""
import csv, glob, html, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parents[3]
G = ROOT / "integration_test/casegen/sheetmap"
csv.field_size_limit(10**9)


def targets():
    t = {}
    for r in csv.DictReader((G / "targets.tsv").open(encoding="utf-8"), delimiter="\t"):
        if r["扱い"] == "ケース作成":
            t.setdefault(r["機能ID"], []).append((r["書番"], r["シート名"]))
    return t


def sheet_text(book, name):
    p = glob.glob(str(ROOT / f"excel_to_html/output/{book}_*.html"))
    p = [x for x in p if "詳細設計" not in x][0]
    s = pathlib.Path(p).read_text(encoding="utf-8")
    parts = re.split(r'(?=<section class="sheet-panel(?: is-active)?" id="sheet-\d+")', s)
    for sec in parts:
        m = re.search(r'class="sheet-heading"[^>]*>\s*(?:<h2[^>]*>)?(.*?)</h2>', sec, re.S)
        if not m:
            continue
        if html.unescape(re.sub(r"<[^>]+>", "", m.group(1))).strip() != name:
            continue
        sec = re.sub(r"<(script|style)\b.*?</\1>", "", sec, flags=re.S)
        sec = re.sub(r'src="data:[^"]+"', "", sec)
        sec = re.sub(r"<(s|del|strike)\b[^>]*>.*?</\1>", "", sec, flags=re.S)
        sec = re.sub(r"</t[dh]>", "\t", sec)
        sec = re.sub(r"</(tr|p|div|h\d|li|section|table)>|<br\s*/?>", "\n", sec)
        txt = html.unescape(re.sub(r"<[^>]+>", "", sec))
        lines = [re.sub(r"[ 　]+", " ", l).strip(" ") for l in txt.split("\n")]
        return "\n".join(l.rstrip("\t") for l in lines if l.strip())
    sys.exit(f"{book} {name}: シートが見つからない")


def main(fids):
    T = targets()
    R = list(csv.DictReader((ROOT / "integration_test/casegen/requirements_all.tsv").open(encoding="utf-8"), delimiter="\t"))
    for fid in fids or sorted(T):
        texts, rows = [], []
        for book, name in T[fid]:
            tx = sheet_text(book, name)
            texts.append(f"===== {book} {name} =====\n{tx}")
            flat = re.sub(r"\s+", "", tx)
            for r in R:
                if (r["書番"], r["シート名"]) == (book, name):
                    cur = "有" if re.sub(r"\s+", "", r["要求文"]) in flat else "無"
                    rows.append([r["要求ID"], f"{book} {name}", r["区分"], r["ブロック見出し"], r["表ヘッダ"], r["要求文"], cur])
        (G / f"materials/{fid}_sheet.txt").write_text("\n\n".join(texts) + "\n", encoding="utf-8")
        with (G / f"materials/{fid}_requirements.tsv").open("w", encoding="utf-8", newline="") as f:
            w = csv.writer(f, delimiter="\t", lineterminator="\n")
            w.writerow(["要求ID", "シート", "区分", "ブロック見出し", "表ヘッダ", "要求文", "現HTML"])
            w.writerows(rows)
        print(f"{fid}: 要求 {len(rows)}（現HTMLに無い {sum(r[-1]=='無' for r in rows)}） / シート文字 {sum(map(len, texts))}字")


if __name__ == "__main__":
    if sys.argv[1:2] == ["--sheet"]:      # build_materials.py --sheet 0202 在庫移動指示検索  （他シートを読む）
        print(sheet_text(sys.argv[2], " ".join(sys.argv[3:])))
    else:
        main(sys.argv[1:])

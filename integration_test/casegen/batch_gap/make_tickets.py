#!/usr/bin/env python3
"""questions.tsv の論点から、Backlog に起票する「設計要確認」の下書きを作る（登録はしない）。 make_tickets.py

  tickets/<論点ID>.md   課題の本文（以前の設計裁定の起票 ECCUBE_HARERUYA-3187 などと同じ型）
  tickets.tsv           論点ID・課題名・設計書・本文のファイル

根拠に書いた「html:行番号」は設計者には意味が無いので、その行の data-excel-ref（Excel のシート!セル）に置き換える。
どの冊子の HTML かは、根拠の中で直前に書かれた4桁の書番で決める。行に印が無ければ上へ5行まで探す。見つからなければ止める。
"""
import csv, glob, pathlib, re, sys

P = pathlib.Path(__file__).resolve().parent
ROOT = P.parents[2]
OUT = ROOT / "excel_to_html/output"
csv.field_size_limit(10**9)
BOOK = re.compile(r"(?<!\d)(0[2-5]\d\d)(?!\d)")
HREF = re.compile(r"html:(\d+(?:[-〜]\d+)?(?:,\s*\d+(?:[-〜]\d+)?)*)")
_lines = {}


def lines(book):
    if book not in _lines:
        f = sorted(glob.glob(str(OUT / f"{book}_*.html")))
        assert f, f"HTML が無い: {book}"
        _lines[book] = (pathlib.Path(f[0]).name, open(f[0], encoding="utf-8").read().split("\n"))
    return _lines[book]


def ref_at(book, n):
    _, L = lines(book)
    for k in range(n, max(n - 6, 0), -1):
        m = re.search(r'data-excel-ref="\d{4}:([^"]+)"', L[k - 1])
        if m:
            return m.group(1)
    # HTML に埋め込んだ機能設計書の部分（Excel 由来でない）は、機能IDと節名で指す
    h3 = h4 = None
    for k in range(n, 0, -1):
        if h3 is None and (m := re.search(r"<h3[^>]*>(.+?)</h3>", L[k - 1])):
            h3 = re.sub(r"<[^>]+>", "", m.group(1))
        if (m := re.search(r"<h4>([A-Z]\d\d-\d\d) ", L[k - 1])):
            h4 = m.group(1); break
        if 'class="sheet-panel' in L[k - 1]:
            break
    if h4:
        return f"機能設計書 {h4} / {h3 or '冒頭'}"
    sys.exit(f"Excel の位置が見つからない: {book} html:{n}")


def to_excel(text):
    out, pos, book = [], 0, None
    for m in HREF.finditer(text):
        before = text[pos:m.start()]
        bs = BOOK.findall(text[:m.start()])
        book = bs[-1] if bs else None
        assert book, f"書番が決まらない: {text[max(0, m.start() - 60):m.end()]}"
        refs = []
        for part in re.split(r",\s*", m.group(1)):
            a, *b = re.split(r"[-〜]", part)
            r1 = ref_at(book, int(a))
            if b:
                r2 = ref_at(book, int(b[0]))
                refs.append(r1 if r1 == r2 else f"{r1}〜{r2.split('!')[-1] if r2.split('!')[0] == r1.split('!')[0] else r2}")
            else:
                refs.append(r1)
        out += [before, "、".join(r if r.startswith("機能設計書") else "Excel " + r for r in dict.fromkeys(refs))]
        pos = m.end()
    out.append(text[pos:])
    return "".join(out)


def main():
    rows = list(csv.DictReader(open(P / "questions.tsv", encoding="utf-8"), delimiter="\t"))
    smap = {}
    for r in csv.DictReader(open(ROOT / "functions/function-sheet-map.tsv", encoding="utf-8"), delimiter="\t"):
        if r["状態"] == "確定":
            smap.setdefault(r["機能No"], []).append(r["ブック"])
    (P / "tickets").mkdir(exist_ok=True)
    index = []
    for x in rows:
        fid, name = x["バッチ"].split(" ", 1)
        books = smap.get(fid, [])
        assert books, f"冊子が決まらない: {fid}"
        titles = [lines(b)[0].replace(".html", ".xlsx") for b in books]
        cls = re.search(r"\((.+?)\)", titles[0]).group(1)
        q = x["設計者への問い"].strip()
        summary = f"【設計要確認】{cls}_{name}_{q}"
        basis = to_excel(x["設計書の記述（根拠）"])
        lack = to_excel(x["足りない記述"])
        opts = x["選択肢"].strip()
        body = f"""# 基本情報【必須】
分類：{cls}
機能：{fid} {name}
課題カテゴリ：設計要確認
課題：{summary}
設計書：{'、'.join(titles)}
要件元：Excel設計書（{'、'.join(titles)}）

# 完了条件【必須】
- {q}
- 決まった内容（このデータを表示・利用する画面と項目、または画面では扱わないこと）が設計書へ反映され、結合テストの判断基準が定まっていること。

# 現在の挙動【必須】
- 設計書の記述（実装は確認していない）: {basis}
- 足りない記述: {lack}

# 想定される影響範囲
- バッチが更新したデータを画面で確かめる結合テスト（バッチ→画面の連携）の期待結果を決められない。
- 関係する画面: {x['関係する画面']}

# 補足情報【任意】
▼備考
論点ID：{x['論点ID']}（integration_test/casegen/batch_gap/questions.tsv）
区分：{ {'A': 'A 連携先が無い', 'B': 'B 対応が書かれていない', 'C': 'C 連携に関わる食い違い'}[x['区分']] }
更新先のデータ：{x['更新先のデータ']}
選択肢：{opts}
"""
        assert "html:" not in body, f"{x['論点ID']}: html: の行番号が残っている"
        (P / f"tickets/{x['論点ID']}.md").write_text(body, encoding="utf-8")
        index.append([x["論点ID"], summary, "、".join(titles), f"tickets/{x['論点ID']}.md"])
    with open(P / "tickets.tsv", "w", encoding="utf-8") as w:
        w.write("論点ID\t課題名\t設計書\t本文\n")
        for r in index:
            w.write("\t".join(r) + "\n")
    print(len(index), "件の下書き")


if __name__ == "__main__":
    main()

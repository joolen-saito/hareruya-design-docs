#!/usr/bin/env python3
"""cases/<機能ID>_test_cases.tsv を機能IDの順に連結して all_test_cases.tsv を作る。

列は cases/ の11列から 要求ID・優先度 を除いた9列（依頼者決定 2026-10-16）。cases/ には11列のまま残る
（E2E と前提条件の検査 precond/gate_precond.py が cases/ の要求ID・優先度を読むため）。
行の並びは機能ごとのファイルの並びを保つ。
playwright_cases.tsv に挙げたケースは、一覧の実行区分を「Playwright」にする（依頼者決定 2026-10-16。
e2e/ に Playwright のテストがあり、ローカルで実行したケース。合否は問わない）。cases/ の実行区分は変えない
（E2E がDB確認の可否を cases/ の実行区分で決めるため）。テストを足して実行したら、そのIDを playwright_cases.tsv に足して流し直す。
2026-10-06 に、それまでの一覧（8,325件）がこの連結と一致することを確かめてからスクリプトにした。

一覧はスプレッドシートに貼って読むので、事前準備・手順・出典はセル内で改行し、出典は観点IDと実行区分の間に置く
（依頼者決定 2026-10-19）。改行するのは項目の区切りだけで、文字は区切りの「／」「｜」「；」「、」を改行に置き換える
（「。」で区切っている箇所は「。」を残して後ろに改行を足す）以外は変えない。cases/ は1行のまま（E2E が行単位・列位置で読むため）。
- 事前準備: 「／」の直後が ②③… の番号のときだけ改行する。「。」の直後が番号＋空白のときも改行する。
  番号の付かない「／」（「ログインID／パスワード」「氏名（姓）=…／氏名（名）=…」など）は本文の一部なので切らない。
- 手順: 「／」の直後が「2. 」のような番号のときだけ改行する（「店舗設定／自動送信メールテンプレート編集画面」などは切らない）。
- 出典: 「｜」（シートの区切り。上流／下流もここ）と括弧の外の「；」で改行する。「、」は直後がシート（「0202 在庫編集 / …」）か
  節（画面項目定義・業務ロジック・入出力など SECTIONS）のときだけ改行する（「受注キャンセル、返品」のような節名の中の「、」は切らない）。
"""
import csv, glob, io, pathlib, re

CG = pathlib.Path(__file__).resolve().parent
OMIT = ("要求ID", "優先度")   # 一覧には出さない列
PLAYWRIGHT = "Playwright"      # Playwright で実行したケースの、一覧での実行区分
ORDER = ("テストID", "連鎖ID", "観点ID", "出典", "実行区分", "使用シード", "事前準備", "手順", "期待結果")  # 一覧の列の並び

CIRCLED = "[①-⑳㉑-㉟]"
OPEN, CLOSE = "（(「『【〔［", "）)」』】〕］"
# 出典で「、」の直後に来たら改行する節の名前（設計書の節の種類）
SECTIONS = ("画面項目定義", "項目定義", "画面部品一覧", "入出力", "現行仕様", "リニューアル後の仕様", "表示メッセージ",
            "業務ロジック", "機能仕様", "要件説明", "カスタマイズ説明", "エラー時の扱い", "エッジケース", "機能設計書")


def break_precondition(s):
    s = re.sub(rf"／(?={CIRCLED})", "\n", s)
    return re.sub(rf"。(?={CIRCLED} )", "。\n", s)


def break_steps(s):
    return re.sub(r"／(?=\d+\. )", "\n", s)


def break_source(s):
    # 「｜」と、括弧の外の「；」「、」で切り、区切りごとに改行するか元の文字を残すかを決める。
    # 閉じていない「（」（シート名「0207 ポイント付与（余剰入金へのご返金、注文金額変更によるご返金 / …」）は、
    # シート名の終わり「 / 」か「｜」までの括弧とみなす（その後ろの区切りまで切らずに残さないため）。
    # 余分な閉じ括弧（「表１）一覧表示順序」）は数えない。
    stack, matched = [], set()
    for i, ch in enumerate(s):
        if ch in OPEN:
            stack.append(i)
        elif ch in CLOSE and stack:
            matched |= {stack.pop(), i}
    parts, cur, depth, unclosed = [], "", 0, False
    for i, ch in enumerate(s):
        if ch in OPEN:
            if i in matched:
                depth += 1
            else:
                unclosed = True
        elif ch in CLOSE and i in matched:
            depth -= 1
        elif ch == "｜" or s.startswith(" / ", i):
            unclosed = False
        if ch == "｜" or (ch in "；、" and depth == 0 and not unclosed):
            parts.append((cur, ch)); cur = ""
        else:
            cur += ch
    parts.append((cur, ""))
    out = parts[0][0]
    for (_, sep), (text, _) in zip(parts, parts[1:]):
        new_line = sep in "｜；" or " / " in text or text.startswith(SECTIONS)
        out += ("\n" if new_line else sep) + text
    return out


BREAK = {"事前準備": break_precondition, "手順": break_steps, "出典": break_source}


def main():
    hdr, rows = None, []
    for p in sorted(glob.glob(str(CG / "cases/*_test_cases.tsv"))):
        r = list(csv.reader(open(p, encoding="utf-8"), delimiter="\t"))
        assert hdr is None or r[0] == hdr, f"列が違う: {p}"
        hdr = r[0]
        rows += [x for x in r[1:] if x]
        bad = [x[0] for x in r[1:] if x and len(x) != len(hdr)]
        assert not bad, f"列数が見出しと違う行がある（列を位置で落とすので止める）: {p} {bad[:5]}"
    ids = [x[0] for x in rows]
    assert len(ids) == len(set(ids)), "テストIDが重複している"
    pw = [x[0] for x in list(csv.reader(open(CG / "playwright_cases.tsv", encoding="utf-8"), delimiter="\t"))[1:] if x]
    assert len(pw) == len(set(pw)), "playwright_cases.tsv にテストIDの重複がある"
    missing = sorted(set(pw) - set(ids))
    assert not missing, f"playwright_cases.tsv のテストIDが cases/ に無い（除外されたケースか、IDの誤り）: {missing[:5]}"
    kind, pw_ids = hdr.index("実行区分"), set(pw)
    for x in rows:
        if x[0] in pw_ids:
            x[kind] = PLAYWRIGHT
    assert all(h in hdr for h in OMIT), f"落とす列が見出しに無い: {hdr}"
    assert sorted(ORDER) == sorted(h for h in hdr if h not in OMIT), f"一覧の列の並び ORDER が見出しと合わない: {hdr}"
    assert not any("\n" in v or "\r" in v for x in rows for v in x), "cases/ に改行を含むセルがある"
    keep = [hdr.index(h) for h in ORDER]
    brk = [BREAK.get(h, lambda v: v) for h in ORDER]
    b = io.StringIO()
    w = csv.writer(b, delimiter="\t", lineterminator="\n")   # 改行を含むセルは "" で囲まれる（スプレッドシートに貼ると1セルに収まる）
    w.writerow(ORDER); w.writerows([[f(x[i]) for i, f in zip(keep, brk)] for x in rows])
    (CG / "all_test_cases.tsv").write_text(b.getvalue(), encoding="utf-8")
    print(f"{len(rows)} 件 / {len({i[3:9] for i in ids})} 機能（うち実行区分 {PLAYWRIGHT} {len(pw)} 件）")


if __name__ == "__main__":
    main()

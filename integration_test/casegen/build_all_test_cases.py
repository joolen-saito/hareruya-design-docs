#!/usr/bin/env python3
"""cases/<機能ID>_test_cases.tsv を機能IDの順に連結して all_test_cases.tsv を作る。

列は cases/ の11列から 要求ID・優先度（依頼者決定 2026-10-16）と 連鎖ID（依頼者決定 2026-10-20）を除いた8列。cases/ には11列のまま残る
（E2E と前提条件の検査 precond/gate_precond.py が cases/ の要求ID・優先度を読むため）。
行の並びは機能ごとのファイルの並びを保つ。
playwright_cases.tsv は、e2e/ の Playwright のテストをローカルで流して合否が出たケースの表（テストID・結果・記録）。
結果が「合格」のケースだけ、一覧の検証方法（cases/ の実行区分）を「Playwright」にする（依頼者決定 2026-10-20。
それまでは合否を問わず Playwright にしていた＝2026-10-16 決定）。不合格のケースは cases/ の実行区分のまま出す。
cases/ の実行区分は変えない（E2E がDB確認の可否を cases/ の実行区分で決めるため）。
テストを流して合否が出たら、テストID・結果（合格／不合格）・記録（e2e/review の記録のパス）を playwright_cases.tsv に足すか直して流し直す。
シードで止まった「合否未判定」は足さない。
2026-10-06 に、それまでの一覧（8,325件）がこの連結と一致することを確かめてからスクリプトにした。

一覧はスプレッドシートに貼って読むので、事前準備・手順・出典はセル内で改行し、出典は観点IDと実行区分の間に置く
（依頼者決定 2026-10-19）。改行するのは項目の区切りだけで、文字は区切りの「／」「｜」「；」「、」を改行に置き換える
（「。」で区切っている箇所は「。」を残して後ろに改行を足す）以外は変えない。cases/ は1行のまま（E2E が行単位・列位置で読むため）。
- 事前準備: 「／」の直後が ②③… の番号のときだけ改行する。「。」の直後が番号＋空白のときも改行する。
  番号の付かない「／」（「ログインID／パスワード」「氏名（姓）=…／氏名（名）=…」など）は本文の一部なので切らない。
- 手順: 「／」の直後が「2. 」のような番号のときだけ改行する（「店舗設定／自動送信メールテンプレート編集画面」などは切らない）。
- 出典: 「｜」（シートの区切り。上流／下流もここ）と括弧の外の「；」で改行する。「、」は直後がシート（「0202 在庫編集 / …」）か
  節（画面項目定義・業務ロジック・入出力など SECTIONS）のときだけ改行する（「受注キャンセル、返品」のような節名の中の「、」は切らない）。
  シートと節の間の「 / 」も括弧の外なら改行する（依頼者決定 2026-10-20。「（0301 ECTOP / SALE開催中 …）」のような括弧の中は切らない）。
- 観点ID・使用シード: 区切りの「,」「、」で改行する（依頼者決定 2026-10-20）。
一覧では出典の見出しを「基本設計書」（中身は基本設計仕様書のシートと節）、実行区分を「検証方法」、使用シードを「テストデータ」にする
（依頼者決定 2026-10-20）。cases/ の見出しは元のまま（E2E の e2e/lib/catalog.ts が11列の見出しを厳密に照合するため）。
一覧のテストIDは機能ごとに 001 からの抜けの無い連番に振り直す（依頼者決定 2026-10-23）。cases/ のテストIDは除外したケースの分が
抜けたままだが、E2E のコード・playwright_cases.tsv・除外の一覧（excluded_*_cases.tsv）が cases/ のテストIDで引くので、cases/ は変えない。
一覧のテストIDと cases/ のテストIDの対応は all_test_cases_id_map.tsv に書く。一覧からケースのテストIDを引く検査は、この対応表で cases/ の
テストIDに戻して使う。セルの中に出てくる他のケースのテストID（「IT-M13-15-005は…」など）も一覧のテストIDに置き換える。
ケースを足したり外したりすると、その機能の後ろのケースの一覧のテストIDはずれる。

一覧の末尾に、手で書き込む列「実施者」「実施日」「実施結果」「備考」を置く（依頼者決定 2026-10-26）。cases/ には無い列で、作り直しても消えないよう、
作り直す前の一覧と対応表から cases/ のテストIDで値を引き継ぐ（一覧のテストIDは振り直しでずれるため）。
引き継ぎ先のケースが無くなった（外した）値は消さずに all_test_cases_record_orphans.tsv に書き出し、件数を知らせる。
"""
import csv, glob, io, pathlib, re

CG = pathlib.Path(__file__).resolve().parent
OMIT = ("要求ID", "優先度", "連鎖ID")   # 一覧には出さない列
PLAYWRIGHT = "Playwright"      # Playwright で流して合格したケースの、一覧での検証方法
RESULTS = ("合格", "不合格")   # playwright_cases.tsv の結果の値
ORDER = ("テストID", "観点ID", "出典", "実行区分", "使用シード", "事前準備", "手順", "期待結果")  # 一覧の列の並び
RENAME = {"出典": "基本設計書", "実行区分": "検証方法", "使用シード": "テストデータ"}  # 一覧での見出し（cases/ の見出しは変えない）
ID_MAP = "all_test_cases_id_map.tsv"   # 一覧のテストID と cases/ のテストID の対応表
ID_RE = re.compile(r"IT-([A-Z]\d\d-\d\d)-\d{3}")
RECORD = ("実施者", "実施日", "実施結果", "備考")   # 一覧の末尾の手で書き込む列（依頼者決定 2026-10-26）
ORPHANS = "all_test_cases_record_orphans.tsv"      # 引き継ぎ先のケースが無くなった書き込み

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
    return "\n".join(break_sheet_section(line) for line in out.split("\n"))


def break_sheet_section(line):
    # シートと節の間の「 / 」を改行にする。対になった括弧の中の「 / 」は切らない（閉じていない「（」は数えない）。
    stack, matched = [], set()
    for i, ch in enumerate(line):
        if ch in OPEN:
            stack.append(i)
        elif ch in CLOSE and stack:
            matched |= {stack.pop(), i}
    out, depth, i = "", 0, 0
    while i < len(line):
        ch = line[i]
        if i in matched:
            depth += 1 if ch in OPEN else -1
        if depth == 0 and line.startswith(" / ", i):
            out += "\n"; i += 3
            continue
        out += ch; i += 1
    return out


def break_list(s):
    return re.sub(r"\s*[,、]\s*", "\n", s)


BREAK = {"事前準備": break_precondition, "手順": break_steps, "出典": break_source,
         "観点ID": break_list, "使用シード": break_list}


def previous_records():
    """作り直す前の一覧の手書きの列を、cases/ のテストID → 値 で返す"""
    lp, mp = CG / "all_test_cases.tsv", CG / ID_MAP
    if not lp.exists() or not mp.exists():
        return {}
    old = list(csv.DictReader(open(lp, encoding="utf-8", newline=""), delimiter="\t"))
    if not old or not all(h in old[0] for h in RECORD):
        return {}
    to_case = {r["一覧のテストID"]: r["cases/のテストID"] for r in csv.DictReader(open(mp, encoding="utf-8"), delimiter="\t")}
    rec = {}
    for r in old:
        vals = [r[h] or "" for h in RECORD]
        if any(v.strip() for v in vals):
            assert r["テストID"] in to_case, f"一覧のテストIDが対応表に無い（手書きの列を引き継げない）: {r['テストID']}"
            rec[to_case[r["テストID"]]] = vals
    return rec


def main():
    rec = previous_records()
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
    pr = list(csv.DictReader(open(CG / "playwright_cases.tsv", encoding="utf-8"), delimiter="\t"))
    pw = [x["テストID"] for x in pr]
    assert len(pw) == len(set(pw)), "playwright_cases.tsv にテストIDの重複がある"
    missing = sorted(set(pw) - set(ids))
    assert not missing, f"playwright_cases.tsv のテストIDが cases/ に無い（除外されたケースか、IDの誤り）: {missing[:5]}"
    bad = [x["テストID"] for x in pr if x.get("結果") not in RESULTS or not (x.get("記録") or "").strip()]
    assert not bad, f"playwright_cases.tsv の結果が「合格」「不合格」でないか、記録が空の行がある: {bad[:5]}"
    kind, pw_ids = hdr.index("実行区分"), {x["テストID"] for x in pr if x["結果"] == "合格"}
    for x in rows:
        if x[0] in pw_ids:
            x[kind] = PLAYWRIGHT
    assert all(h in hdr for h in OMIT), f"落とす列が見出しに無い: {hdr}"
    assert sorted(ORDER) == sorted(h for h in hdr if h not in OMIT), f"一覧の列の並び ORDER が見出しと合わない: {hdr}"
    assert not any("\n" in v or "\r" in v for x in rows for v in x), "cases/ に改行を含むセルがある"
    # 一覧のテストIDを機能ごとの 001 からの連番にする（行の並びは cases/ のまま）
    seq, renum = {}, {}
    for t in ids:
        m = ID_RE.fullmatch(t)
        assert m, f"テストIDの形が IT-<機能ID>-<3桁> でない: {t}"
        seq[m.group(1)] = seq.get(m.group(1), 0) + 1
        assert seq[m.group(1)] <= 999, f"1機能のケースが999件を超えた: {m.group(1)}"
        renum[t] = f"IT-{m.group(1)}-{seq[m.group(1)]:03d}"
    dangling = sorted({m.group(0) for x in rows for v in x[1:] for m in ID_RE.finditer(v)} - set(renum))
    assert not dangling, f"セルの中に cases/ に無いテストIDがある（外したケースを指している。一覧のIDに置き換えられない）: {dangling[:5]}"
    for x in rows:
        x[0] = renum[x[0]]
        x[1:] = [ID_RE.sub(lambda m: renum[m.group(0)], v) for v in x[1:]]
    keep = [hdr.index(h) for h in ORDER]
    brk = [BREAK.get(h, lambda v: v) for h in ORDER]
    b = io.StringIO()
    w = csv.writer(b, delimiter="\t", lineterminator="\n")   # 改行を含むセルは "" で囲まれる（スプレッドシートに貼ると1セルに収まる）
    w.writerow([RENAME.get(h, h) for h in ORDER] + list(RECORD))
    w.writerows([[f(x[i]) for i, f in zip(keep, brk)] + rec.get(t, [""] * len(RECORD)) for t, x in zip(ids, rows)])
    lost = {t: v for t, v in rec.items() if t not in set(ids)}
    op = CG / ORPHANS
    if lost or op.exists():
        prev = list(csv.reader(open(op, encoding="utf-8", newline=""), delimiter="\t"))[1:] if op.exists() else []
        keep_prev = [r for r in prev if r and r[0] not in set(ids) and r[0] not in lost]
        o = io.StringIO()
        ow = csv.writer(o, delimiter="\t", lineterminator="\n")
        ow.writerow(["cases/のテストID"] + list(RECORD)); ow.writerows(keep_prev + [[t] + v for t, v in sorted(lost.items())])
        op.write_text(o.getvalue(), encoding="utf-8")
        if lost:
            print(f"注意: 手書きの列の値があるケース {len(lost)} 件が一覧から無くなった。値は {ORPHANS} に残した")
    (CG / "all_test_cases.tsv").write_text(b.getvalue(), encoding="utf-8")
    m = io.StringIO()
    w = csv.writer(m, delimiter="\t", lineterminator="\n")
    w.writerow(["一覧のテストID", "cases/のテストID"]); w.writerows([[renum[t], t] for t in ids])
    (CG / ID_MAP).write_text(m.getvalue(), encoding="utf-8")
    print(f"{len(rows)} 件 / {len({i[3:9] for i in ids})} 機能（うち検証方法 {PLAYWRIGHT} {len(pw_ids)} 件。Playwright で流して不合格の {len(pw) - len(pw_ids)} 件は元の区分のまま）"
          f"。テストIDを振り直したケース {sum(a != b for a, b in renum.items())} 件（対応は {ID_MAP}）。手書きの列を引き継いだケース {sum(t in rec for t in ids)} 件")


if __name__ == "__main__":
    main()

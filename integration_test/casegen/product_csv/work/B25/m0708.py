import re, sys
sys.path.insert(0, ".")
from lib import *
hdr, I = load("M07-08")
LN = {"JP": "日本語", "EN": "英語", "FR": "FR"}
LNEW = {"JP": "日本語（JP）", "EN": "英語（EN）", "FR": "FR"}
STN = {"NM": "ニアミント（NM）", "HP": "ヘビープレイド（HP）"}
def lang_in_list(l): return "言語FR" if l == "FR" else LN[l]
def by_code(code):
    return f"商品マスター(検索入力)で商品コードに「{code}」を入れて「検索する >」を押し、{OPEN_EDIT}"
def shelf_pre(s, sale=None):
    t = ""
    if sale: t += f"セールフラグにチェックを入れて販売価格(円)に{sale}、"
    if s: t += f"棚番号に「{s}」を入れ、"
    return t

PCARD = re.compile(
    r"(?P<pre>を押し、)商品登録で商品名に「(?P<n>[^」]+)」を入れ、カード指定でそのカードを選び、略称タグに「(?P<t>\w+)」を選んで「登録」を押し、続けて商品規格登録で商品コードに「(?P<c>[^」]+)」、言語に(?P<lang>JP|EN)・状態に(?P<st>NM|HP)に当たる選択肢、基準価格\(円\)に(?P<b>\d+)、(?P<sale>セールフラグにチェックを入れて)?販売価格\(円\)に(?P<sp>\d+)、買取価格\(円\)に1、部門、棚番号に「(?P<s>[^」]+)」を入れて「登録」を押す。")
PSUP = re.compile(
    r"商品登録で商品名に「(?P<n>[^」]+)」を入れ、カード指定をせずに（サプライ品）「登録」を押し、続けて商品規格登録で商品コードに「(?P<c>[^」]+)」、言語にJP・状態にNMに当たる選択肢、基準価格\(円\)と販売価格\(円\)に(?P<p>\d+)、買取価格\(円\)に1、部門(?:、棚番号に「(?P<s>[^」]+)」)?を入れて「登録」を押す。")

def prod_card(n, t, code, lang, st, base, sale, shelf, cname, saleflag):
    tmp = None if (st == "NM") else code + "-TMP"
    csvcode = code if st == "NM" else tmp
    s = csv_sentence([row(csvcode, n, n, base, 1, sale=base, lang=LN[lang] if lang != "FR" else "FR")]) + "。"
    s += by_code(csvcode) + "、「カード指定 >」ボタンを押し、カード検索ポップアップでカード名(日/英)に「" + cname + "」を入れて検索ボタンを押して表示された、上で登録したカードの行の決定ボタンを押す。"
    s += f"続けて商品名(日)に「{n}」、商品名(英)に「{n}」を入れ（カード指定で自動で入った値は書き換える）、略称タグに「{t}」を選び、割引率に販売割引率に登録済みのものを選んで「商品を登録」ボタンを押す。"
    s += SPEC_LIST + "。"
    if st == "NM":
        s += nm_edit(lang_in_list(lang), pub=False, pre=shelf_pre(shelf, sale if saleflag else None)) + "。"
    else:
        s += new_class(LNEW[lang], STN[st], code, base, sale, 1, extra=shelf_pre(shelf, None), pub=False) + "。" + del_tmp(tmp) + "。"
    return s

def prod_sup(n, code, price, shelf):
    s = csv_sentence([row(code, n, n, price, 1)]) + "。"
    s += by_code(code) + "、「規格設定」ボタンから商品規格一覧を開く。" + nm_edit("日本語", pub=False, pre=shelf_pre(shelf)) + "。"
    return s

out = []
for r in I:
    sid, kind, lname, attr, use, old, share, cases = r
    num = sid.split("-")[-1]
    basis = "M03-27 L0092・L0119・L0123・L0124・L0129・L0134、M03-02 L0075〜L0077・L0092・L0105・L0111・L0128・L0129、M03-09 L0077・L0086〜L0087・L0130〜L0134・L0145・L0157・L0159・L0196〜L0198"
    why = ""
    if sid == "S-M07-08-SORT-011":
        spec = {}
        cmp_names = "T-LOW T-MID T-HIGH T-SUP SH-A1 SH-A2 LG-JP LG-EN LG-FR ST-NM ST-HP FL-NON FL-FOIL TG-A TG-B RA-M RA-C CO-RED CO-BLUE CN-001 CN-002 AL-ALPHA AL-BETA".split()
        rows = []; names = {}; infos = []
        for i, cn in enumerate(cmp_names, 1):
            code = f"M0708-SORT-{i:02d}-011"
            if i == 4:
                n = "T-SUP"; base = 50; lang = "JP"; st = "NM"; tag = None
            else:
                tag = "BBB" if i == 15 else "COL" if i in (20, 21) else "ALP" if i in (22, 23) else "AAA"
                lang = "EN" if i == 8 else "FR" if i == 9 else "JP"
                st = "HP" if i == 11 else "NM"
                color = "青" if i == 19 else "赤"; rar = "C" if i == 17 else "M"
                n = f"{cn}[{tag}]【{lang}/{st}】{color}{rar}"
                base = 99 if i == 1 else 500 if i == 3 else 100
            csvcode = code + ("-TMP" if st == "HP" else "")
            rows.append(row(csvcode, n, n, base, 1, lang={"JP": "日本語", "EN": "英語", "FR": "FR"}[lang]))
            infos.append((i, code, n, lang, st, base, tag))
        p0 = old.index("通常商品22件は、")
        p1 = old.index("を入れて「登録」を押す。サプライ品M0708-SORT-04-011は、")
        p2 = old.index("を入れて「登録」を押す。", p1 + 10 + 20) + len("を入れて「登録」を押す。")
        # カード登録の部分（商品登録の直前まで）を残す
        q = old.index("、商品登録で商品名に「比較名", p0)
        assert old[p0:q].endswith("を押し")
        keep = old[p0:q][:-1] + "す。"
        s = keep + csv_sentence(rows) + "。"
        s += ("通常商品22件（M0708-SORT-04-011を除く）は、1件ずつ、商品マスター(検索入力)で商品コード（M0708-SORT-HP-TMPの仮の規格を使う商品は商品コードに「-TMP」を付けたもの）を入れて「検索する >」を押し、商品マスター(検索結果)の行から商品登録編集画面（既存の商品の編集）を開き、"
              "「カード指定 >」ボタンを押し、カード検索ポップアップで上で登録したそのカードの行の決定ボタンを押す。続けて商品名(日)・商品名(英)に上の「比較名[略称]【言語/状態】色レアリティ」の形の商品名を入れ直し（カード指定で自動で入った値は書き換える）、"
              "略称タグ（M0708-SORT-15-011はBBB、M0708-SORT-20-011と21はCOL、M0708-SORT-22-011と23はALP、ほかはAAA）を選び、割引率に販売割引率に登録済みのものを選んで「商品を登録」ボタンを押す。")
        s = s.replace("（M0708-SORT-HP-TMPの仮の規格を使う商品は商品コードに「-TMP」を付けたもの）", "（M0708-SORT-11-011だけは「M0708-SORT-11-011-TMP」）")
        s += ("23商品それぞれについて（M0708-SORT-04-011は商品マスター(検索入力)で商品コードを入れて検索し、行から商品登録編集画面を開く）、「規格設定」ボタンから商品規格一覧を開く。商品規格一覧で、言語（M0708-SORT-08-011は英語、M0708-SORT-09-011はFR、ほかは日本語）・状態NMの規格（取り込みで作られた規格）の行を開き、商品規格登録編集画面で部門は選択肢の先頭を選び、"
              "棚番号（M0708-SORT-04-011は「S01」、M0708-SORT-06-011は「A02」、ほかは「A01」）を入れ、「商品規格を登録」ボタンを押す（M0708-SORT-11-011を除く）。")
        s += ("M0708-SORT-11-011は、取り込みで作られた規格が状態NMなので、商品規格一覧の「新規作成」を押し、商品規格登録編集画面で言語に日本語（JP）、状態にヘビープレイド（HP）を選び、商品コードに「M0708-SORT-11-011」、基準価格(円)に100、販売価格(円)に100、買取価格(円)に1を入れ、部門は選択肢の先頭を選び、棚番号に「A01」を入れ、「商品規格を登録」ボタンを押したあと、"
              "状態NMの規格（取り込みで作られた規格。商品コード「M0708-SORT-11-011-TMP」）の行を開き、「商品規格を削除」ボタンを押す（残す規格だけにする）。")
        new = old[:p0] + s + old[p2:]
        why = ("23商品の商品名（比較名[略称]【言語/状態】色レアリティ）・商品コード・言語・状態・基準価格・買取価格1円・棚番号は元のシードの値。部門は選択肢の先頭にした。"
               "状態HPのM0708-SORT-11-011は、取り込みで作られるのがニアミントだけなので、仮の規格（商品コードに「-TMP」）を取り込み、HPの規格を足して仮の規格を削除する（M03-09 L0159・L0197）。"
               "商品カテゴリは元が定めていないのでサプライ・グッズのまま。")
        out.append([sid, "直す", new, "", basis, why])
        continue
    def fcard(m):
        cname = re.findall(r"カード名に「([^」]+)」", old[:m.start()])[-1]
        sale = int(m.group("sp")) if m.group("sale") else None
        return "を押す。" + prod_card(m.group("n"), m.group("t"), m.group("c"), m.group("lang"), m.group("st"), int(m.group("b")), int(m.group("sp")), m.group("s"), cname, bool(m.group("sale")))
    def fsup(m):
        return prod_sup(m.group("n"), m.group("c"), int(m.group("p")), m.group("s"))
    new, k1 = PCARD.subn(fcard, old)
    new, k2 = PSUP.subn(fsup, new)
    assert k1 + k2 >= 1, sid
    assert "商品登録で商品名" not in new and "商品規格登録で" not in new, sid
    why = "商品名・商品コード・言語・状態・基準価格・買取価格・棚番号は元のシードの値。部門は選択肢の先頭にした。"
    if k1:
        why += "カードは先に登録したカードを取り込み後に商品登録編集画面（既存の商品の編集）でカード指定し、商品名を入れ直し、略称タグを選ぶ。割引率は販売割引率に登録済みのものから選ぶ。商品カテゴリは元が定めていないのでサプライ・グッズのまま。"
    if "セールフラグ" in old:
        why += "セール価格の商品は、取り込みの規格は販売価格が基準価格と同額になるので、取り込み後に規格を開いてセールフラグにチェックを入れ販売価格を入れた（M03-09 L0086〜L0087）。"
    if "EN・状態にHP" in old:
        why += "英語・HPの商品は、取り込みで作られるのがニアミントだけなので、仮の規格（商品コードに「-TMP」）を取り込み、HPの規格を足して仮の規格を削除する（M03-09 L0159・L0197）。"
    out.append([sid, "直す", new, "", basis, why])
write("M07-08", out)

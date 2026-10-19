import re, pathlib
P = pathlib.Path('/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/product_csv')
HDR = ["シードID", "判定", "新しい投入方法", "新しい状態・属性", "根拠", "理由"]

def load(fid):
    ls = [l.rstrip('\n').split('\t') for l in open(P/f'in/{fid}.tsv', encoding='utf-8')]
    return ls[0], [x for x in ls[1:] if x and x != ['']]

CAT = "商品カテゴリ(ID)はサプライ・グッズのカテゴリID（カテゴリ登録/編集画面の最上位の一覧で「サプライ・グッズ」の行のID欄に表示された値）"

def csv_sentence(code, ja, en, base, sale, buy, branch=0, limit=None, paren=""):
    lim = f"販売制限数{limit}・" if limit else ""
    s = (f"管理画面のグッズ商品CSV登録で雛形ファイルをダウンロードし、1行を書いたCSVをCSVファイル選択で選んで「CSVファイルのアップロード」を押し、表示された確認モーダルでアップロードを確定する"
         f"（商品IDは空・商品コードは{code}・商品名(日)は「{ja}」・商品名(英)は「{en}」・言語(ID)は日本語のID・商品公開ステータスは2（公開）・支店の商品公開ステータスは{branch}（{'公開' if branch else '非公開'}）・サイズ1・重量1・{CAT}・購入グループ名称は既存の購入グループの名称・{lim}基準価格{base}・販売価格{sale}・買取価格{buy}・原価単価10・地域別販売制限は0・スマレジ連携フラグは0・スマレジ商品コードと部門IDは空）。"
         f"グッズ商品は状態ニアミントの規格が1件作られる{paren}。")
    return s

def search_id(code_txt, plabel):
    return f"商品マスター(検索入力)で商品コードに{code_txt}を入れて「検索する >」を押し、商品マスター(検索結果)の行の商品IDに表示された番号を控える（〔{plabel}〕）。"

OPEN = "商品マスター(検索結果)の行から商品登録編集画面（既存の商品の編集）を開き、「規格設定」ボタンから商品規格一覧を開く。"
def read_cls(clabel):
    return f"商品規格一覧で言語日本語・状態NMの規格（取り込みで作られた規格）の行を開き、商品規格登録編集画面に表示された商品規格IDを控える（〔{clabel}〕）。"

# ---------------- M04-21 標準形 ----------------
A = re.compile(r"管理画面の商品登録画面で、カード詳細を持たない商品を、商品名に(?P<name>.*?)、そのほかの必須項目に任意の値を入れて公開状態で登録する。続けてその商品の商品規格登録画面で、商品コードに(?P<code>.*?)、スマレジ連携フラグに「連携しない」、(?P<lang>言語に日本語、状態にNM、)?販売種別・基準価格\(円\)・買取価格\(円\)などそのほかの必須項目に任意の値を入れて「商品規格を登録」を押す（登録と同時に、開店中の各店舗のEC-CUBEとスマレジの店舗別在庫が在庫0・総原価0で作られる。(?P<paren>.*?)）。(?P<mid>この登録では[^。]*。)?登録後の商品規格登録画面に表示された商品IDと商品規格IDを控える（(?P<pl>〔商品ID-[^〕]*〕)(?P<cl>〔商品規格ID-[^〕]*〕)）。")

def std_repl(m):
    pl, cl = m['pl'][1:-1], m['cl'][1:-1]
    suf = pl.replace("商品ID-M0421-", "")
    name = m['name']
    if name.startswith("「"):
        ja = en = name[1:-1]
    else:
        ja, en = f"M0421-{suf}-商品", f"M0421-{suf}-ITEM"
    code = m['code']
    if code.startswith("半角英字Lを255文字"):
        codetxt = "半角英字Lを255文字連続した値"
        codeq = "半角英字Lを255文字連続した値"
    else:
        codetxt = f"「{code}」"; codeq = f"「{code}」"
    paren = f"（取り込みと同時に、開店中の各店舗のEC-CUBEとスマレジの店舗別在庫が在庫0・総原価0で作られる。{m['paren']}）"
    s = csv_sentence(codetxt, ja, en, 100, 100, 100, 0, None, paren)
    if m['mid']: s += m['mid']
    s += search_id(codeq, pl) + OPEN + read_cls(cl)
    return s

def fix_m0421(sid, old):
    n = 0
    labels = []
    def f(m):
        nonlocal n
        n += 1; labels.append(m['pl'][1:-1])
        return std_repl(m)
    new = A.sub(f, old)
    return new, n

# 026 の重複コード: 2件目は別コードで作り、規格の画面で書き換える
def fix_026(old):
    new, n = fix_m0421("S-M04-21-VALIDATION-026", old)
    return new, n

# ---------------- 特殊(051/052/057/058) ----------------
def special(sid, old):
    if sid == "S-M04-21-QE-DETAIL-051":
        a = old.index("【商品】"); b = old.index("【CSV】")
        pl = "商品ID-M0421-001"
        new = ("【商品】" + csv_sentence("「QE0421-001-CODE」", "QE0421-001-NAME", "QE0421-001-NAME", 100, 100, 1, 0, None, "（取り込みと同時に、開店中の店舗ごとの在庫が0で作られる）")
               + search_id("「QE0421-001-CODE」", pl)
               + "【商品規格】" + OPEN + "商品規格一覧で言語日本語・状態NMの規格（取り込みで作られた規格）の行を開き、商品規格登録編集画面で基準価格(円)=100、販売価格(円)=100、買取価格(円)=1、部門は選択肢の先頭、公開ステータス=公開を入れて「商品規格を登録」を押す（登録した規格は表示対象になる）。")
        return old[:a] + new + old[b:]
    if sid == "S-M04-21-QE-SALE-052":
        a = old.index("【商品】"); b = old.index("【在庫】")
        pl = "商品ID-M0421-002"
        new = ("【商品】" + csv_sentence("「QE0421-002-CODE」", "QE0421-002-NAME", "QE0421-002-NAME", 1, 1, 1, 1, None, "（取り込みと同時に、開店中の店舗ごとの在庫が0で作られる）")
               + search_id("「QE0421-002-CODE」", pl)
               + "商品マスター(検索結果)の行から商品登録編集画面（既存の商品の編集）を開き、タグの「固定のセールタグ」にチェックを入れ、割引率に販売割引率に登録済みのものを選んで「商品を登録」を押す。"
               + "【商品規格】商品の「規格設定」から商品規格一覧を開き、言語日本語・状態NMの規格（取り込みで作られた規格）の行を開き、商品規格登録編集画面でセールフラグをチェックし、基準価格(円)=1、販売価格(円)=1、買取価格(円)=1、部門は選択肢の先頭、公開ステータス=公開を入れて「商品規格を登録」を押す（登録した規格は表示対象になる）。")
        return old[:a] + new + old[b:]
    if sid in ("S-M04-21-RC-STOCK-057", "S-M04-21-RC-STOCK-058"):
        k = sid[-3:]; num = "001" if k == "057" else "002"
        a = old.index("【商品】"); b = old.index(f"申請者（rc0421-{num}-ap）でログインし")
        branch = 1 if k == "057" else 0
        code = f"RC0421{num}CODE"
        new = ("【商品】" + csv_sentence(f"「{code}」", f"RC0421-{num}-NAME", f"RC0421-{num}-NAME", 1, 1, 1, branch, None, "（取り込みと同時に、開店中の店舗ごとの在庫が0で作られる）")
               + OPEN + "商品規格一覧で言語日本語・状態ニアミントの規格（取り込みで作られた規格）の行を開き、商品規格登録編集画面で基準価格(円)=1、販売価格(円)=1、買取価格(円)=1、部門は選択肢の先頭、公開ステータス=公開を入れて「商品規格を登録」を押す。")
        return old[:a] + new + old[b:]
    return None

# ---------------- M10-05 ----------------
def fix_m1005(sid, old):
    n = sid[-3:]
    a = old.index("2) 商品A:"); b = old.index("3) 在庫:")
    pl = f"商品ID-M1005-{n}"; code = f"M1005L-A-{n}"
    new = ("2) 商品A: " + csv_sentence(f"「{code}」", f"M1005L商品A-{n}", f"M1005L-ITEM-A-{n}", 1000, 1000, 100, 0, 10, "")
           + search_id(f"「{code}」", pl)
           + OPEN + "商品規格一覧で言語日本語・状態NMの規格（取り込みで作られた規格）の行を開き、商品規格登録編集画面で基準価格(円)に「1000」、販売価格(円)に「1000」（販売価格は税込みの額として扱われる）、販売制限数に「10」を入れ、部門は選択肢の先頭を選び、公開ステータスに「公開」を選んで「商品規格を登録」ボタンを押す。")
    return old[:a] + new + old[b:]

def main():
    # M04-21
    h, rows = load("M04-21")
    ii = {c: i for i, c in enumerate(h)}
    out = []
    std_reason = ("商品名・価格は元が「任意」なのでシード専用の値にした（商品名(日)=M0421-<番号>-商品、商品名(英)=M0421-<番号>-ITEM、基準価格=販売価格=買取価格=100）。"
                  "支店の商品公開ステータスは元が指定していないので0（非公開）にした。割引率・規格の部門・規格の公開ステータスは元が「任意」でケースも使わず、CSVに列が無いので設定しない。"
                  "取り込みで作られる在庫は公開中の店舗と在庫場所ぶん数量0（M03-27 L0129）。")
    basis = "M03-27 L0092・L0119・L0123・L0124・L0129・L0134・L0224・L0236〜L0237、M03-02 L0075〜L0077・L0116、M03-09 L0124"
    for r in rows:
        sid = r[0]; old = r[ii['投入方法']]
        if sid in ("S-M04-21-STOREPERM-038",) or True:
            pass
        if sid.startswith("S-M04-21-QE-") or sid.startswith("S-M04-21-RC-STOCK"):
            new = special(sid, old)
            if sid.endswith("051"):
                why = ("商品名・コード・価格・日本語・NM・公開状態・販売制限なしはCSVで入れ、規格の部門・公開ステータスは取り込み後の商品規格登録編集画面で入れる。支店の商品公開ステータスは元が指定していないので0。"
                       "元の「カード指定は任意」は押さない形にした。商品カテゴリは元が「1つ以上」なのでサプライ・グッズのまま。割引率は元が任意でケースも使わず、CSVに列が無いので設定しない。")
                b = basis + "、M03-09 L0077"
            elif sid.endswith("052"):
                why = ("商品名・コード・価格・日本語・NM・支店の商品公開ステータス公開はCSVで入れ、固定のセールタグは取り込み後の商品登録編集画面で、セールフラグと規格の部門・公開ステータスは商品規格登録編集画面で入れる（M03-27 L0125〜L0126、M03-09 L0086〜L0087）。"
                       "元の「カード指定は任意」は押さない形にした。商品カテゴリは元が「1つ以上」なのでサプライ・グッズのまま。")
                b = basis + "、M03-09 L0077・L0086〜L0087"
            else:
                why = ("商品名・コード・価格・日本語・NM・公開状態・販売制限なしはCSVで入れ、規格の部門・公開ステータスは取り込み後の商品規格登録編集画面で入れる。"
                       + ("支店の商品公開ステータスは元どおり公開（1）。" if sid.endswith("057") else "支店の商品公開ステータスは元が指定していないので0。")
                       + "元の「カード指定は任意」は押さない形にした。商品カテゴリは元が「1つ以上」なのでサプライ・グッズのまま。割引率は元が任意でケースも使わず、CSVに列が無いので設定しない。")
                b = basis + "、M03-09 L0077"
            out.append([sid, "直す", new, "", b, why]); continue
        new, n = fix_026(old) if sid.endswith("VALIDATION-026") else fix_m0421(sid, old)
        if n == 0:
            out.append([sid, "直さない", "", "", "", "商品の新規登録を含まない（要確認）"]); continue
        why = std_reason
        b = basis
        if sid.endswith("VALIDATION-026"):
            # 重複コードの3件目: 別コードで作り、規格の画面で書き換える
            dup = "DUP-M421-026"
            first = new.index(f"商品コードは「{dup}」")
            second = new.index(f"商品コードは「{dup}」", first + 5)
            new = new[:second] + f"商品コードは「{dup}-2」" + new[second+len(f"商品コードは「{dup}」"):]
            # 2件目の検索キーと規格の読み取り箇所
            i2 = new.index(f"商品コードに「{dup}」を入れて", second)
            new = new[:i2] + f"商品コードに「{dup}-2」を入れて" + new[i2+len(f"商品コードに「{dup}」を入れて"):]
            rd = "商品規格一覧で言語日本語・状態NMの規格（取り込みで作られた規格）の行を開き、商品規格登録編集画面に表示された商品規格IDを控える（〔商品規格ID-M0421-026C〕）。"
            j = new.index(rd)
            new = new[:j] + "商品規格一覧で言語日本語・状態NMの規格（取り込みで作られた規格）の行を開き、商品規格登録編集画面で商品コードに" + dup + "、部門は選択肢の先頭を選んで「商品規格を登録」ボタンを押し、登録後の商品規格登録画面に表示された商品規格IDを控える（〔商品規格ID-M0421-026C〕）。" + new[j+len(rd):]
            why += "同じ商品コードDUP-M421-026の規格を2件作る必要がある。CSVは新規の商品コードの重複を取り込まない（M03-27 L0116・L0134）ので、3件目は別の商品コード「DUP-M421-026-2」で作り、取り込み後に商品規格登録編集画面で商品コードをDUP-M421-026に書き換えて重複させる（M03-33 TARGETS-044と同じ方法。規格の画面の商品コードに一意の検査が無いことは、ee の実装に頼る）。"
            b += "、M03-09 L0077"
        if sid.endswith("VALIDATION-026"):
            assert "2つ目: 別の商品を新しく登録し、同じ商品コードで同じように作る。" in new
            new = new.replace("2つ目: 別の商品を新しく登録し、同じ商品コードで同じように作る。", "2つ目: 別の商品を、同じ商品コードで作る。")
        if sid.endswith("LONGCODE-017"):
            why += "商品コードの255文字はCSVの商品コード列に入れる（M03-27 に最大文字数の定めは無いため、取り込みが通るかは実機で確かめる必要がある）。"
        if sid.endswith("APPRV-047"):
            why += "元の「この登録では承認情報・入庫承認待ち在庫情報・在庫変動履歴は作られない」はそのまま残した（CSV取り込みが作るのは価格履歴と在庫0の行だけ M03-27 L0170）。"
        out.append([sid, "直す", new, "", b, why])
    write("M04-21", out)

    # M10-05
    h, rows = load("M10-05"); ii = {c: i for i, c in enumerate(h)}
    out = []
    for r in rows:
        sid = r[0]; old = r[ii['投入方法']]
        new = fix_m1005(sid, old)
        why = ("商品名は元が「任意の名称」なのでシード専用の値（M1005L商品A-<番号>）にした。支店の商品公開ステータスは元が指定していないので0、買取価格は元が任意なので100、割引率は元が任意でケースも使わずCSVに列が無いので設定しない。"
               "購入上限10はCSVの販売制限数（M03-27 L0224）で入れた。基準価格・販売価格・販売制限数は元の値（1000・1000・10）で、規格の画面でも同じ値を入れ直して公開ステータスと部門を設定する。元の最後の「商品公開ステータスを公開にして商品を登録」は、CSVの商品公開ステータス2（公開）で足りるので省いた。")
        out.append([sid, "直す", new, "", "M03-27 L0092・L0119・L0123・L0124・L0129・L0134・L0224・L0232、M03-02 L0116、M03-09 L0077・L0086〜L0087・L0124", why])
    write("M10-05", out)

    # M03-17
    h, rows = load("M03-17"); out = []
    for r in rows:
        sid = r[0]
        if sid in ("S-M03-17-L-PRD-040", "S-M03-17-L-DEL-041"):
            why = ("商品はすでにグッズ商品CSV登録で作っており、商品登録編集画面は取り込んだ商品の編集（「商品を登録」）に使っているだけ。"
                   "気づいた誤り（直していない）: CSV の商品コード・商品名・商品公開ステータス・必須列の値が「任意」「有効な値」と曖昧なうえ、基準価格・販売価格・買取価格が具体値でなく、CSVの雛形から列を読み替える書き方になっている。")
            out.append([sid, "直さない", "", "", "M03-27 L0092・L0123・L0124、M03-02 L0075〜L0077", why])
        else:
            out.append([sid, "直さない", "", "", "", "売上分析タグの登録・削除だけで、商品は作らない。末尾の「商品登録編集画面やCSV登録で商品に紐付けず」は紐付けないという禁止の記述。"])
    write("M03-17", out)

    # M11-03
    h, rows = load("M11-03"); out = []
    for r in rows:
        sid = r[0]
        out.append([sid, "直さない", "", "", "", "権限URLマスター・権限グループ・メンバーの登録だけで、商品は作らない。「/product/product/new」は権限URLの値（権限名「商品登録・編集」のURL）であって、商品登録画面での商品の新規登録ではない。"])
    write("M11-03", out)

def write(fid, out):
    ls = ["\t".join(HDR)] + ["\t".join(x) for x in out]
    for x in out:
        for c in x: assert "\t" not in c and "\n" not in c, (fid, x[0])
    (P/f'out/{fid}.tsv').write_text("\n".join(ls) + "\n", encoding='utf-8')

main()

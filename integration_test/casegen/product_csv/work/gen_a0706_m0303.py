import re, pathlib
P = pathlib.Path('/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/product_csv')

def load(fid):
    ls = [l.rstrip('\n').split('\t') for l in open(P/f'in/{fid}.tsv', encoding='utf-8')]
    return ls[0], [x for x in ls[1:] if x and x != ['']]

UPG = "グッズ商品CSV登録で雛形ファイルをダウンロードし、{}行を書いたCSVをCSVファイル選択で選んで「CSVファイルのアップロード」を押し、表示された確認モーダルでアップロードを確定する（{}）。グッズ商品は状態ニアミントの規格が1件作られる。"
CAT_GOODS = "商品カテゴリ(ID)はサプライ・グッズのカテゴリID（カテゴリ登録/編集画面の最上位の一覧で「サプライ・グッズ」の行のID欄に表示された値）"

def search(key, label):
    return f"商品マスター(検索入力)で商品コードに「{key}」を入れて「検索する >」を押し、商品マスター(検索結果)の行の商品IDに表示された番号を控える（〔{label}〕）。"

def regtext(r, label):
    k = r.get('how', 'new')
    lang, st = r['lang'], r['state']
    if k == 'csv':
        s = f"商品規格一覧で言語ID {lang}の言語・状態{st}の規格（取り込みで作られた規格）の行を開き、商品規格登録編集画面で"
        if r.get('rep'): s += f"代表画像に{r['rep']}を選び、"
        elif r.get('norep'): s += "代表画像は選ばず、"
        s += f"基準価格(円)に{r['base']}、販売価格(円)に{r['sale']}、買取価格(円)に{r['buy']}を入れ、部門は選択肢の先頭を選び、公開ステータスに「公開」を選んで「商品規格を登録」ボタンを押す。商品規格登録編集画面の商品規格ID欄に表示された番号を控える（〔{label}〕）。"
        return s
    s = f"商品規格一覧の「新規作成」を押し、商品規格登録編集画面で言語に言語ID {lang}の言語、状態に{st}を選び、"
    s += f"商品コードに「{r['code']}」、"
    if r.get('limit'): s += f"販売制限数に{r['limit']}、"
    if r.get('rep'): s += f"代表画像に{r['rep']}を選び、"
    elif r.get('norep'): s += "代表画像は選ばず、"
    s += f"基準価格(円)に{r['base']}、販売価格(円)に{r['sale']}、買取価格(円)に{r['buy']}を入れ、部門は選択肢の先頭を選び、公開ステータスに「公開」を選んで「商品規格を登録」ボタンを押す。商品規格登録編集画面の商品規格ID欄に表示された番号を控える（〔{label}〕）。"
    return s

OPEN_EDIT = "商品マスター(検索結果)の行から商品登録編集画面（既存の商品の編集）を開き、"
OPEN_REGS = "商品登録編集画面の「規格設定」ボタンから商品規格一覧を開く。"
STRIP = re.compile(r"(販売制限数\d+・)?基準価格\d+・販売価格\d+・買取価格\d+・")

def csv_goods_cols(r, nm_ja, nm_en, size, weight, extra, limit_region="2"):
    ja = nm_ja[1:] if nm_ja.startswith("@") else f"「{nm_ja}」"
    c = (f"商品IDは空・商品コードは「{r['code']}」・言語(ID)は言語ID {r['lang']}・商品公開ステータスは2（公開）・支店の商品公開ステータスは1（公開）・商品名(日)は{ja}・商品名(英)は「{nm_en}」・サイズ{size}・重量{weight}・{CAT_GOODS}・購入グループ名称は「通常商品」・")
    c += extra
    if r.get('limit'): c += f"販売制限数{r['limit']}・"
    c += f"基準価格{r['base']}・販売価格{r['sale']}・買取価格{r['buy']}・原価単価10・地域別販売制限は{limit_region}・スマレジ連携フラグは0・スマレジ商品コードと部門IDは空"
    return c

def product_card(n, card, cardlabel, nm_ja, nm_en, plabel, csvextra, size, weight, cats, edit_pre, regs, key=None, edit_extra="", cardmode="new", region="2"):
    """カード商品1点分。商品はグッズ商品CSVで作り、商品登録編集画面でカード指定・カテゴリ・割引率を直す"""
    csvextra = STRIP.sub("", csvextra)
    r0 = regs[0][0]
    if cardmode == "new":
        s = (f"カード新規登録画面でカード名(英)に「{card}」、点数で見たマナ・コストに0を入れ、カード詳細の行を1件足してレアリティ・レイアウト・プロモ種別・Foil・フレームをそれぞれ選択肢から選び、登録ボタンを押す。")
    else:
        s = cardmode
    s += UPG.format(1, csv_goods_cols(r0, nm_ja, nm_en, size, weight, csvextra, region))
    s += search(r0['code'], plabel)
    ja = nm_ja[1:] if nm_ja.startswith("@") else f"「{nm_ja}」"
    s += OPEN_EDIT + "「カード指定 >」ボタンを押し、"
    if cardmode == "new":
        s += (f"カード検索ポップアップのカード名(日/英)に「{card}」を入れて検索ボタンを押す。検索結果のID列に表示されたカード詳細IDを控え（〔{cardlabel}〕）、その行の決定ボタンを押す。")
    else:
        s += "カード検索ポップアップで登録したカード詳細の行の決定ボタンを押す。"
    s += f"続けて商品名(日)に{ja}、商品名(英)に「{nm_en}」を入れ（カード指定で自動で入った値は書き換える）、{edit_pre}"
    catt = "と".join(f"〔{c}〕" for c in cats) + "のカテゴリ" if cats else "単体カードのカテゴリ"
    s += f"商品カテゴリはサプライ・グッズの選択を外して{catt}を選び、{edit_extra}割引率に販売割引率に登録済みの割引率ID 5の割引率を選んで「商品を登録」ボタンを押す。"
    s += OPEN_REGS
    for r, lab in regs:
        s += regtext(r, lab)
    return s

# ---------------- M03-03 ----------------
CA, CB = "商品カテゴリID-M0303-共有A", "商品カテゴリID-M0303-共有B"
HEAD = "状態・属性に定めのない必須項目は、ここに書いた値を入れる。"
BASIS_C = "M03-27 L0123 L0124 L0134 L0192-L0238、M14-04 L0094 L0100 L0129-L0137、M03-02 L0073 L0075-L0077 L0091-L0130、M03-09 L0123-L0172"

def reg(n, k, lang, state, code=None, base=100, sale=100, buy=10, how='csv', **kw):
    d = dict(lang=lang, state=state, code=code or f"M0303-{n}-{k}", base=base, sale=sale, buy=buy, how=how)
    d.update(kw); return d

def tail(old, marker):
    i = old.index(marker); return old[i:]

def abolish():
    return OPEN_EDIT + "支店の商品公開ステータスに「公開」を選び、商品公開ステータスに「廃止」を選んで「商品を登録」ボタンを押す。"

def m0303(sid, old):
    n = sid.split('-')[-1]
    notes = []
    reason = ""
    # 汎用: 規格リストと呼び名
    def one(card=True, cats=(CA,), nmja=None, nmen=None, extra="", size=0, weight=0, edit_pre="", regs=None, key=None, abol=False, tl="", cardn=None, ee=""):
        s = HEAD + product_card(n, cardn or f"M0303CARD{n}", f"カード詳細ID-M0303-{n}", nmja or f"M0303CASE{n}", nmen or f"M0303CASE{n}",
                                f"商品ID-M0303-{n}", extra, size, weight, list(cats), edit_pre, regs, key=key, edit_extra=ee)
        if abol: s += abolish()
        return s + tl
    L = lambda k: f"規格ID-M0303-{n}{k}"
    if n == '001':
        regs = [(reg(n,'A',11,'NM'), L('A')), (reg(n,'B',12,'NM',how='new'), L('B')), (reg(n,'C',11,'EX',how='new'), L('C'))]
        new = one(regs=regs, abol=True)
    elif n == '002':
        regs = [(reg(n,'A',11,'NM'), L('A')), (reg(n,'B',12,'NM',how='new'), L('B'))]
        extra = ("商品説明(日)は「商品説明Ａ」・商品説明(英)は「Product Description A」・買取商品説明(日)は「買取説明Ａ」・買取商品説明(英)は「Buy Description A」・検索ワードは「CSV確認」・"
                 "略称タグ(ID)は〔略称タグID-M0303-共有〕の略称タグのID・フリーエリアは「出力確認用」・基準価格100・販売価格100・買取価格10・")
        new = one(nmja="出力商品Ａ", nmen="Export Product A", extra=extra, size=63, weight=120, regs=regs, abol=True, ee="買取減額率に買取減額率ID 7の買取減額率を選び、")
    elif n == '003':
        regs = [(reg(n,'A',11,'NM',base=900,sale=900,buy=300,limit=25), L('A')), (reg(n,'B',12,'NM',base=1800,sale=1800,buy=600,limit=50,how='new'), L('B')),
                (reg(n,'C',11,'EX',how='new'), L('C'))]
        new = one(extra="販売制限数25・基準価格100・販売価格100・買取価格10・", regs=regs, tl=tail(old, "発送日目安（"))
    elif n == '004':
        regs = [(reg(n,'A',11,'NM'), L(''))]
        new = one(extra="基準価格100・販売価格100・買取価格10・", regs=regs, abol=True)
    elif n == '005':
        regs = [(reg(n,'A',11,'NM',rep="1枚目と2枚目の画像"), L('A')), (reg(n,'B',12,'NM',how='new',rep="3枚目の画像"), L('B'))]
        extra = "売上分析タグ(ID)は〔売上分析タグID-M0303-共有A〕と〔売上分析タグID-M0303-共有B〕の売上分析タグのIDをカンマで区切った値・タグ(ID)は〔タグID-M0303-共有A〕と〔タグID-M0303-共有B〕のタグのIDをカンマで区切った値・基準価格100・販売価格100・買取価格10・"
        new = one(cats=(CA,CB), extra=extra, edit_pre="商品画像に画像ファイルを3枚追加し、", regs=regs, tl=tail(old, "3件目のタグ紐付け"))
    elif n == '006':
        regs = [(reg(n,'A',11,'NM',code="M0303-006-A"), L(''))]
        new = one(extra="略称タグ(ID)は空・基準価格100・販売価格100・買取価格10・", regs=regs, tl=tail(old, "商品の割引率と地域別販売制限"))
        reason = "元のシードの末尾でDBへ直接未設定にする割引率・地域別販売制限・言語は、取り込みと編集で5・2・言語ID 11を入れてから同じDB設定で未設定にする"
    elif n == '007':
        regs = [(reg(n,'A',11,'NM'), L('A')), (reg(n,'B',12,'NM',how='new'), L('B')), (reg(n,'C',11,'EX',how='new'), L('C'))]
        new = one(extra="基準価格100・販売価格100・買取価格10・", regs=regs, tl=tail(old, "商品一覧画面で商品IDに999999007"))
    elif n in ('013','014'):
        regs = [(reg(n,'A',11,'NM'), L('A')), (reg(n,'B',12,'NM',how='new'), L('B'))]
        new = one(extra="基準価格100・販売価格100・買取価格10・", regs=regs, tl=tail(old, f"商品一覧画面で商品IDに999999{n}"))
    elif n in ('015','016'):
        regs = [(reg(n,'A',11,'NM'), L(''))]
        new = one(extra="基準価格100・販売価格100・買取価格10・", regs=regs)
    elif n == '020':
        regs = [(reg(n,'A',11,'NM'), L(''))]
        new = one(cats=(CA,CB), extra="基準価格100・販売価格100・買取価格10・", regs=regs)
    elif n == '024':
        regs = [(reg(n,'A',11,'NM',norep=True), L(''))]
        new = one(extra="タグ(ID)と規格画像は空・基準価格100・販売価格100・買取価格10・", regs=regs, tl=tail(old, "商品カテゴリの紐付けなしは"))
    elif n == '025':
        regs = [(reg(n,'A',11,'NM'), L(''))]
        new = one(extra="基準価格100・販売価格100・買取価格10・", regs=regs, tl=tail(old, "商品一覧画面で商品IDに999999025"))
    elif n == '026':
        regs = [(reg(n,'A',11,'NM',norep=True), L(''))]
        new = one(nmja="@「M0303-026-B」の前後を半角ダブルクォートで挟んだ文字列（CSVのセルでは各ダブルクォートを2個重ねて全体をダブルクォートで囲む）", nmen="M0303-026-B", extra="タグ(ID)と規格画像は空・基準価格100・販売価格100・買取価格10・", regs=regs, tl=tail(old, "商品カテゴリの紐付けなしは"))
    elif n == '027':
        regsA = [(reg(n,'AA',11,'NM',code="M0303-027AA",base=120,sale=120,rep="追加した画像"), L('A1')), (reg(n,'AB',11,'NM',code="M0303-027AB",base=130,sale=130,rep="追加した画像",how='new'), L('A2'))]
        regsB = [(reg(n,'B',11,'NM',code="M0303-027B",base=250,sale=250,rep="追加した画像"), L('B'))]
        a = HEAD + product_card(n, "M0303CARD027A", "カード詳細ID-M0303-027A", "M0303-027-A", "M0303-027-A", "商品ID-M0303-027A",
                                "基準価格120・販売価格120・買取価格10・", 0, 0, [], "商品画像に画像ファイルを1枚追加し、", regsA)
        b = product_card(n, "M0303CARD027B", "カード詳細ID-M0303-027B", "M0303-027-B", "M0303-027-B", "商品ID-M0303-027B",
                         "基準価格250・販売価格250・買取価格10・", 0, 0, [], "商品画像に画像ファイルを1枚追加し、", regsB)
        new = a + b
    elif n == '028':
        regs = [(reg(n,'A',11,'NM',code="M0303-028",rep="追加した画像"), L(''))]
        new = one(nmja="M0303-028-A", nmen="M0303-028-A", extra="基準価格100・販売価格100・買取価格10・", edit_pre="商品画像に画像ファイルを1枚追加し、", regs=regs)
    elif n == '029':
        regs = [(reg(n,'A',11,'NM',code="M0303-029",rep="追加した画像"), L(''))]
        new = one(cats=(), nmja="M0303-029-A", nmen="M0303-029-A", extra="売上分析タグ(ID)は〔売上分析タグID-M0303-共有A〕の売上分析タグのID・タグ(ID)は〔タグID-M0303-共有A〕のタグのID・基準価格100・販売価格100・買取価格10・",
                  edit_pre="商品画像に画像ファイルを1枚追加し、", regs=regs)
    elif n in ('011','012'):
        new = HEAD + goods_paging(n)
    else:
        raise SystemExit(sid)
    return new, reason

def goods_paging(n):
    cols = (f"商品IDは空・商品コードは行ごとに「M0303-{n}-01」から「M0303-{n}-11」まで・言語(ID)は言語ID 11・商品公開ステータスは2（公開）・支店の商品公開ステータスは1（公開）・"
            f"商品名(日)と商品名(英)は行ごとに「M0303CASE{n}-01」から「M0303CASE{n}-11」まで・サイズ0・重量0・{CAT_GOODS}・購入グループ名称は「通常商品」・"
            "基準価格100・販売価格100・買取価格10・原価単価10・地域別販売制限は2・スマレジ連携フラグは0・スマレジ商品コードと部門IDは空")
    s = ("グッズ商品CSV登録で雛形ファイルをダウンロードし、11行を書いたCSVをCSVファイル選択で選んで「CSVファイルのアップロード」を押し、表示された確認モーダルでアップロードを確定する（" + cols + "）。"
         "グッズ商品は状態ニアミントの規格が1件作られる。"
         f"商品マスター(検索入力)で商品名(日/英)に「M0303CASE{n}」を入れて「検索する >」を押し、商品マスター(検索結果)の11行それぞれから商品登録編集画面（既存の商品の編集）を開き、"
         "商品カテゴリはサプライ・グッズの選択を外して〔商品カテゴリID-M0303-共有A〕のカテゴリを選び、割引率に販売割引率に登録済みの割引率ID 5の割引率を選んで「商品を登録」ボタンを押す（11商品すべて）。"
         "続けて11商品それぞれの商品登録編集画面の「規格設定」ボタンから商品規格一覧を開き、言語ID 11の言語・状態NMの規格の行を開いて、商品規格登録編集画面で部門は選択肢の先頭を選び、公開ステータスに「公開」を選んで「商品規格を登録」ボタンを押す（11規格すべて）。"
         f"商品一覧画面で商品名に「M0303CASE{n}」を入れて検索し、1ページ表示件数を10件に設定する")
    return s

# ---------------- A07-06 ----------------
BASIS_A = "M03-27 L0123 L0124 L0134 L0192-L0238、M03-02 L0075-L0077 L0092 L0111 L0129、M03-09 L0123-L0172、M14-04 L0129-L0137"
BLK = re.compile(r"(商品[A-D]): カード詳細の登録・編集画面で(.*?)商品一覧のID列に表示された商品IDを控える（〔(商品ID-[^〕]+)〕）。", re.S)

def a0706_block(m, tag, first_a):
    X, body, plabel = m.group(1), m.group(2), m.group(3)
    foil = re.search(r"Foilで「(.+?)」", body).group(1)
    lang = re.search(r"言語「(.+?)」", body).group(1)
    lid = {"日本語": "日本語のID", "英語": "英語のID"}[lang]
    code = f"A0706-{tag}"
    if first_a and X == '商品A':
        base = sale = buy = 1234
    else:
        base = sale = 100; buy = 10
    cols = (f"商品IDは空・商品コードは「{code}」・言語(ID)は{lid}・商品公開ステータスは2（公開）・支店の商品公開ステータスは1（公開）・商品名(日)は「{code}」・商品名(英)は「{code}」・サイズ1・重量1・{CAT_GOODS}・購入グループ名称は既存の購入グループの名称・"
            f"基準価格{base}・販売価格{sale}・買取価格{buy}・原価単価10・地域別販売制限は0・スマレジ連携フラグは0・スマレジ商品コードと部門IDは空")
    s = (f"{X}: カード詳細の登録・編集画面で、任意のカードに対しFoilで「{foil}」を選んだカード詳細を登録する。"
         + UPG.format(1, cols) + search(code, plabel)
         + OPEN_EDIT + f"「カード指定 >」ボタンを押し、カード検索ポップアップで登録したカード詳細の行の決定ボタンを押す。続けて商品名(日)に「{code}」、商品名(英)に「{code}」を入れ（カード指定で自動で入った値は書き換える）、商品カテゴリはサプライ・グッズの選択を外して単体カードのカテゴリを選び、割引率に販売割引率に登録済みの割引率を選び、公開状態は「公開」のまま「商品を登録」ボタンを押す。")
    if first_a and X == '商品A':
        s += ("商品登録編集画面の「規格設定」ボタンから商品規格一覧を開く。商品規格一覧で言語日本語・状態NMの規格（取り込みで作られた規格）の行を開き、商品規格登録編集画面で基準価格(円)に1234、販売価格(円)に1234、買取価格(円)に1234を入れて「商品規格を登録」ボタンを押す。"
              "続けて商品規格一覧の「新規作成」を押し、商品規格登録編集画面で言語に日本語、状態にSPを選び、基準価格(円)に987、販売価格(円)に987、買取価格(円)に987を入れ、部門は選択肢の先頭を選び、公開ステータスに「公開」を選んで「商品規格を登録」ボタンを押す。")
    return s

def a0706(sid, old):
    tag = sid.replace("S-A07-06-", "")
    first_a = sid == "S-A07-06-CARDS"
    if first_a:
        new, k = BLK.subn(lambda m: a0706_block(m, "CARDS-" + m.group(1)[-1], True), old)
        assert k == 4, k
        reason = "スマレジ連携に当たる（状態SPの規格の販売価格が300円以上）"
    else:
        new, k = BLK.subn(lambda m: a0706_block(m, tag, False), old)
        assert k == 1, (sid, k)
        reason = ""
    return new, reason

# ---------------- 出力 ----------------
def write(fid, fn, basis):
    h, rows = load(fid)
    ii = {c: i for i, c in enumerate(h)}
    out = ["\t".join(["シードID", "判定", "新しい投入方法", "新しい状態・属性", "根拠", "理由"])]
    for r in rows:
        new, reason = fn(r[0], r[ii["投入方法"]])
        for t in (new, reason):
            assert "\t" not in t and "\n" not in t
        out.append("\t".join([r[0], "直す", new, "", basis, reason]))
    (P / f"out/{fid}.tsv").write_text("\n".join(out) + "\n", encoding="utf-8")

if __name__ == "__main__":
    write("A07-06", a0706, BASIS_A)
    write("M03-03", m0303, BASIS_C)

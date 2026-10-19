#!/usr/bin/env python3
# B10 (M03-09 / M03-10 / M05-26) の書き直し生成。元の投入方法から「商品を作る部分」だけを書き換える
import re, pathlib, sys

P = pathlib.Path('/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/product_csv')


def load(fid):
    ls = [l.rstrip('\n').split('\t') for l in open(P / f'in/{fid}.tsv', encoding='utf-8')]
    return ls[0], [x for x in ls[1:] if x and x != ['']]


CAT = "商品カテゴリ(ID)はサプライ・グッズのカテゴリID（カテゴリ登録/編集画面の最上位の一覧で「サプライ・グッズ」の行のID欄に表示された値）"
UPG = ("グッズ商品CSV登録で雛形ファイルをダウンロードし、{n}行を書いたCSVをCSVファイル選択で選んで「CSVファイルのアップロード」を押し、"
       "表示された確認モーダルでアップロードを確定する（{cols}）。グッズ商品は状態ニアミントの規格が1件作られる。")
OPEN_EDIT = "商品マスター(検索結果)の行から商品登録編集画面（既存の商品の編集）を開き、"
OPEN_REGS = "商品登録編集画面の「規格設定」ボタンから商品規格一覧を開く。"
CARD_CATEGORY = "商品カテゴリはサプライ・グッズの選択を外して単体カードのカテゴリを選び、"


def row_cols(code, nja, nen, base, sale, buy, limit=None):
    c = (f"商品IDは空・商品コードは「{code}」・言語(ID)は日本語のID・商品公開ステータスは2（公開）・支店の商品公開ステータスは1（公開）・"
         f"商品名(日)は「{nja}」・商品名(英)は「{nen}」・サイズ1・重量1・{CAT}・購入グループ名称は既存の購入グループの名称・")
    if limit:
        c += f"販売制限数{limit}・"
    c += f"基準価格{base}・販売価格{sale}・買取価格{buy}・原価単価10・地域別販売制限は0・スマレジ連携フラグは0・スマレジ商品コードと部門IDは空"
    return c


def csv_step(rows):
    """rows: list of (code, nja, nen, base, sale, buy, limit)"""
    if len(rows) == 1:
        return UPG.format(n=1, cols=row_cols(*rows[0]))
    cols = "／".join(f"{i + 1}行目は" + row_cols(*r) for i, r in enumerate(rows))
    return UPG.format(n=len(rows), cols=cols)


def search(code, label):
    return f"商品マスター(検索入力)で商品コードに「{code}」を入れて「検索する >」を押し、商品マスター(検索結果)の行の商品IDに表示された番号を控える（〔{label}〕）。"


# ---------------------------------------------------------------- M03-09
P9_PROD = re.compile(
    r"商品登録画面で商品名\(日\)に「(?P<n>[^」]+)」、商品名\(英\)に「(?P<e>[^」]+)」を入れ、"
    r"(?P<mid>商品画像に[^、]*?アップロードし、|カード詳細情報の「カード指定」ボタンからカード検索を開いて登録済みのカードを1件選び（シングルカードにする）、)?"
    r"必須の購入グループ・サイズ・重量・割引率・販売制限・カテゴリに登録できる値を入れて「商品を登録」ボタンを押す。"
    r"登録後に表示される商品登録画面の「商品ID」欄の番号を控える（〔(?P<pl>[^〕]+)〕）。")
P9_NOREG = re.compile(r"商品規格は登録しない（商品登録だけでは商品規格は作られない）。")
P9_NOCARD = re.compile(r"カード詳細情報の「カード指定」は行わない（シングルカードにしない）。")
P9_SPEC = re.compile(
    r"〔(?P<pl>商品ID-[^〕]+)〕の商品規格登録/編集画面を新規登録の状態で開き、(?:(?P<ord>[12])件目の規格として)?"
    r"言語に(?P<lang>日本語|英語)、状態に(?P<st>[^、]+)、(?P<body>.+?)公開ステータスに公開を入れ(?P<post>て|、[^「]*?して)「商品規格を登録」ボタンを押す(?P<memo>（[^）]*）)?。"
    r"登録後に表示される編集画面の「商品規格ID」欄の番号を控える（〔(?P<sl>[^〕]+)〕）。")


def pick(body, pat):
    m = re.search(pat, body)
    return m


def spec_parts(s):
    body = s['body']
    code = re.search(r"商品コードに「([^」]+)」、", body).group(1)
    sale = re.search(r"販売価格に(\d+)、", body).group(1)
    base = re.search(r"基準価格に(\d+)、", body).group(1)
    buy = re.search(r"買取価格に(\d+)、", body).group(1)
    lim = re.search(r"販売制限数に(\d+)、", body)
    rest = re.sub(r"商品コードに「[^」]+」、|販売制限数に\d+、|販売価格に\d+、|基準価格に\d+、|買取価格に\d+、", "", body)
    return code, int(base), int(sale), int(buy), (lim.group(1) if lim else None), rest, body


def csv_spec_edit(s, keep_prices=False):
    code, base, sale, buy, lim, rest, body = spec_parts(s)
    if keep_prices or "セールフラグ" in body:
        rest = f"販売価格に{sale}、基準価格に{base}、" + rest
    o = f"{s['ord']}件目の規格として、" if s['ord'] else ""
    return (f"{o}商品規格一覧で言語日本語・状態ニアミントの規格（取り込みで作られた規格）の行を開き、商品規格登録編集画面で{rest}"
            f"公開ステータスに公開を入れ{s['post']}「商品規格を登録」ボタンを押す{s['memo'] or ''}。商品規格登録編集画面の商品規格ID欄に表示された番号を控える（〔{s['sl']}〕）。")


def new_spec(s):
    o = f"{s['ord']}件目の規格として、" if s['ord'] else ""
    return (f"{o}商品規格一覧の「新規作成」を押し、商品規格登録編集画面で言語に{s['lang']}、状態に{s['st']}、{s['body']}"
            f"公開ステータスに公開を入れ{s['post']}「商品規格を登録」ボタンを押す{s['memo'] or ''}。商品規格登録編集画面の商品規格ID欄に表示された番号を控える（〔{s['sl']}〕）。")


def product_edit_text(n, e, mid):
    """画像・カードを商品登録編集画面（既存の商品の編集）で入れる"""
    if mid and mid.startswith("商品画像"):
        return OPEN_EDIT + mid + "割引率に販売割引率に登録済みのものを選び、「商品を登録」ボタンを押す。"
    if mid and "カード指定" in mid:
        return (OPEN_EDIT + "「カード指定 >」ボタンを押し、カード検索ポップアップで登録済みのカードを1件選ぶ（シングルカードにする）。"
                f"続けて商品名(日)に「{n}」、商品名(英)に「{e}」を入れ（カード指定で自動で入った値は書き換える）、{CARD_CATEGORY}"
                "割引率に販売割引率に登録済みのものを選び、「商品を登録」ボタンを押す。")
    return ""


def m0309_block(text):
    out, pos = [], 0
    notes = []
    while True:
        m = P9_PROD.search(text, pos)
        if not m:
            out.append(text[pos:])
            break
        out.append(text[pos:m.start()])
        cur = m.end()
        pre = ""
        mm = P9_NOREG.match(text, cur)
        if mm:
            cur = mm.end()
            pre = "noreg"
        mm = P9_NOCARD.match(text, cur)
        nocard = ""
        if mm:
            cur = mm.end()
            nocard = mm.group(0)
        specs = []
        while True:
            sm = P9_SPEC.match(text, cur)
            if not sm:
                break
            specs.append(sm.groupdict())
            cur = sm.end()
        n, e, mid, pl = m['n'], m['e'], m['mid'], m['pl']
        first = None
        for s in specs:
            if s['lang'] == '日本語' and s['st'] == 'ニアミント':
                first = s
                break
        if first is not None:
            code, base, sale, buy, lim, _, _ = spec_parts(first)
            extra = None
        else:
            code, base, sale, buy, lim = f"{n}-NM", 1000, 1000, 100, None
            extra = code
        blk = csv_step([(code, n, e, base, sale, buy, lim)]) + search(code, pl)
        edited = product_edit_text(n, e, mid)
        blk += edited
        blk += nocard
        if specs or extra:
            blk += OPEN_REGS if edited else (OPEN_EDIT + "「規格設定」ボタンから商品規格一覧を開く。")
        for s in specs:
            blk += csv_spec_edit(s) if s is first else new_spec(s)
        if extra and not first:
            pass
        out.append(blk)
        pos = cur
        out.append("")  # placeholder
    return "".join(out), notes


# ---------------------------------------------------------------- M03-10
P10_PROD = re.compile(
    r"商品登録画面で商品名に「(?P<n>[^」]+)」、商品名\(英\)に「(?P<e>[^」]+)」を入れ、"
    r"(?P<card>カード指定はせず(?:（[^）]*）)?|カード詳細情報のカード指定でカードを1件選び（シングルカードにする）)、"
    r"割引率は(?P<disc>.+?)、買取減額率は(?P<rate>.+?)、販売制限は初期選択のまま、公開状態で公開を選んで「商品を登録」ボタンを押す。"
    r"商品マスター\(検索結果\)で商品名「[^」]+」の行に表示されたIDを控える（〔(?P<pl>[^〕]+)〕）。"
    r"商品「[^」]+」の商品規格一覧で新規登録ボタンを押し、商品規格登録画面で次の規格を1件ずつ登録する（どの規格も、(?P<common>.+?)最後に「商品規格を登録」ボタンを押す）。")
P10_SPEC = re.compile(
    r"（(?P<ord>\d)）言語=(?P<lang>日本語|英語)、状態=(?P<st>NM|SP|MP|HP)、商品コード「(?P<code>[^」]+)」、基準価格\(円\)=(?P<base>\d+)、買取価格\(円\)=(?P<buy>\d+)、"
    r"高額商品コード(?P<hi>は空|に「[^」]+」)、公開状態=(?P<pub>公開|非公開)(?P<memo>（価格はケースが使わない値）)?。"
    r"登録後の商品規格登録画面に表示された商品規格IDを控える（〔(?P<sl>[^〕]+)〕）。")
BASEPRICE = "販売価格(円)には基準価格(円)と同じ値を入れ、"


def p10_product_edit(n, e, card, disc, rate):
    s = OPEN_EDIT
    if "カード詳細情報" in card:
        s += ("「カード指定 >」ボタンを押し、カード検索ポップアップでカードを1件選ぶ（シングルカードにする）。"
              f"続けて商品名(日)に「{n}」、商品名(英)に「{e}」を入れ（カード指定で自動で入った値は書き換える）、{CARD_CATEGORY}")
    s += f"割引率は{disc}、買取減額率は{rate}、販売制限はCSVで入れた値のまま、公開状態は公開のまま「商品を登録」ボタンを押す。"
    return s


def p10_csv_edit(sp, common):
    c = common.replace(BASEPRICE, "")
    return (f"商品規格一覧で言語日本語・状態NMの規格（取り込みで作られた規格）の行を開き、商品規格登録編集画面で{c}高額商品コード{sp['hi']}、"
            f"公開ステータスに{sp['pub']}を入れて「商品規格を登録」ボタンを押す{sp['memo'] or ''}。商品規格登録編集画面の商品規格ID欄に表示された番号を控える（〔{sp['sl']}〕）。")


def p10_new(sp, common):
    lang = sp['lang']
    return (f"商品規格一覧の「新規作成」を押し、商品規格登録編集画面で言語に{lang}、状態に{sp['st']}、商品コードに「{sp['code']}」、基準価格(円)に{sp['base']}、買取価格(円)に{sp['buy']}、"
            f"高額商品コード{sp['hi']}、{common}公開ステータスに{sp['pub']}を入れて「商品規格を登録」ボタンを押す{sp['memo'] or ''}。商品規格登録編集画面の商品規格ID欄に表示された番号を控える（〔{sp['sl']}〕）。")


def m0310_block(text, sid):
    out, pos = [], 0
    while True:
        m = P10_PROD.search(text, pos)
        if not m:
            out.append(text[pos:])
            break
        out.append(text[pos:m.start()])
        cur = m.end()
        specs = []
        while True:
            sm = P10_SPEC.match(text, cur)
            if not sm:
                break
            specs.append(sm.groupdict())
            cur = sm.end()
        n, e, card, disc, rate, pl, common = (m[k] for k in ('n', 'e', 'card', 'disc', 'rate', 'pl', 'common'))
        first = next((s for s in specs if s['lang'] == '日本語' and s['st'] == 'NM'), None)
        if first:
            code, base, buy = first['code'], first['base'], first['buy']
        else:
            code, base, buy = f"{n.split(' ')[0]}-NM-DEL", 1000, 100
        blk = csv_step([(code, n, e, base, base, buy, None)]) + search(code, pl)
        blk += p10_product_edit(n, e, card, disc, rate)
        blk += OPEN_REGS
        for s in specs:
            blk += p10_csv_edit(s, common) if s is first else p10_new(s, common)
        if not first:
            # NM規格が要らない商品: 取り込みで作られたNM規格を、ほかの規格を足したあとに削除する
            blk += ("商品規格一覧で言語日本語・状態NMの規格（取り込みで作られた規格）の行を開き、商品規格登録編集画面の「商品規格を削除」ボタンを押し、"
                    "確認画面でOKを押す（商品に規格が複数あるので削除できる。論理削除として扱われる）。")
        out.append(blk)
        pos = cur
    return "".join(out)


def chain_block(old, sid):
    """SEARCHSTATE-009 / 016: 11商品を1つのCSVで作る"""
    num = sid.split('-')[-1]
    key = {"009": "009", "016": "016"}[num]
    rows = [(f"M0310-{key}-{i:02d}-JNM", f"連鎖商品-{key}-{i:02d}", f"Chain Product {key}-{i:02d}", 3000, 3000, 1000, None) for i in range(1, 12)]
    head = old[:old.index("商品を連鎖商品")]
    tail_start = old.index("商品IDは登録順に大きくなるので")
    tail = old[tail_start:]
    mid_paren = re.search(r"登録後の商品規格登録画面に表示された商品IDと商品規格IDを控える（(商品IDは.*?)）。商品IDは登録順", old).group(1)
    new = head
    new += ("商品を連鎖商品-%s-01から連鎖商品-%s-11まで、この順に11件作る。" % (key, key))
    new += csv_step(rows).replace("1行目は", "1行目は").replace("、基準価格", "、基準価格")
    new += (f"商品マスター(検索入力)で商品名(日/英)に「連鎖商品-{key}」を入れて「検索する >」を押す。"
            f"商品マスター(検索結果)の11行それぞれ（連鎖商品-{key}-01から連鎖商品-{key}-11の順）について、商品登録編集画面（既存の商品の編集）を開き、"
            "割引率は選択肢の先頭を選び、買取減額率は未選択のまま、販売制限はCSVで入れた値のまま、公開状態は公開のまま「商品を登録」ボタンを押し、"
            "続けて「規格設定」ボタンから商品規格一覧を開き、言語日本語・状態NMの規格（取り込みで作られた規格）の行を開いて、商品規格登録編集画面で"
            "販売種別は初期選択のまま、部門は選択肢の先頭、スマレジ連携フラグは連携しない、高額商品コードは空、公開ステータスに公開を入れて「商品規格を登録」ボタンを押す。"
            f"商品マスター(検索結果)の行の商品IDと、商品規格登録編集画面の商品規格ID欄に表示された番号を控える（{mid_paren}）。")
    new += tail
    return new


# ---------------------------------------------------------------- 出力
HDR = ["シードID", "判定", "新しい投入方法", "新しい状態・属性", "根拠", "理由"]
B27 = "M03-27 L0092・L0119・L0123・L0124・L0134・L0223"
B02 = "M03-02 L0075〜L0077・L0092・L0111・L0129"
B09 = "M03-09 L0099-L0100・L0130-L0134"
B09DEL = "M03-09 L0183・L0196-L0198"


def san(s):
    assert '\t' not in s and '\n' not in s
    return s


NEW_OK = {"001", "003", "004", "010", "013", "042", "098"}
NEW_NG = {"017": "規格が1件登録されること", "018": "部門を指定し任意項目を空にした規格が1件登録されること", "020": "規格件数が0件のままであること（登録されないこと）",
          "060": "規格が0件のままであること", "061": "規格が0件のままであること", "062": "規格が0件のままであること", "063": "規格が0件のままであること"}


def do_m0309():
    ih, I = load('M03-09')
    ix = {c: i for i, c in enumerate(ih)}
    out = []
    for r in I:
        sid, old, oattr = r[0], r[ix['投入方法']], r[ix['状態・属性']]
        n = sid.split('-')[-1]
        kind = sid.split('-')[3] if len(sid.split('-')) > 4 else ''
        if sid.startswith("S-M03-09-QA-"):
            out.append([sid, "直さない", "", "", "", "投入方法がすでにグッズ商品CSV登録で商品を作り、商品登録編集画面（既存の商品の編集）で割引率などを入れている"])
            continue
        if sid.split('-')[3] == 'NEW' and n in NEW_NG:
            out.append([sid, "直せない", "", "", f"{B27}、M03-09 L0196-L0198",
                        f"ケースは商品規格を0件の商品から始める（規格の数を確かめる）。グッズ商品CSV登録は状態ニアミントの規格を必ず1件作り（M03-27 L0124）、商品の最後の1件の規格は削除できない（M03-09 L0197）ため、規格0件の商品を作れない。ケースに影響: 期待結果が「{NEW_NG[n]}」で、取り込みで作られた規格が1件余ると数が合わない"])
            continue
        if sid.split('-')[3] == 'NEW':
            m = P9_PROD.search(old)
            nn, ee, pl = m['n'], m['e'], m['pl']
            code = f"{nn}-NM"
            new = csv_step([(code, nn, ee, 500, 500, 200, None)]) + search(code, pl)
            attr = ""
            why = ""
            if n != '013':
                attr = oattr.replace("商品規格0件", f"取り込みで作られたニアミント・日本語の規格が1件ある（商品コード「{code}」）")
                assert attr != oattr
                why = ("ケースに影響: 事前準備③「商品規格は0件」と食い違い、取り込みで作られたニアミント・日本語の規格が1件ある。"
                       "ケースの手順と期待結果は商品規格登録/編集画面を開いて画面の表示を確かめるだけで、規格の数を確かめない")
                if n == '098':
                    why = ("ケースに影響: 事前準備③「商品規格は0件」と食い違い、取り込みで作られたニアミント・日本語の規格が1件ある。"
                           "手順4でDBの規格を確認する期待結果は「登録された規格の状態がその他、状態名が水濡れ」で、新しく登録した規格の行を見分ければ足りる")
            else:
                why = "商品規格は登録しないシードだが取り込みで作られたニアミント・日本語の規格が1件ある。ケースは商品IDが999999013でないことと404だけで規格を使わない"
            out.append([sid, "直す", san(new), san(attr), f"{B27}、{B09}", why])
            continue
        new, _ = m0309_block(old)
        assert new != old and "商品登録画面で商品名" not in new, sid
        attr = ""
        why = ""
        basis = f"{B27}、{B09}"
        if kind == 'IMAGE' or n == '059':
            basis += f"、{B02}"
        if kind == 'OTHER':
            why = "元の規格はその他（状態名=水濡れ）の1件だけだが、取り込みで作られるニアミント・日本語の規格（商品コード「M0309-OTHER-005-NM」）が1件余る。ケースに影響: ケースは〔商品規格ID-M0309-005〕の規格だけを開くので表示は変わらない（規格の数・一覧は見ない）"
        if n in ('030', '031', '032'):
            why = "元の規格登録で価格履歴が1件作られる記述は原文のまま（取り込みと編集でも履歴が作られるかは未確認だが、末尾のDB操作で0件に揃う）"
        if n == '096':
            why = "元の「規格を画面から登録すると価格履歴が1件作られるので、そのままにする」は原文のまま。取り込みと編集で作られる価格履歴の件数が1件になるかは画面で確かめる必要がある。ケースに影響: 価格履歴1件の前提が崩れる可能性がある"
        if n in ('002', '019', '022', '059', '099'):
            why = ("スマレジ連携に当たる（スマレジ商品コード・スマレジ連携フラグは取り込みの列でなく規格の編集で入れる。取り込みはスマレジ連携フラグ0）。" + (why or ""))
        if n == '028':
            why = "セールフラグを有効にして販売価格500・基準価格700を持つ規格のため、取り込みの値とは別に規格の編集でも販売価格と基準価格を入れ直す"
        if n == '059':
            why += "元は商品登録画面でカードを選んだが、取り込んだ商品を編集して「カード指定 >」で選ぶ（M03-02 L0092）"
        if n in ('051', '052'):
            why = "1件目の商品と2件目の商品を別々のCSVで取り込み、商品IDの大小は取り込み順になる"
        out.append([sid, "直す", san(new), "", basis, why])
    return I, out


def do_m0310():
    ih, I = load('M03-10')
    ix = {c: i for i, c in enumerate(ih)}
    out = []
    for r in I:
        sid, old = r[0], r[ix['投入方法']]
        n = sid.split('-')[-1]
        if sid.startswith("S-M03-10-QA-"):
            out.append([sid, "直さない", "", "", "", "投入方法がすでにグッズ商品CSV登録で商品を作っている"])
            continue
        if n in ('009', '016'):
            new = chain_block(old, sid)
            why = "11商品を1つのCSVの行順に取り込む。商品IDは取り込みの行順に大きくなる前提（ケースは〔商品ID-M0310-%sA〕が最小で2ページ目になることに依る）" % n
            out.append([sid, "直す", san(new), "", f"{B27}、{B02}、{B09}", why])
            continue
        new = m0310_block(old, sid)
        assert new != old and "商品登録画面で商品名に" not in new, sid
        why = ""
        if n == '022':
            why = ("商品〔商品ID-M0310-022A〕は元はニアミントの規格が無い。CSVは必ずニアミントの規格を作るので、SP・MP・HPの規格を足したあと取り込みで作られたニアミントの規格を削除する"
                   "（規格が複数あるので削除できる M03-09 L0183。論理削除）。ケースに影響: 「NM規格なし・全規格が未削除」のうちDB上に論理削除済みのニアミントの規格の行が1件残る"
                   "（一括編集がNM規格なしとして扱うかはケース025の前提「削除したNM規格は無い扱い」と同じ）")
        if n in ('036', '037', '038', '040', '041', '044'):
            why = "スマレジ連携に当たる（取り込みはスマレジ連携フラグ0。連携するにする操作は規格の編集で行う）。" + ("シングルカードの商品は取り込んだあと「カード指定 >」で選び、単体カードのカテゴリに付け替える（M03-02 L0092）" if n in ("036", "037", "040", "041", "044") else "")
        if n in ('010', '011', '012', '014'):
            pass
        out.append([sid, "直す", san(new), "", f"{B27}、{B02}、{B09}" + (f"、{B09DEL}" if n == '022' else ""), why])
    return I, out


def do_m0526():
    ih, I = load('M05-26')
    ix = {c: i for i, c in enumerate(ih)}
    out = []
    for r in I:
        sid, old = r[0], r[ix['投入方法']]
        if sid == 'S-M05-26-QF-ORDER-041':
            out.append([sid, "直さない", "", "", "", "投入方法がすでにグッズ商品CSV登録で商品を作り、規格と公開ステータスを編集している。「ほかの必須列に入力チェックを通る任意の値」「基準価格と買取価格は買取価格が販売価格以下になる値」は曖昧な書き方のままだが、依頼文の決まりで直していない"])
            continue
        k = sid.split('-')[-1]
        no = {'049': '001', '050': '002'}[k]
        code = f"RE0526-{no}-A"
        nja = f"連携取込商品{no}"
        nen = f"M0526 Import Product {no}"
        cut = old.index("管理画面の在庫一覧で商品コード")
        tail = old[cut:]
        new = (csv_step([(code, nja, nen, 1000, 1000, 100, None)])
               + f"商品マスター(検索入力)で商品コードに「{code}」を入れて「検索する >」を押し、商品マスター(検索結果)の行から商品登録編集画面（既存の商品の編集）を開き、「規格設定」ボタンから商品規格一覧を開く。"
               + "商品規格一覧で言語日本語・状態ニアミントの規格（取り込みで作られた規格）の行を開き、商品規格登録編集画面で部門は選択肢の先頭を選び、公開ステータスに公開を入れて「商品規格を登録」ボタンを押す。"
               + tail)
        why = "元の規格登録は状態・言語・買取価格に任意の値としていたが、取り込みは状態ニアミント・言語日本語・買取価格100（販売価格1000以下）で作る。元の投入方法に部門の指定が無いが部門は必須（M03-09 L0100）なので先頭を選ぶ。元の商品名(英)は任意の値で、取り込みでは具体的な値にした"
        out.append([sid, "直す", san(new), "", f"{B27}、M03-09 L0099-L0100", why])
    return I, out


def write(fid, I, out):
    assert [r[0] for r in out] == [r[0] for r in I], fid
    with open(P / f'out/{fid}.tsv', 'w', encoding='utf-8') as f:
        f.write("\t".join(HDR) + "\n")
        for r in out:
            assert len(r) == 6, r[0]
            f.write("\t".join(san(x) for x in r) + "\n")


if __name__ == '__main__':
    for fid, fn in (('M03-09', do_m0309), ('M03-10', do_m0310), ('M05-26', do_m0526)):
        I, out = fn()
        write(fid, I, out)
        print(fid, len(out))

import re, pathlib, sys
P = pathlib.Path('/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/product_csv')
HDR = ["シードID", "判定", "新しい投入方法", "新しい状態・属性", "根拠", "理由"]
ls = [l.rstrip('\n').split('\t') for l in open(P/'in/F01-02.tsv', encoding='utf-8')]
IH, rows = ls[0], [x for x in ls[1:] if x and x != ['']]
CAT = "サプライ・グッズのカテゴリID（カテゴリ登録/編集画面の最上位の一覧で「サプライ・グッズ」の行のID欄に表示された値）"
NAV = "商品マスター(検索結果)の行から商品登録編集画面（既存の商品の編集）を開き、「規格設定」ボタンから商品規格一覧を開く。"
DISC = "割引率に販売割引率に登録済みの割引率を選び"

def buyof(n): return n if n <= 1 else n // 5
def num(s, base=None):
    s = s.strip()
    if s.startswith('1以上の任意'): return 500
    if s.startswith('基準価格'): return base
    m = re.match(r'(\d+)', s)
    return int(m.group(1))

def csv_cols(code, ja, en, vis, base, sale, buy, setlabel=None):
    return (f"商品IDは空・商品コードは「{code}」・商品名(日)は「{ja}」・商品名(英)は「{en}」・言語(ID)は日本語のID・商品公開ステータスは2（公開）"
            f"・支店の商品公開ステータスは{1 if vis=='公開' else 0}（{vis}）・サイズ1・重量1・商品カテゴリ(ID)は{CAT}・購入グループ名称は既存の購入グループの名称"
            + (f"・カードセット(ID)は〔{setlabel}〕" if setlabel else "") + f"・基準価格{base}・販売価格{sale}・買取価格{buy}・原価単価{buy}・地域別販売制限は0（日英の両サイト）・スマレジ連携フラグは0・スマレジ商品コードと部門IDは空")
def csv_sentence(rowtexts):
    n = len(rowtexts)
    body = rowtexts[0] if n == 1 else "／".join(f"{i+1}行目は{t}" for i, t in enumerate(rowtexts))
    return (f"グッズ商品CSV登録で雛形ファイルをダウンロードし、{n}行を書いたCSVをCSVファイル選択で選んで「CSVファイルのアップロード」を押し、表示された確認モーダルでアップロードを確定する（{body}）。"
            "グッズ商品は状態ニアミント・日本語の規格が1件作られる。")
def search(code, label):
    s = f"商品マスター(検索入力)で商品コードに「{code}」を入れて「検索する >」を押し"
    if label: s += f"、商品マスター(検索結果)の行の商品IDに表示された番号を控える（〔{label}〕）。"
    else: s += "、商品マスター(検索結果)に商品が表示されることを確かめる。"
    return s

def edit_sentence(p, first=True):
    """商品登録編集画面（既存の商品の編集）。必要な項目が無ければ空"""
    parts = []
    cardsel = None
    if p['card'] == 'any':
        cardsel = "カード検索ポップアップで検索結果の先頭の行の決定ボタンを押す"
    elif p['card'] and p['card'] != 'any':
        cardsel = f"カード検索ポップアップのカード名(日/英)に「{p['card']}」を入れて検索ボタンを押し、その行（Foil「あり」の詳細情報）の決定ボタンを押す"
    if cardsel:
        parts.append("「カード指定 >」ボタンを押し、" + cardsel + "。続けて商品名(日)に「%s」、商品名(英)に「%s」を入れ（カード指定で自動で入った値は書き換える）" % (p['name'], p['name']))
    items = []
    if p['cat']:
        items.append(f"商品カテゴリはサプライ・グッズの選択を外して「{p['cat']}」を選び")
    elif cardsel:
        items.append("商品カテゴリはサプライ・グッズの選択を外して単体カードのカテゴリを選び")
    if p['tag']:
        items.append(f"タグの「{p['tag']}」にチェックを入れ")
    if p['img']:
        items.append(f"商品画像に「{p['img']}」を選び")
    if not (cardsel or items): return ""
    s = "商品マスター(検索結果)の行から商品登録編集画面（既存の商品の編集）を開き、"
    s += ("、".join(parts) + "、") if parts else ""
    s += "、".join(items) + ("、" if items else "")
    s += DISC + "、公開状態は「公開」のまま「商品を登録」ボタンを押す。"
    return s

def parse_product(seg, cardname):
    p = {}
    m = re.search(r'商品名\(日\)に「(.+?)」', seg) or re.search(r'商品名\(日\)に任意の商品名（例「(.+?)」）', seg)
    p['name'] = m.group(1)
    if '「カード指定」を押して【カード】で登録したカード' in seg: p['card'] = cardname
    elif '「カード指定」を押して' in seg: p['card'] = 'any'
    else: p['card'] = None
    m = re.search(r'タグの「(.+?)」にチェック(?!せず)', seg); p['tag'] = m.group(1) if m else None
    if p['tag'] == '【タグ】で登録したタグ': p['tag'] = '__TAG__'
    m = re.search(r'カテゴリに「(.+?)」を選び', seg); p['cat'] = m.group(1) if m else None
    m = re.search(r'カードセットに「(.+?)」を選び', seg); p['set'] = m.group(1) if m else None
    m = re.search(r'商品画像に「(.+?)」を選び', seg); p['img'] = m.group(1) if m else None
    m = re.search(r'支店の商品公開ステータス=(公開|非公開)', seg); p['vis'] = m.group(1)
    m = re.search(r'商品一覧でこの商品名の行に表示されたIDを控える（〔(.+?)〕）', seg); p['label'] = m.group(1) if m else None
    return p

def parse_spec(head, seg):
    s = {'head': head}
    s['lang'] = '英語' if '言語=英語' in seg else '日本語'
    m = re.search(r'状態=(NM以外の選択肢|NM|カード状態ID (\d)の選択肢)', seg)
    st = m.group(1)
    s['nm'] = st.startswith('NM') and not st.startswith('NM以外')
    s['state'] = 'NM' if s['nm'] else ('SP' if st.startswith('NM以外') else f"カード状態ID {m.group(2)}の状態")
    base = num(re.search(r'基準価格\(円\)=(.+?)、', seg).group(1))
    s['base'] = base
    bm = re.search(r'買取価格\(円\)=(.+?)、', seg).group(1)
    s['buy'] = buyof(base if bm.startswith('基準価格') else int(re.match(r'(\d+)', bm).group(1)))
    s['saleflag'] = 'セールフラグ=チェックする' in seg
    sm = re.search(r'販売価格\(円\)=(.+?)(?:、|〈|$)', seg)
    s['sale'] = (base if sm.group(1).startswith('基準価格') else int(re.match(r'(\d+)', sm.group(1)).group(1))) if (sm and s['saleflag']) else base
    s['buy'] = min(s['buy'], s['sale'])
    m = re.search(r'高額商品コード=「(.+?)」', seg); s['high'] = m.group(1) if m else None
    m = re.search(r'商品規格編集に表示された商品規格IDを控える（〔(.+?)〕）', seg); s['label'] = m.group(1) if m else None
    return s

def spec_open_edit(s):
    t = (f"商品規格一覧で言語{s['lang']}・状態NMの規格（取り込みで作られた規格）の行を開き、商品規格登録編集画面で")
    items = []
    if s['saleflag']: items.append(f"セールフラグにチェックを入れ、販売価格(円)に{s['sale']}")
    if s['high']: items.append(f"高額商品コードに「{s['high']}」")
    t += "、".join(items) + ("を入れ、" if items else "") + "部門は選択肢の先頭を選んで「商品規格を登録」ボタンを押す。"
    if s['label']: t += f"商品規格登録編集画面の商品規格ID欄に表示された番号を控える（〔{s['label']}〕）。"
    return NAV + t

def spec_new(s, code):
    t = NAV + "商品規格一覧の「新規作成」を押し、商品規格登録編集画面で"
    t += f"言語に{s['lang']}、状態に{s['state']}を選び、商品コードに「{code}」、販売種別は既定のまま、基準価格(円)に{s['base']}、買取価格(円)に{s['buy']}、"
    if s['saleflag']: t += f"セールフラグにチェックを入れ、販売価格(円)に{s['sale']}、"
    if s['high']: t += f"高額商品コードに「{s['high']}」、"
    t += "部門は選択肢の先頭を選び、スマレジ連携フラグは連携しないを選び、公開ステータスに「公開」を選んで「商品規格を登録」ボタンを押す。"
    if s['label']: t += f"商品規格登録編集画面の商品規格ID欄に表示された番号を控える（〔{s['label']}〕）。"
    return t

BASIS = "M03-27 L0092・L0123・L0124・L0129・L0134・L0197・L0198・L0232、M03-02 L0075〜L0077・L0092・L0111・L0129、M03-09 L0077・L0130〜L0134・L0145・L0155"

def convert(sid, old):
    n3 = sid.split('-')[-1]
    notes, extra_basis = [], []
    segs = re.split(r'(?:(?<=。)|^)(?=【)', old)
    out = []
    # 前処理: カード名、タグ名
    cardname = None; tagname = None
    for sg in segs:
        if sg.startswith('【カード】'):
            cardname = re.search(r'カード名\(日\)に「(.+?)」', sg).group(1)
        if sg.startswith('【タグ】'):
            m = re.search(r'名称\(日\)に(?:「(.+?)」|任意のタグ名（例「(.+?)」）)', sg); tagname = m.group(1) or m.group(2)
    # ループ型
    li = next((i for i, g in enumerate(segs) if g.startswith('【商品・商品規格・支店在庫（')), None)
    if li is not None:
        return convert_loop(sid, old, segs, cardname, li), BASIS, ["元の各商品の規格は取り込みで作られる規格（言語日本語・状態NM）のまま使う", "部門は取込では空（ケースは部門を使わない）"]
    # 商品ごとに規格をまとめる
    prods = []  # (index, pdict, [specs idx])
    cur = None
    parsed = {}
    for i, sg in enumerate(segs):
        m = re.match(r'【(商品[A-Z]?)】管理画面の商品登録で', sg)
        if m:
            letter = m.group(1)[2:]
            p = parse_product(sg, cardname); p['letter'] = letter; p['seg'] = i
            if p['tag'] == '__TAG__': p['tag'] = tagname
            p['specs'] = []; prods.append(p); cur = p; continue
        m = re.match(r'【(商品規格[A-Z]?(?:のNM基準)?)】', sg)
        if m and cur is not None:
            s = parse_spec(m.group(1), sg); s['seg'] = i
            cur['specs'].append(s)
    for p in prods:
        p['code'] = f"F0102-{n3}{p['letter']}"
        ml = re.search(r'〔(カードセットID-[^〕]+)〕', old)
        p['setlabel'] = ml.group(1) if (p['set'] and ml) else None
        if p['set']: notes.append('カードセットは取込のカードセット(ID)列で入れ、カード指定のあとにカードセットは編集しない（シングルカードは編集不可 M03-02 L0073）。カード指定でカードセットがカード詳細のカードセットに変わる可能性があるため、検索結果の先頭のカードのカードセットが「'+p['set']+'」であることを確かめる必要がある（そうでなければ商品がこのカードセットに所属しなくなる）')
        csvs = next((s for s in p['specs'] if s['lang'] == '日本語' and s['nm']), None)
        p['csv'] = csvs
        if not p['specs']:
            p['csv_base'] = (500, 500, 100)
            notes.append("元は規格を作らない商品。取込では状態ニアミント・日本語の規格（基準価格500・販売価格500・買取価格100）が1件余る（最後の1件の規格は削除できない M03-09 L0197）。ケースへの影響は無い（このケースは絞込リンクの遷移だけを見る）")
            continue
        if csvs is None:
            # NM規格を持たない商品: 取込で作られるNM規格は、対象の規格を足したあとに削除する
            ref = p['specs'][0]
            p['csv_base'] = (ref['base'], ref['sale'], ref['buy'])
            notes.append("ケースに影響: 元はNMの規格が無い商品。取込で作られたNMの規格を、対象の規格を足したあと商品規格登録編集画面の「商品規格を削除」（論理削除）で消す。削除済みの規格がNM基準の判定に入らないことを確かめること")
            extra_basis.append("M03-09 L0159・L0183・L0197・L0198")
        else:
            p['csv_base'] = (csvs['base'], csvs['sale'], csvs['buy'])
    # セグメントの置換
    by_prod_seg = {p['seg']: p for p in prods}
    spec_owner = {}
    for p in prods:
        for s in p['specs']: spec_owner[s['seg']] = (p, s)
    for i, sg in enumerate(segs):
        if i in by_prod_seg:
            p = by_prod_seg[i]
            b, sl, by = p['csv_base']
            head = re.match(r'(【[^】]*】)', sg).group(1)
            new = head + csv_sentence([csv_cols(p['code'], p['name'], p['name'], p['vis'], b, sl, by, p['setlabel'])]) + search(p['code'], p['label'])
            new += edit_sentence(p)
            out.append(new)
        elif i in spec_owner:
            p, s = spec_owner[i]
            head = re.match(r'(【[^】]*】)', sg).group(1)
            if s is p['csv']:
                needs = s['saleflag'] or s['high'] or s['label']
                out.append(head + (spec_open_edit(s) if needs else "（取り込みで作られた規格をそのまま使う）"))
            else:
                suffix = re.sub(r'商品規格', '', s['head']).replace('のNM基準', 'N') or 'X'
                code = f"{p['code']}-{suffix}"
                out.append(head + spec_new(s, code))
            # NM規格を持たない商品の、最後の規格のあとで削除
        else:
            out.append(sg)
    # 043B のように NM規格が無い商品: 最後の規格セグメントの直後に削除手順を足す
    for p in prods:
        if p['csv'] is None:
            if not p['specs']: continue
            last = p['specs'][-1]['seg']
            out[last] = out[last] + (NAV + "商品規格一覧で言語日本語・状態NMの規格（取り込みで作られた規格）の行を開き、商品規格登録編集画面で「商品規格を削除」ボタンを押して削除する（この商品にNMの規格を残さない）。")
    # 整理: 規格を使わないだけの空セグメント
    text = "".join(out)
    if any(p['csv'] and not (p['csv']['saleflag'] or p['csv']['high'] or p['csv']['label']) for p in prods):
        notes.append("取り込んだ規格のうち開き直していないものは部門が空（元は部門を選択肢から選んでいた。ケースは部門を使わない）")
    return text, BASIS + ("、" + "、".join(extra_basis) if extra_basis else ""), notes

def convert_loop(sid, old, segs, cardname, li):
    n3 = sid.split('-')[-1]
    sg = segs[li]
    N = int(re.search(r'（(\d+)件）', sg).group(1))
    head = re.match(r'(【[^】]*】)', sg).group(1)
    p = parse_product(sg, cardname)
    nm = re.search(r'商品名\(日\)に「(.+?)」', sg).group(1) if '商品名(日)に「' in sg else None
    m2 = re.search(r'\(2\) .*?〈?', sg)
    sp = parse_spec('商品規格', re.search(r'\(2\) (.*?)\(3\) ', sg).group(1))
    # nn を含む商品名
    pat = re.search(r'商品名\(日\)に(?:「(.+?)」|任意の商品名（例「(.+?)」）)', sg)
    name_nn = pat.group(1) or pat.group(2)
    lab = re.search(r'商品一覧で各商品名の行に表示されたIDを控える（nn の順に(〔.+?〕〜〔.+?〕)）。', sg).group(1)
    code_nn = f"F0102-{n3}-nn"
    rowtexts = [csv_cols(code_nn, name_nn, name_nn, p['vis'], sp['base'], sp['sale'], sp['buy'])]
    csv = csv_sentence(rowtexts).replace("1行を書いたCSV", f"{N}行を書いたCSV").replace("（商品IDは空", f"（nn=01〜{N:02d}の各行は、nnを2桁の番号に置き換え、商品IDは空", 1)
    rowdesc = f"（nn=01〜{N:02d}の{N}行）"
    new = head + csv.replace("グッズ商品は状態ニアミント・日本語の規格が1件作られる。", f"グッズ商品は状態ニアミント・日本語の規格が商品ごとに1件作られる。")
    new += f"次の(1)〜(3)を、nn=01〜{N:02d} の{N}商品について繰り返す。"
    new += f"(1) 商品マスター(検索入力)で商品コードに「{code_nn}」を入れて「検索する >」を押し、商品マスター(検索結果)の行の商品IDに表示された番号を控える（nn の順に{lab}）。"
    p2 = dict(p); p2['name'] = name_nn
    es = edit_sentence(p2)
    if es: new += es.replace("商品マスター(検索結果)の行から商品登録編集画面", "続けて、その行から商品登録編集画面", 1)
    # (2) 規格
    if sp['saleflag']:
        new += "(2) " + spec_open_edit(sp).replace(NAV, "商品マスター(検索結果)の行から商品登録編集画面（既存の商品の編集）を開き、「規格設定」ボタンから商品規格一覧を開く。")
    else:
        new += "(2) 規格は取り込みで作られた規格（言語日本語・状態NM）をそのまま使う。"
    # (3)
    m3 = re.search(r'(\(3\) .*?確かめる。)', sg)
    new += m3.group(1)
    # 規格ID控え
    rest = sg[m3.end():]
    rest = re.sub(r'商品一覧で各商品名の行に表示されたIDを控える（nn の順に〔.+?〕〜〔.+?〕）。', '', rest)
    m = re.search(r'各商品の商品規格編集に表示された商品規格IDを控える（nn の順に(〔.+?〕〜〔.+?〕)）。', rest)
    if m:
        rest = rest.replace(m.group(0), f"各商品の商品規格一覧で言語日本語・状態NMの規格の行を開き、商品規格登録編集画面の商品規格ID欄に表示された番号を控える（nn の順に{m.group(1)}）。")
    new += rest
    # 以降のセグメント
    return "".join(segs[:li]) + new + "".join(segs[li+1:])

def run():
    out = []
    for r in rows:
        sid, old = r[0], r[5]
        txt, basis, notes = convert(sid, old)
        # 括弧のカード名など
        out.append([sid, "直す", txt, "", basis, "。".join(dict.fromkeys(notes))])
    return out

if __name__ == '__main__':
    out = run()
    with open(P/'out/F01-02.tsv', 'w', encoding='utf-8') as f:
        f.write("\t".join(HDR)+"\n")
        for r in out:
            assert all('\t' not in c and '\n' not in c for c in r), r[0]
            f.write("\t".join(r)+"\n")
    print(len(out))

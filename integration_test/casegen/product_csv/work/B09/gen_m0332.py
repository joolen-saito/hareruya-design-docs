import re, sys, pathlib
P = pathlib.Path('/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/product_csv')
CATSG = "サプライ・グッズのカテゴリID（カテゴリ登録/編集画面の最上位の一覧で「サプライ・グッズ」の行のID欄に表示された値）"
PRODNEW_RE = re.compile(r'^【画面】管理画面の「商品登録」で')
SPEC_RE = re.compile(r'^【画面】その商品の「商品規格一覧」で「新規登録」を押して「商品規格登録」を開く。画面の「商品ID」に表示された番号を控える（(〔[^〕]+〕)）。(.*?)登録後の画面の「商品規格ID」に表示された番号を控える（(〔[^〕]+〕)）。(.*)$', re.S)

def parse_spec(s):
    m = SPEC_RE.match(s)
    assert m, s[:120]
    pid, body, sid, extra = m.groups()
    code = re.search(r'商品コードに「([^」]+)」', body).group(1)
    st = re.search(r'(?<!公開)状態に「(\w+)」、', body)
    state = st.group(1) if st else 'NM'
    base = int(re.search(r'基準価格\(円\)に「(\d+)」', body).group(1))
    sale = bool(re.search(r'セールフラグ(に|は)チェックを入れ', body))
    sm = re.search(r'販売価格\(円\)に「(\d+)」', body)
    sell = int(sm.group(1)) if sm else base
    bm = re.search(r'買取価格\(円\)に(\d+)以下の任意の金額', body)
    buy = int(bm.group(1))
    assert buy <= sell, (code, buy, sell)
    smaregi = 'スマレジ連携フラグに「連携する」' in body
    b2 = body
    b2 = re.sub(r'商品コードに「[^」]+」、', '', b2, count=1)
    b2 = re.sub(r'(言語・状態・販売種別|言語・販売種別)に任意の値、', '', b2)
    b2 = re.sub(r'(?<!公開)状態に「\w+」、', '', b2)
    b2 = b2.replace('販売価格(円)に任意の金額', '販売価格(円)に%d' % sell)
    b2 = re.sub(r'買取価格\(円\)に(\d+)以下の任意の金額', r'買取価格(円)に\1', b2)
    b2 = b2.replace('部門に任意の値', '部門は選択肢の先頭を選び')
    assert '任意の金額' not in b2
    return dict(pid=pid, sid=sid, code=code, state=state, base=base, sell=sell, buy=buy, body=b2, extra=extra, smaregi=smaregi, sale=sale)

def csv_row(d, csvcode, name, extra_cols=''):
    return ("商品IDは空・商品コードは「%s」・言語(ID)は日本語のID・商品公開ステータスは2（公開）・支店の商品公開ステータスは1（公開）・商品名(日)は「%s」・商品名(英)は「%s」・サイズ1・重量1・商品カテゴリ(ID)は%s・購入グループ名称は既存の購入グループの名称・%s基準価格%d・販売価格%d・買取価格%d・原価単価10・地域別販売制限は0・スマレジ連携フラグは0・スマレジ商品コードと部門IDは空"
            % (csvcode, name, name, CATSG, extra_cols, d['base'], d['sell'], d['buy']))

def upload(rows):
    n = len(rows)
    if n == 1:
        paren = rows[0]
        lead = "1行を書いた"
    else:
        paren = '／'.join('%d行目は%s' % (i + 1, r) for i, r in enumerate(rows))
        lead = "%d行を書いた" % n
    return ("グッズ商品CSV登録で雛形ファイルをダウンロードし、%sCSVをCSVファイル選択で選んで「CSVファイルのアップロード」を押し、表示された確認モーダルでアップロードを確定する（%s）。グッズ商品は状態ニアミントの規格が1件作られる。" % (lead, paren))

def search(csvcode, pid):
    return "商品マスター(検索入力)で商品コードに「%s」を入れて「検索する >」を押し、商品マスター(検索結果)の行の商品IDに表示された番号を控える（%s）。" % (csvcode, pid)

def card_steps(name):
    return ("「カード指定 >」ボタンを押し、カード検索ポップアップの一覧から任意のカードを1件選んで決定ボタンを押す。続けて商品名(日)に「%s」、商品名(英)に「%s」を入れ（カード指定で自動で入った値は書き換える）、商品カテゴリはサプライ・グッズの選択を外して単体カードのカテゴリを選び、割引率に販売割引率に登録済みのものを選び、公開状態は「公開」のまま「商品を登録」ボタンを押す。" % (name, name))

def convert(method):
    segs = re.split(r'(?=【)', method)
    if segs and segs[0] == '': segs = segs[1:]
    # pre-text before first 【 (none expected)
    out = []; prods = []; first_idx = None
    i = 0
    while i < len(segs):
        s = segs[i]
        if PRODNEW_RE.match(s):
            assert i + 1 < len(segs) and segs[i+1].startswith('【画面】その商品の「商品規格一覧」で「新規登録」'), s[:80]
            d = parse_spec(segs[i+1])
            d['card'] = ('「カード指定」を押し' in s)
            d['nocard'] = ('「カード指定」は行わず' in s)
            prods.append(d)
            if first_idx is None:
                first_idx = len(out); out.append(None)
            i += 2; continue
        out.append(s); i += 1
    assert prods
    rows = []; flows = []
    dup_fix = {}
    for d in prods:
        d['name'] = d['code']
        d['csvcode'] = d['code'] + ('-CSV' if d['state'] != 'NM' else '')
    return prods, out, first_idx

def build(seed_id, method, dup_codes=None):
    prods, out, first_idx = convert(method)
    dup_codes = dup_codes or {}
    for d in prods:
        if d['code'] in dup_codes.get('codes', {}):
            pass
    # duplicate product codes (same final code more than once): CSV uses a unique temporary code, spec edit renames
    seen = {}
    for d in prods:
        seen.setdefault(d['code'], []).append(d)
    for code, lst in seen.items():
        if len(lst) > 1:
            for k, d in enumerate(lst):
                d['csvcode'] = '%s-%s' % (code, 'ABCDEFG'[k]) ; d['rename'] = code; d['name'] = d['csvcode']
    text = upload([csv_row(d, d['csvcode'], d['name']) for d in prods])
    for d in prods:
        text += search(d['csvcode'], d['pid'])
    for d in prods:
        sid = d['sid']
        edit_open = ("商品マスター(検索結果)の商品コード「%s」の行から商品登録編集画面（既存の商品の編集）を開き、" % d['csvcode']) if len(prods) > 1 else "商品マスター(検索結果)の行から商品登録編集画面（既存の商品の編集）を開き、"
        sp = d['state'] != 'NM'
        text += edit_open
        if d['card']:
            text += card_steps(d['name'])
            text += "商品登録編集画面の「規格設定」ボタンから商品規格一覧を開く。"
        else:
            text += "「規格設定」ボタンから商品規格一覧を開く。"
        body = d['body']
        codeclause = ''
        if d.get('rename'):
            codeclause = '商品コードに「%s」、' % d['rename']
        if sp:
            text += "商品規格一覧の「新規作成」を押し、商品規格登録編集画面で言語に日本語、状態に%s、商品コードに「%s」、%s" % (d['state'], d['code'], body)
        else:
            text += "商品規格一覧で言語日本語・状態NMの規格（取り込みで作られた規格）の行を開き、商品規格登録編集画面で%s%s" % (codeclause, body)
        text += "商品規格登録編集画面の商品規格ID欄に表示された番号を控える（%s）。" % sid
        text += d['extra']
    out[first_idx] = text
    return ''.join(out), prods

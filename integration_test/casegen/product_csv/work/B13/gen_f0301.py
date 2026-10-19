import re, sys
sys.path.insert(0, '/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/product_csv/work/B13')
from common import *

P_RE = re.compile(r"^商品登録編集画面で(?:、)?(?P<body>.*?)「商品を登録」を押(?:す|(?P<tail>し、商品ID欄に表示された番号を控える（〔(?P<lab>[^〕]+)〕）))$")
LAB_RE = re.compile(r"^商品ID欄に表示された番号を控える（〔(?P<lab>[^〕]+)〕）$")
S_RE = re.compile(r"^この商品の「規格設定」から商品規格登録編集画面を開き、商品コードに「(?P<code>[^」]+)」、(?:言語に(?P<lang>JP|EN)、)?状態に(?P<st>NM|EX|GD)(?P<mid>.*?)、部門を選び、公開ステータスに公開を選んで「商品規格を登録」を押す$")
SLAB_RE = re.compile(r"^商品規格ID欄に表示された番号を控える（〔[^〕]+〕）$")

BASIS = "M03-27 L0092・L0119・L0123・L0124・L0129・L0134・L0192-L0238、M03-02 L0073・L0075〜L0077・L0091-L0130、M03-09 L0123-L0172・L0197-L0198"


def parse_p(m):
    body = m.group('body')
    d = {'card': None, 'name': None, 'kw': None, 'img': None, 'cat': None, 'tag': None, 'cardset': None, 'branch': 0,
         'lab': m.group('lab'), 'tail': m.group('tail')}
    mc = re.match(r"「カード指定 >」で(.+?)を選び、", body)
    if mc:
        d['card'] = mc.group(1)
        body = body[mc.end():]
    mn = re.search(r"商品名に「([^」]+)」(（カードは指定しない）)?", body)
    if not mn:
        return None
    d['name'] = mn.group(1)
    mk = re.search(r"検索ワードに「([^」]+)」", body)
    d['kw'] = mk.group(1) if mk else None
    mi = re.search(r"「ファイルをアップロード」で画像ファイル(\S+?)をアップロードして商品画像にし", body)
    d['img'] = mi.group(1) if mi else None
    mcat = re.search(r"商品カテゴリに(.+?)を選び", body)
    d['cat'] = mcat.group(1) if mcat else None
    mt = re.search(r"(?:、|^)タグに(.+?)を選び", body)
    d['tag'] = mt.group(1) if mt else None
    ms = re.search(r"カードセットに(.+?)を選び", body)
    d['cardset'] = ms.group(1) if ms else None
    mb = re.search(r"支店の商品公開ステータスに(公開|非公開)", body)
    d['branch'] = 1 if (mb and mb.group(1) == '公開') else 0
    return d


def tag_ids(tag):
    m = re.match(r"タグID ([\d・]+)のタグ$", tag or "")
    if not m:
        return None
    return ",".join(m.group(1).split("・"))


def edit_sentences(d, notes, extra_edit=""):
    """商品登録編集画面で直す部分。要らなければ None"""
    parts = []
    cat = d['cat']
    switch = cat is not None and not cat.startswith("任意")
    named_tag = d['tag'] is not None and tag_ids(d['tag']) is None
    need = bool(d['card']) or switch or named_tag or d['cardset'] or d['img'] or extra_edit
    if not need:
        return None
    s = ""
    if d['card']:
        c = d['card'].replace("このカード", "直前に登録したカード")
        s += f"「カード指定 >」ボタンを押し、カード検索ポップアップで{c}の行の決定ボタンを押す。続けて商品名(日)に「{d['name']}」、商品名(英)に「{d['name']}」を入れ（カード指定で自動で入った値は書き換える）、"
    if d['img']:
        s += f"「ファイルをアップロード」で画像ファイル{d['img']}をアップロードして商品画像にし、"
    if named_tag:
        s += f"タグに{d['tag']}を選び、"
    if d['cardset'] and not d['card']:
        s += f"カードセットに{d['cardset']}を選び、"
    if switch:
        s += f"商品カテゴリはサプライ・グッズの選択を外して{cat}を選び、"
    s += extra_edit
    s += f"{DISC}て「商品を登録」ボタンを押す"
    s = s.replace("選びて", "選んで")
    return s


def default_prices(price):
    if price:
        p = int(price)
        return p, p, max(1, p // 10)
    return 1000, 1000, 100


def product_unit(d, sp, notes):
    """d: 商品登録の解析結果, sp: 最初の規格の解析結果(or None)。文のリストを返す"""
    nm = (sp is None) or sp['st'] == 'NM'
    code = sp['code'] if sp else d['name']
    if not nm:
        code = sp['code'] + "-NM"
    lang = (sp['lang'] if sp and sp['lang'] else 'JP')
    base, sale, buy = default_prices(sp['price'] if sp else None)
    extra = ""
    if d['kw']:
        extra += f"検索ワードは「{d['kw']}」・"
    ids = tag_ids(d['tag'])
    if ids:
        extra += f"タグ(ID)は{ids}・"
    out = [csv_upload([csv_row(code, d['name'], d['name'], lang, d['branch'], extra, base, sale, buy)])]
    e = edit_sentences(d, notes)
    if d['lab'] or e:
        out.append(search(code, d['lab']))
    else:
        out.append(search(code))
    if sp is None:
        out.append(OPEN_EDIT + e if e else "")
        out = [x for x in out if x]
    elif e:
        out.append(OPEN_EDIT + e)
        out.append(SPEC_OPEN_FROM_EDIT)
    else:
        out.append(SPEC_OPEN_NEW)
    if sp and nm:
        ex = ""
        if sp['sale']:
            ex += "セールフラグにチェックを入れ、"
        if sp['hi']:
            ex += f"高額商品コードに「{sp['hi']}」を入れ、"
        out.append(spec_edit(lang, ex))
    elif sp and not nm:
        ex = ""
        if sp['sale']:
            ex += "セールフラグにチェックを入れ、"
        if sp['hi']:
            ex += f"高額商品コードに「{sp['hi']}」を入れ、"
        pr = sp['price']
        out.append(f"商品規格一覧の「新規作成」を押し、商品規格登録編集画面で言語に{LANG[lang]}、状態に{sp['st']}を選び、商品コードに「{sp['code']}」、"
                   + (f"基準価格(円)・販売価格(円)に{pr}円、買取価格(円)に{max(1, int(pr) // 10)}円を入れ、" if pr else "")
                   + ex + "部門は選択肢の先頭を選び、公開ステータスに公開を選んで「商品規格を登録」ボタンを押す")
        out.append(f"商品規格一覧で状態ニアミントの規格（取り込みで作られた規格）の行を開き、商品規格登録編集画面で「商品規格を削除」ボタンを押す")
    elif not sp:
        pass
    return out


def subsequent_spec(m):
    rest = m.group(0)
    i = rest.index("商品コードに")
    tail = rest[i:]
    if m.group('lang') is None:
        tail = "言語に日本語、" + tail
    return "この商品の商品登録編集画面の「規格設定」ボタンから商品規格一覧を開いて「新規作成」を押し、商品規格登録編集画面で" + tail


def compare_block(prefix, n, cat_text, card_text, extra_conditions="", branch=0, cats_sentence="", stock_sentence=""):
    """比較商品 n 件: CSV n 行 + 各商品の編集"""
    rows = []
    for i in range(1, n + 1):
        code = f"{prefix}-C{i}"
        rows.append(csv_row(code, code, code, 'JP', branch))
    sent = [csv_upload(rows)]
    sent.append(f"商品コードが「{prefix}-C1」〜「{prefix}-C{n}」の{n}件それぞれについて、商品マスター(検索入力)で商品コードを入れて「検索する >」を押し、商品マスター(検索結果)の行から商品登録編集画面（既存の商品の編集）を開く")
    return sent


def convert_generic(sid, old, notes, overrides):
    sents = old.split("。")
    trailing = sents[-1] == ""
    if trailing:
        sents = sents[:-1]
    out = []
    i = 0
    seen_first_spec_for_product = False
    while i < len(sents):
        s = sents[i]
        hit = None
        for pre, r in overrides:
            if s.startswith(pre):
                hit = (pre, r)
                break
        if hit:
            r = hit[1]
            if r is not None:
                out.extend(r if isinstance(r, list) else [r])
            i += 1
            continue
        mp = P_RE.match(s)
        d = parse_p(mp) if mp else None
        if mp and d:
            j = i + 1
            if not d['lab'] and j < len(sents) and LAB_RE.match(sents[j]):
                d['lab'] = LAB_RE.match(sents[j]).group('lab')
                j += 1
            sp = None
            msp = S_RE.match(sents[j]) if j < len(sents) else None
            if msp:
                sp = msp.groupdict()
                mid = sp['mid']
                mp_ = re.search(r"販売価格に(\d+)円", mid)
                sp['price'] = mp_.group(1) if mp_ else None
                sp['sale'] = 'セールフラグにチェックを入れ' in mid
                mh_ = re.search(r"高額商品コードに「([^」]+)」", mid)
                sp['hi'] = mh_.group(1) if mh_ else None
                if sp['st'] != 'NM':
                    notes.append(f"最初の規格がNMでない {sid}")
                j += 1
            out.extend(product_unit(d, sp, notes))
            i = j
            seen_first_spec_for_product = True
            continue
        ms = S_RE.match(s)
        if ms:
            out.append(subsequent_spec(ms))
            i += 1
            continue
        out.append(s)
        i += 1
    return "。".join(out) + ("。" if trailing else "")
